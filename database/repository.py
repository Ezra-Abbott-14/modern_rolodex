"""Owner-scoped MySQL persistence for the Rolodexi MVP.

This module deliberately does not connect at import time. The server should create a
repository with a connection factory after loading its environment configuration.
"""

from __future__ import annotations

from datetime import datetime, timezone
import re
import unicodedata
import uuid
from typing import Any, Callable, Iterable, Mapping


PROFILE_FIELDS = (
    "name", "role", "met", "city", "phone", "email", "notes",
    "gender", "pronouns", "appearance",
)
OPTIONAL_PROFILE_FIELDS = PROFILE_FIELDS[1:]
CONNECTION_FACTORY = Callable[[], Any]
IDENTIFIER = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,62}$")


class RepositoryError(RuntimeError):
    """Base class for persistence errors safe for the API layer to classify."""


class ContactNotFound(RepositoryError):
    """The owner cannot access the requested contact."""


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_id() -> str:
    return str(uuid.uuid4())


def normalize_name(value: str) -> str:
    """Create a search aid without making names unique or authoritative."""
    normalized = unicodedata.normalize("NFKC", str(value or "")).casefold()
    normalized = "".join(character if character.isalnum() else " " for character in normalized)
    return " ".join(normalized.split())


def clean_optional(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    if value in {"—", "New connection", "Somewhere interesting", "Add a note next time you see them."}:
        return None
    return value or None


def require_owner(owner_id: Any) -> str:
    owner_id = clean_optional(owner_id)
    if not owner_id:
        raise ValueError("owner_id is required")
    return owner_id


def clean_profile(profile: Mapping[str, Any]) -> dict[str, Any]:
    name = clean_optional(profile.get("name"))
    if not name:
        raise ValueError("name is required")
    cleaned = {field: clean_optional(profile.get(field)) for field in PROFILE_FIELDS}
    cleaned["name"] = name
    for list_field in ("events", "tags"):
        values = profile.get(list_field, []) or []
        if not isinstance(values, (list, tuple)):
            raise ValueError(f"{list_field} must be a list")
        cleaned_values = []
        seen = set()
        for value in (clean_optional(item) for item in values):
            normalized = normalize_name(value or "")
            if value and normalized and normalized not in seen:
                seen.add(normalized)
                cleaned_values.append(value)
        cleaned[list_field] = cleaned_values
    return cleaned


def _row_dict(cursor: Any, row: Any) -> dict[str, Any] | None:
    if row is None:
        return None
    columns = [item[0] for item in cursor.description]
    return dict(zip(columns, row))


class ContactRepository:
    """Small transaction-oriented repository for contacts and their source data."""

    def __init__(self, connection_factory: CONNECTION_FACTORY):
        self.connection_factory = connection_factory

    def _connect(self) -> Any:
        return self.connection_factory()

    @staticmethod
    def _close(connection: Any) -> None:
        close = getattr(connection, "close", None)
        if close:
            close()

    @staticmethod
    def _rollback(connection: Any) -> None:
        rollback = getattr(connection, "rollback", None)
        if rollback:
            rollback()

    @staticmethod
    def _commit(connection: Any) -> None:
        commit = getattr(connection, "commit", None)
        if commit:
            commit()

    def create_contact(
        self,
        owner_id: str,
        profile: Mapping[str, Any],
        *,
        source_text: str | None = None,
        provider: str | None = None,
        model: str | None = None,
        source_expires_at: datetime | None = None,
        contact_id: str | None = None,
        now: datetime | None = None,
    ) -> dict[str, Any]:
        owner_id = require_owner(owner_id)
        profile = clean_profile(profile)
        contact_id = contact_id or new_id()
        now = now or utc_now()
        connection = self._connect()
        source_id = None
        try:
            cursor = connection.cursor()
            cursor.execute(
                """
                INSERT INTO contacts
                (id, owner_id, name, normalized_name, role, met, city, phone, email,
                 notes, gender, pronouns, appearance, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (contact_id, owner_id, profile["name"], normalize_name(profile["name"]),
                 *(profile[field] for field in OPTIONAL_PROFILE_FIELDS), now, now),
            )
            if source_text and source_text.strip():
                source_id = self._insert_source(
                    cursor, owner_id, source_text, contact_id=contact_id,
                    provider=provider, model=model, expires_at=source_expires_at,
                    status="processed", processed_at=now, now=now,
                )
            self._replace_memories(cursor, owner_id, contact_id, profile.get("events", []), source_id, now)
            self._replace_tags(cursor, owner_id, contact_id, profile.get("tags", []), now)
            self._commit(connection)
            return self._contact_payload(contact_id, owner_id, profile, now, now, profile.get("events", []), profile.get("tags", []))
        except Exception:
            self._rollback(connection)
            raise
        finally:
            self._close(connection)

    def get_contact(self, owner_id: str, contact_id: str) -> dict[str, Any] | None:
        owner_id = require_owner(owner_id)
        connection = self._connect()
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT id, owner_id, name, role, met, city, phone, email, notes, gender, pronouns, appearance, created_at, updated_at "
                "FROM contacts WHERE owner_id = %s AND id = %s AND deleted_at IS NULL",
                (owner_id, contact_id),
            )
            contact = _row_dict(cursor, cursor.fetchone())
            if contact is None:
                return None
            cursor.execute(
                "SELECT description FROM contact_memories "
                "WHERE owner_id = %s AND contact_id = %s AND deleted_at IS NULL ORDER BY created_at, id",
                (owner_id, contact_id),
            )
            contact["events"] = [row[0] for row in cursor.fetchall()]
            cursor.execute(
                "SELECT tag FROM contact_tags WHERE owner_id = %s AND contact_id = %s ORDER BY normalized_tag, id",
                (owner_id, contact_id),
            )
            contact["tags"] = [row[0] for row in cursor.fetchall()]
            return contact
        finally:
            self._close(connection)

    def list_contacts(self, owner_id: str) -> list[dict[str, Any]]:
        owner_id = require_owner(owner_id)
        connection = self._connect()
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT id, owner_id, name, role, met, city, phone, email, notes, gender, pronouns, appearance, created_at, updated_at "
                "FROM contacts WHERE owner_id = %s AND deleted_at IS NULL ORDER BY updated_at DESC, id",
                (owner_id,),
            )
            rows = [_row_dict(cursor, row) for row in cursor.fetchall()]
            contacts = [row for row in rows if row is not None]
            for contact in contacts:
                self._attach_children(cursor, owner_id, contact)
            return contacts
        finally:
            self._close(connection)

    def update_contact(
        self,
        owner_id: str,
        contact_id: str,
        changes: Mapping[str, Any],
        *,
        events: Iterable[str] | None = None,
        tags: Iterable[str] | None = None,
        now: datetime | None = None,
    ) -> None:
        owner_id = require_owner(owner_id)
        if "name" in changes:
            raise ValueError("name changes are not supported by partial update")
        allowed = set(PROFILE_FIELDS) - {"name"}
        fields = {field: clean_optional(changes[field]) for field in changes if field in allowed}
        if not fields and events is None and tags is None:
            raise ValueError("at least one contact change is required")
        now = now or utc_now()
        connection = self._connect()
        try:
            cursor = connection.cursor()
            if not self._contact_exists(cursor, owner_id, contact_id):
                raise ContactNotFound("contact not found for owner")
            if fields:
                assignments = ", ".join(f"{field} = %s" for field in fields)
                values = [fields[field] for field in fields]
                values.extend((now, owner_id, contact_id))
                cursor.execute(
                    f"UPDATE contacts SET {assignments}, updated_at = %s "
                    "WHERE owner_id = %s AND id = %s AND deleted_at IS NULL",
                    tuple(values),
                )
            elif events is not None or tags is not None:
                cursor.execute(
                    "UPDATE contacts SET updated_at = %s "
                    "WHERE owner_id = %s AND id = %s AND deleted_at IS NULL",
                    (now, owner_id, contact_id),
                )
            if events is not None:
                self._replace_memories(cursor, owner_id, contact_id, events, None, now)
            if tags is not None:
                self._replace_tags(cursor, owner_id, contact_id, tags, now)
            self._commit(connection)
        except Exception:
            self._rollback(connection)
            raise
        finally:
            self._close(connection)

    def create_meeting_source(
        self,
        owner_id: str,
        source_text: str,
        *,
        contact_id: str | None = None,
        expires_at: datetime | None = None,
        now: datetime | None = None,
    ) -> str:
        owner_id = require_owner(owner_id)
        source_text = str(source_text or "").strip()
        if not source_text:
            raise ValueError("source_text is required")
        now = now or utc_now()
        source_id = new_id()
        connection = self._connect()
        try:
            cursor = connection.cursor()
            if contact_id is not None and not self._contact_exists(cursor, owner_id, contact_id):
                raise ContactNotFound("contact not found for owner")
            self._insert_source(cursor, owner_id, source_text, contact_id=contact_id,
                                 expires_at=expires_at, status="pending", now=now,
                                 processed_at=None, provider=None, model=None,
                                 source_id=source_id)
            self._commit(connection)
            return source_id
        except Exception:
            self._rollback(connection)
            raise
        finally:
            self._close(connection)

    @staticmethod
    def _contact_exists(cursor: Any, owner_id: str, contact_id: str) -> bool:
        cursor.execute(
            "SELECT id FROM contacts WHERE owner_id = %s AND id = %s AND deleted_at IS NULL",
            (owner_id, contact_id),
        )
        return cursor.fetchone() is not None

    @staticmethod
    def _attach_children(cursor: Any, owner_id: str, contact: dict[str, Any]) -> None:
        cursor.execute(
            "SELECT description FROM contact_memories "
            "WHERE owner_id = %s AND contact_id = %s AND deleted_at IS NULL ORDER BY created_at, id",
            (owner_id, contact["id"]),
        )
        contact["events"] = [row[0] for row in cursor.fetchall()]
        cursor.execute(
            "SELECT tag FROM contact_tags WHERE owner_id = %s AND contact_id = %s ORDER BY normalized_tag, id",
            (owner_id, contact["id"]),
        )
        contact["tags"] = [row[0] for row in cursor.fetchall()]

    @staticmethod
    def _insert_source(
        cursor: Any,
        owner_id: str,
        source_text: str,
        *,
        contact_id: str | None,
        expires_at: datetime | None,
        status: str,
        now: datetime,
        processed_at: datetime | None,
        provider: str | None,
        model: str | None,
        source_id: str | None = None,
    ) -> str:
        source_id = source_id or new_id()
        cursor.execute(
            "INSERT INTO meeting_sources "
            "(id, owner_id, contact_id, source_type, source_text, created_at, expires_at, processed_at, processing_status, provider, model) "
            "VALUES (%s, %s, %s, 'text', %s, %s, %s, %s, %s, %s, %s)",
            (source_id, owner_id, contact_id, source_text, now, expires_at, processed_at, status, provider, model),
        )
        return source_id

    @staticmethod
    def _replace_memories(cursor: Any, owner_id: str, contact_id: str, memories: Iterable[str], source_id: str | None, now: datetime) -> None:
        cursor.execute(
            "DELETE FROM contact_memories WHERE owner_id = %s AND contact_id = %s",
            (owner_id, contact_id),
        )
        for memory in dict.fromkeys(str(value).strip() for value in memories if str(value).strip()):
            cursor.execute(
                "INSERT INTO contact_memories (id, owner_id, contact_id, description, source_id, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (new_id(), owner_id, contact_id, memory, source_id, now, now),
            )

    @staticmethod
    def _replace_tags(cursor: Any, owner_id: str, contact_id: str, tags: Iterable[str], now: datetime) -> None:
        cursor.execute(
            "DELETE FROM contact_tags WHERE owner_id = %s AND contact_id = %s",
            (owner_id, contact_id),
        )
        seen: set[str] = set()
        for tag in tags:
            display = str(tag).strip()
            normalized = normalize_name(display)
            if not display or not normalized or normalized in seen:
                continue
            seen.add(normalized)
            cursor.execute(
                "INSERT INTO contact_tags (id, owner_id, contact_id, tag, normalized_tag, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (new_id(), owner_id, contact_id, display, normalized, now),
            )

    @staticmethod
    def _contact_payload(contact_id: str, owner_id: str, profile: Mapping[str, Any], created_at: datetime, updated_at: datetime, events: Iterable[str], tags: Iterable[str]) -> dict[str, Any]:
        return {
            "id": contact_id,
            "owner_id": owner_id,
            **{field: profile.get(field) for field in PROFILE_FIELDS},
            "events": list(events),
            "tags": list(tags),
            "created_at": created_at,
            "updated_at": updated_at,
        }

"""Safe connectivity, bootstrap, and disposable-schema checks for Rolodexi.

This module has no import-time database side effects. Use one of the explicit
commands documented in database/README.md.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_FILE = Path(__file__).with_name("001_initial_schema.sql")
IDENTIFIER = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,62}$")
TABLES = {
    "contacts",
    "meeting_sources",
    "contact_memories",
    "contact_tags",
    "consent_records",
}
OWNER_TABLES = TABLES


def load_dotenv(path: Path) -> dict[str, str]:
    """Read simple KEY=value dotenv lines without printing or mutating os.environ."""
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
            value = value[1:-1]
        values[key] = value
    return values


DOTENV = load_dotenv(ROOT / ".env")


def setting(name: str, default: str | None = None, *, required: bool = False) -> str | None:
    value = os.environ.get(name, DOTENV.get(name, default))
    if required and not value:
        raise RuntimeError(f"Missing required setting {name} in .env or the environment.")
    return value


def identifier(value: str, label: str) -> str:
    if not IDENTIFIER.fullmatch(value):
        raise RuntimeError(f"{label} must contain only letters, digits, and underscores.")
    return value


def quote_identifier(value: str) -> str:
    return f"`{identifier(value, 'SQL identifier').replace('`', '``')}`"


def connector():
    try:
        import mysql.connector  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "mysql-connector-python is not installed in this Python environment."
        ) from exc
    return mysql.connector


def connect(*, database: str | None = None, admin: bool = False):
    mysql = connector()
    user_key = "DB_ADMIN_USER" if admin else "DB_USER"
    password_key = "DB_ADMIN_PASSWORD" if admin else "DB_PASSWORD"
    user = setting(user_key) or setting("DB_USER")
    password = setting(password_key) or setting("DB_PASSWORD")
    if not user or not password:
        raise RuntimeError(f"Missing {user_key} and/or {password_key}.")
    kwargs: dict[str, Any] = {
        "host": setting("DB_HOST", required=True),
        "port": int(setting("DB_PORT", "3306") or "3306"),
        "user": user,
        "password": password,
        "autocommit": False,
    }
    if database:
        kwargs["database"] = identifier(database, "Database name")
    return mysql.connect(**kwargs)


def execute_script(connection, script: str) -> None:
    cursor = connection.cursor()
    try:
        for statement in script.split(";"):
            statement = "\n".join(
                line for line in statement.splitlines() if not line.strip().startswith("--")
            ).strip()
            if statement:
                cursor.execute(statement)
        connection.commit()
    finally:
        cursor.close()


def check() -> None:
    connection = connect(database=setting("DB_NAME") or None, admin=True)
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION(), DATABASE(), CURRENT_USER()")
        version, database, current_user = cursor.fetchone()
        print(f"Connected: {setting('DB_HOST')}:{setting('DB_PORT', '3306')}")
        print(f"Server version: {version}")
        print(f"Current database: {database or '(none)'}")
        print(f"Authenticated MySQL account: {current_user}")
    finally:
        connection.close()


def create_users() -> None:
    app_user = identifier(setting("DB_APP_USER", "rolodexi_app") or "", "DB_APP_USER")
    test_user = identifier(setting("DB_TEST_USER", "rolodexi_test") or "", "DB_TEST_USER")
    app_password = setting("DB_APP_PASSWORD", required=True)
    test_password = setting("DB_TEST_PASSWORD", required=True)
    app_database = identifier(setting("DB_NAME", "rolodexi") or "rolodexi", "DB_NAME")
    test_database = identifier(setting("DB_TEST_NAME", "rolodexi_test") or "rolodexi_test", "DB_TEST_NAME")
    connection = connect(admin=True)
    try:
        cursor = connection.cursor()
        for user, password in ((app_user, app_password), (test_user, test_password)):
            account = f"'{user}'@'%'"
            cursor.execute(f"CREATE USER IF NOT EXISTS {account} IDENTIFIED BY %s", (password,))
            cursor.execute(f"ALTER USER {account} IDENTIFIED BY %s", (password,))
        cursor.execute(
            f"GRANT SELECT, INSERT, UPDATE, DELETE ON {quote_identifier(app_database)}.* "
            f"TO '{app_user}'@'%'"
        )
        cursor.execute(
            f"GRANT ALL PRIVILEGES ON {quote_identifier(test_database)}.* "
            f"TO '{test_user}'@'%'"
        )
        connection.commit()
        print(f"Created or refreshed least-privilege users: {app_user}, {test_user}")
        print(f"Application grants: SELECT, INSERT, UPDATE, DELETE on {app_database}.*")
        print(f"Test grants: ALL on {test_database}.*")
    finally:
        connection.close()


def migrate() -> None:
    """Apply the idempotent initial schema to the configured application database."""
    database = identifier(setting("DB_NAME", "rolodexi") or "rolodexi", "DB_NAME")
    connection = connect(database=database, admin=True)
    try:
        execute_script(connection, SCHEMA_FILE.read_text(encoding="utf-8"))
        print(f"Applied initial schema to database: {database}")
    finally:
        connection.close()


def expect_failure(cursor, statement: str, params: tuple[Any, ...]) -> None:
    try:
        cursor.execute(statement, params)
    except Exception:
        return
    raise AssertionError("Expected the database to reject invalid foreign-key data.")


def smoke() -> None:
    schema = f"rolodexi_smoke_{uuid.uuid4().hex[:12]}"
    admin_connection = connect(admin=True)
    created = False
    try:
        admin_cursor = admin_connection.cursor()
        admin_cursor.execute(f"CREATE DATABASE {quote_identifier(schema)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
        admin_connection.commit()
        created = True
        connection = connect(database=schema, admin=True)
        try:
            execute_script(connection, SCHEMA_FILE.read_text(encoding="utf-8"))
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES")
            actual_tables = {row[0] for row in cursor.fetchall()}
            assert TABLES <= actual_tables, f"Missing tables: {sorted(TABLES - actual_tables)}"

            for table in OWNER_TABLES:
                cursor.execute(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = 'owner_id'",
                    (table,),
                )
                assert cursor.fetchone()[0] == 1, f"{table} lacks owner_id"

            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS "
                "WHERE CONSTRAINT_SCHEMA = DATABASE()"
            )
            assert cursor.fetchone()[0] >= 4, "Expected relational foreign keys were not created"

            contact_id = str(uuid.uuid4())
            source_id = str(uuid.uuid4())
            memory_id = str(uuid.uuid4())
            tag_id = str(uuid.uuid4())
            consent_id = str(uuid.uuid4())
            owner = "smoke-owner"
            cursor.execute(
                "INSERT INTO contacts "
                "(id, owner_id, name, normalized_name, role, met, city, phone, email, notes, gender, pronouns, appearance, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))",
                (contact_id, owner, "Zoë 李 😀", "zoë 李 😀"),
            )
            cursor.execute(
                "INSERT INTO meeting_sources "
                "(id, owner_id, contact_id, source_type, source_text, created_at) "
                "VALUES (%s, %s, %s, 'text', %s, UTC_TIMESTAMP(6))",
                (source_id, owner, contact_id, "Met at café — 你好"),
            )
            cursor.execute(
                "INSERT INTO contact_memories "
                "(id, owner_id, contact_id, description, source_id, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))",
                (memory_id, owner, contact_id, "Enjoys crème brûlée", source_id),
            )
            cursor.execute(
                "INSERT INTO contact_tags "
                "(id, owner_id, contact_id, tag, normalized_tag, created_at) "
                "VALUES (%s, %s, %s, %s, %s, UTC_TIMESTAMP(6))",
                (tag_id, owner, contact_id, "Café", "café"),
            )
            cursor.execute(
                "INSERT INTO consent_records "
                "(id, owner_id, consent_type, policy_version, granted_at) "
                "VALUES (%s, %s, 'external_ai_processing', 'smoke-test', UTC_TIMESTAMP(6))",
                (consent_id, owner),
            )
            connection.commit()
            cursor.execute("SELECT name, role, phone FROM contacts WHERE id = %s", (contact_id,))
            name, role, phone = cursor.fetchone()
            assert name == "Zoë 李 😀" and role is None and phone is None
            expect_failure(
                cursor,
                "INSERT INTO contact_memories "
                "(id, owner_id, contact_id, description, created_at, updated_at) "
                "VALUES (%s, %s, %s, 'invalid', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))",
                (str(uuid.uuid4()), owner, str(uuid.uuid4())),
            )
            connection.rollback()
            print(f"Smoke test passed in disposable schema {schema}")
            print("Verified: five tables, owner fields, foreign keys, nullable fields, UTF-8 data, cleanup path")
        finally:
            connection.close()
    finally:
        if created:
            cleanup = connect(admin=True)
            try:
                cleanup_cursor = cleanup.cursor()
                cleanup_cursor.execute(f"DROP DATABASE {quote_identifier(schema)}")
                cleanup.commit()
            finally:
                cleanup.close()
        admin_connection.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("check", "create-users", "migrate", "smoke"))
    args = parser.parse_args()
    try:
        {"check": check, "create-users": create_users, "migrate": migrate, "smoke": smoke}[args.command]()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

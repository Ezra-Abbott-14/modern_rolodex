import unittest
from datetime import datetime

from database.repository import ContactRepository, normalize_name


class FakeCursor:
    def __init__(self):
        self.calls = []
        self.rowcount = 1
        self.description = []
        self.rows = []
        self.allowed_contacts = {("owner-a", "contact-1")}
        self.fail_on = None

    def execute(self, statement, params=()):
        if self.fail_on and self.fail_on in statement:
            raise RuntimeError("simulated database failure")
        self.calls.append((" ".join(statement.split()), params))
        if statement.lstrip().upper().startswith("SELECT"):
            if "SELECT id FROM contacts" in statement:
                self.description = [("id",)]
                self.rows = [(params[1],)] if (params[0], params[1]) in self.allowed_contacts else []
            elif "FROM contacts" in statement:
                self.description = [(field,) for field in ("id", "owner_id", "name", "role", "met", "city", "phone", "email", "notes", "gender", "pronouns", "appearance", "created_at", "updated_at")]
                self.rows = []
            else:
                self.rows = []

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def fetchall(self):
        return list(self.rows)

    def close(self):
        pass


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        return self.cursor_instance

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def close(self):
        pass


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.connection = FakeConnection()
        self.repository = ContactRepository(lambda: self.connection)
        self.now = datetime(2026, 11, 14, 12, 0, 0)

    def test_normalized_name_is_search_aid_not_identity(self):
        self.assertEqual(normalize_name("Zoë 李 😀"), "zoë 李")
        first = self.repository.create_contact("dev-user-1", {"name": "Alex Lee"}, now=self.now)
        second = self.repository.create_contact("dev-user-1", {"name": "Alex Lee"}, now=self.now)
        self.assertNotEqual(first["id"], second["id"])

    def test_create_converts_unknown_fields_to_null_and_scopes_owner(self):
        self.repository.create_contact(
            "dev-user-1",
            {"name": "Jamie Rivera", "role": "—", "phone": "", "tags": ["Coffee", "coffee"]},
            now=self.now,
        )
        insert = self.connection.cursor_instance.calls[0]
        self.assertIn("owner_id", insert[0])
        self.assertEqual(insert[1][1], "dev-user-1")
        self.assertIsNone(insert[1][4])
        self.assertIsNone(insert[1][7])

    def test_partial_update_does_not_write_omitted_fields(self):
        self.repository.update_contact("owner-a", "contact-1", {"notes": "new memory"}, now=self.now)
        statement, params = next(call for call in self.connection.cursor_instance.calls if "UPDATE contacts SET" in call[0])
        self.assertIn("notes = %s", statement)
        self.assertNotIn("email = %s", statement)
        self.assertEqual(params[-2:], ("owner-a", "contact-1"))

    def test_memory_or_tag_update_touches_contact_timestamp(self):
        self.repository.update_contact("owner-a", "contact-1", {}, events=[], now=self.now)
        self.assertTrue(any("UPDATE contacts SET updated_at" in call[0]
                            for call in self.connection.cursor_instance.calls))

    def test_name_only_update_is_rejected(self):
        with self.assertRaises(ValueError):
            self.repository.update_contact("owner-a", "contact-1", {"name": "Renamed"}, now=self.now)

    def test_owner_cannot_update_another_owners_contact(self):
        with self.assertRaises(Exception):
            self.repository.update_contact("owner-b", "contact-1", {"notes": "nope"}, now=self.now)

    def test_owner_cannot_attach_source_to_another_owners_contact(self):
        with self.assertRaises(Exception):
            self.repository.create_meeting_source("owner-b", "private note", contact_id="contact-1", now=self.now)

    def test_database_failure_rolls_back(self):
        self.connection.cursor_instance.fail_on = "INSERT INTO contact_memories"
        with self.assertRaises(RuntimeError):
            self.repository.create_contact(
                "owner-a", {"name": "Jamie", "events": ["memory"]}, now=self.now,
            )
        self.assertEqual(self.connection.rollbacks, 1)

    def test_child_writes_include_owner_scope_and_normalize_duplicate_tags(self):
        self.repository.create_contact(
            "owner-a",
            {"name": "Jamie", "events": ["Won a contest"], "tags": ["Coffee", "coffee"]},
            now=self.now,
        )
        calls = self.connection.cursor_instance.calls
        deletes = [call for call in calls if call[0].startswith("DELETE FROM contact_")]
        self.assertEqual(len(deletes), 2)
        self.assertTrue(all("owner_id = %s" in call[0] for call in deletes))
        tag_inserts = [call for call in calls if "INSERT INTO contact_tags" in call[0]]
        self.assertEqual(len(tag_inserts), 1)
        self.assertEqual(tag_inserts[0][1][1], "owner-a")

    def test_source_requires_owner_and_text(self):
        with self.assertRaises(ValueError):
            self.repository.create_meeting_source("", "note")
        with self.assertRaises(ValueError):
            self.repository.create_meeting_source("owner-a", " ")

    def test_source_insert_is_owner_scoped(self):
        source_id = self.repository.create_meeting_source("owner-a", "Met at the hackathon", now=self.now)
        self.assertTrue(source_id)
        statement, params = self.connection.cursor_instance.calls[0]
        self.assertIn("INSERT INTO meeting_sources", statement)
        self.assertEqual(params[1], "owner-a")


if __name__ == "__main__":
    unittest.main()

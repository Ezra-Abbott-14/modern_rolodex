import unittest
from unittest.mock import patch

import server


CONTACTS = [
    {"id": "maya", "name": "Maya", "notes": "Artist"},
    {"id": "maya-chen", "name": "Maya Chen", "notes": "Designer"},
]


class ExactNameMatchingTests(unittest.TestCase):
    def test_normalization_preserves_name_parts(self):
        self.assertEqual(server.normalize_name(" Maya! "), "maya")
        self.assertEqual(server.normalize_name("Maya Chen"), "maya chen")

    def test_maya_does_not_match_maya_chen(self):
        eligible = server.eligible_contacts(CONTACTS, "Maya")
        self.assertEqual([contact["id"] for contact in eligible], ["maya"])

    def test_two_maya_notes_can_use_existing_maya(self):
        result = {"matched_contact_id": "maya", "contact": {"name": "Maya"}}
        eligible = server.eligible_contacts(CONTACTS, "Maya")
        guarded = server.enforce_match_guard(result, eligible, "Maya")
        self.assertEqual(guarded["matched_contact_id"], "maya")

    def test_model_cannot_bypass_exact_name_guard(self):
        result = {"matched_contact_id": "maya-chen", "contact": {"name": "Maya Chen"}}
        eligible = server.eligible_contacts(CONTACTS, "Maya")
        guarded = server.enforce_match_guard(result, eligible, "Maya")
        self.assertEqual(guarded["matched_contact_id"], "")
        self.assertEqual(guarded["contact"]["name"], "Maya Chen")

    @patch("server.call_openai")
    def test_merge_api_only_sends_exact_name_candidates(self, call_openai):
        call_openai.return_value = {"matched_contact_id": "maya", "contact": {"name": "Maya"}}
        result = server.merge_contacts(CONTACTS, "Maya is an artist", "Maya")
        sent_contacts = call_openai.call_args.args[0]
        self.assertEqual([contact["id"] for contact in sent_contacts], ["maya"])
        self.assertEqual(result["matched_contact_id"], "maya")


if __name__ == "__main__":
    unittest.main()

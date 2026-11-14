# Testing expectations

The database workstream must add repeatable tests before considering a database area
complete. Tests must run without real API keys, real user data, or production data.

Required coverage as implementation grows:

- unit tests for validation, normalization, retention calculations, and access rules;
- integration tests for migrations, inserts, reads, updates, deletes, and constraints;
- contract tests for agreed database-facing API payloads;
- repeated-use tests for creating and updating the same contact;
- empty, malformed, oversized, duplicate, unauthorized, and expired data;
- a manual end-to-end check after the complete flow exists.

No database test framework or database test command has been selected. Existing
`test_server.py` and `test_profile_api.mjs` cover the current Gemini/Python/JavaScript
prototype; they do not prove that database storage exists.

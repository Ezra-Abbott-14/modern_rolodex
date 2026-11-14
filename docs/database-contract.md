# Database-facing JSON contract (MVP)

This is the initial contract between the backend persistence layer and the JS/API
workstream. It is a proposal for the current MVP, not a claim that routes exist yet.

## Contact object

```json
{
  "id": "uuid",
  "owner_id": "dev-user-1",
  "name": "Jamie Rivera",
  "role": null,
  "met": "Rexburg hackathon",
  "city": null,
  "phone": null,
  "email": null,
  "notes": "Met at the hackathon.",
  "gender": null,
  "pronouns": "they/them",
  "appearance": "Red glasses",
  "events": ["Won a robotics contest"],
  "tags": ["robotics"],
  "created_at": "2026-11-14T00:00:00Z",
  "updated_at": "2026-11-14T00:00:00Z"
}
```

`avatar` and `tone` are presentation values and are not authoritative database fields.
UI placeholders such as `"—"` and `"New connection"` must not be stored as user data;
unknown values are `null`.

## Meeting-source object

```json
{
  "id": "uuid",
  "contact_id": "uuid-or-null",
  "source_type": "text",
  "source_text": "I met Jamie at the hackathon...",
  "processing_status": "processed",
  "processing_error": null,
  "provider": "gemini",
  "model": "gemini-3.1-flash-lite",
  "created_at": "2026-11-14T00:00:00Z",
  "expires_at": null,
  "processed_at": "2026-11-14T00:00:03Z"
}
```

Raw provider responses are not stored in the MVP. Audio is not represented yet because
the recording flow does not exist. `owner_id` is the temporary development value until
the authentication service supplies an account subject.

## Rules

- All owner-scoped reads and writes must receive the authenticated/request owner ID.
- The browser never connects directly to MySQL.
- Missing profile fields remain `null`; later partial updates must not erase existing values.
- Same-name contacts are allowed until duplicate matching is decided.
- `events[]` maps to memorable facts in `contact_memories`, not an audit log.

# Database-facing JSON contract (MVP)

This is the current contract between the backend persistence layer and the JS/API
workstream. The routes below exist in `server.py`; account authentication is not yet
connected, so the server temporarily uses the fixed development owner `dev-user-1`.

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

When `source_text` is supplied through the contact-create route, its `expires_at` is set
to 30 days after creation. Automatic deletion is not implemented yet; an expiration
worker or scheduled cleanup remains required before this can be called enforced
retention.

## Rules

- All owner-scoped reads and writes must receive the authenticated/request owner ID.
- The browser never connects directly to MySQL.
- Missing profile fields remain `null`; later partial updates must not erase existing values.
- Same-name contacts are allowed. Creating a contact never silently merges; merging requires explicit user confirmation.
- `events[]` maps to memorable facts in `contact_memories`, not an audit log.
- Omitting `events` or `tags` during a partial update preserves existing values; sending an empty list intentionally clears that collection.
- Contact list and detail responses intentionally use the same contact shape, including `events` and `tags`.

## HTTP routes

- `GET /api/contacts` returns `{ "contacts": [...] }` for the development owner.
- `GET /api/contacts/{id}` returns `{ "contact": {...} }`, or `404` if it is not visible to that owner.
- `POST /api/contacts` accepts the contact fields plus optional `events`, `tags`, and `source_text`; it returns `201` with `{ "contact": {...} }`.
- `PATCH /api/contacts/{id}` accepts partial scalar fields plus optional `events` and `tags`; it returns `200` with `{ "contact": {...} }`.
- The browser never supplies `owner_id`; the backend supplies the temporary development owner.
- `GET /api/health` checks database connectivity and returns `200` only when the configured database answers `SELECT 1`.

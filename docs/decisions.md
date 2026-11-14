# Decisions and provisional decisions

Status: **decided** means stated by the team; **provisional** means direction chosen
but details remain; **open** means no choice exists.

| Date | Decision | Status | Notes |
| --- | --- | --- | --- |
| 2026-11-14 | Database work is a focused workstream; adjacent UI, JS, AI, network, and deployment changes require coordination. | Decided | User instruction. |
| 2026-11-14 | Contacts belong to user accounts and are private by default. | Provisional | Sharing is a low-priority stretch goal. |
| 2026-11-14 | Use an external authentication service rather than building password auth. | Provisional | Provider not selected; account support is high-priority stretch. |
| 2026-11-14 | Account deletion and data export are lower-priority stretch goals. | Decided | Required future work if accounts ship. |
| 2026-11-14 | Do not provide direct editing of original dictations/text inputs. | Provisional | Users may eventually view past inputs. |
| 2026-11-14 | Preserve meeting history when storage design permits it. | Provisional | Exact interface is outside this workstream. |
| 2026-11-14 | Store voice recordings in compressed form. | Decided | Format and storage location are open. |
| 2026-11-14 | Record user consent and consent date before external AI transmission. | Decided | UX and schema are open. |
| 2026-11-14 | Store phone numbers, email addresses, appearance descriptions, and related contact details. | Decided | Privacy/access controls are required. |
| 2026-11-14 | Include creation and update timestamps. | Decided | Deletion timestamps remain under discussion. |
| 2026-11-14 | Start simple; AWS/cloud hosting is a stretch goal. | Decided | Current implementation remains local. |
| 2026-11-14 | MySQL is the database owner's familiar technology, but storage is not chosen. | Open | Compare options before implementation. |
| 2026-11-14 | Use the provisioned AWS RDS MySQL 8.4 instance for the MVP database. | Decided | Single-AZ development instance; cloud deployment is the goal. |
| 2026-11-14 | Store all current UI profile fields, plus ownership and lifecycle metadata. | Decided | `avatar` and `tone` remain presentation values. |
| 2026-11-14 | Separate durable contacts from meeting-source records. | Decided | Source text is retained separately from the durable profile. |
| 2026-11-14 | Store UI events as memorable facts and tags in child tables. | Provisional | Duplicate-contact behavior is still open. |
| 2026-11-14 | Use `dev-user-1` as the temporary owner until authentication exists. | Decided | Replace with the auth provider subject later. |
| 2026-11-14 | Defer audio storage and raw AI response storage. | Decided | No recording flow exists; S3 is future work. |
| 2026-11-14 | Do not enforce automatic source deletion in the first database slice. | Decided | Store expiration metadata; deletion policy remains open. |

The initial schema is in `database/001_initial_schema.sql`; the JSON contract is in
`database-contract.md`. These are the first implementation artifacts, not the final
authentication, retention, or duplicate-matching design.

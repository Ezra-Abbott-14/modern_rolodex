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

No database plan, schema, or REST contract has been approved yet.

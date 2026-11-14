# Architecture and ownership boundaries

## Observed current system

The current application is a local Python server with a Gemini profile endpoint. The
browser sends a typed note, reviews extracted profile fields, and saves cards in
browser localStorage. A shared database, accounts, retention enforcement, and cloud
hosting are not implemented.

## Intended database boundary

The database workstream will own storage selection, schema/migrations, database access
rules, retention behavior, and database-facing tests. The database should eventually
associate contacts with an authenticated account and keep them private by default.

The durable contact profile and the temporary meeting source are separate concepts:
the profile can survive after a transcript or recording expires. This is a design
hypothesis, not an approved schema.

| Area | Current/expected owner | Database impact |
| --- | --- | --- |
| Contact UI and browser behavior | JS team | Consumes persistence contract |
| Gemini prompts and extraction | AI team | Produces profile input; provider retention is open |
| Storage and migrations | Database workstream | Owns persistence and tests |
| HTTP/API route layer | Unassigned | Must be agreed with JS and AI owners |
| Authentication | Unassigned | Managed service preferred; provider open |
| Hosting/deployment | Unassigned | AWS is a stretch goal |

If a database change requires edits outside database files or docs, explain the files,
impact, and owner first. After approval, use a specialized subagent for that boundary
and review its work before integration.

## Security and retention questions

The following are requirements to resolve before implementing storage: encryption at
rest and in transit, application-to-database authorization, sensitive-data logging,
temporary files and failed AI requests, deletion from provider copies and backups, and
consent withdrawal or re-consent behavior.

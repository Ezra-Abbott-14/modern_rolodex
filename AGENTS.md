# Rolodexi hackathon guidance

Before changing anything, read `README.md`, `docs/README.md`, and relevant files in `docs/`.
Treat documented decisions as the source of truth; label uncertainty and never invent facts.

## Product and current status
- Rolodexi helps people remember new acquaintances: note/dictation -> Gemini extraction -> reviewed card.
- Category: reimagine a past invention for today. Deadline: Nov 14, 2026, 4 p.m. America/Denver.
- Current app: local Python server, Gemini profile endpoint, browser review/save flow, database-backed contact routes, deck/search/export, and Street Valley.
- Current storage path is AWS RDS MySQL through the Python backend; the RDS schema and hosted flow still need final network/deployment verification. Accounts and retention enforcement are not implemented.
- Current tests: `python -m unittest -v test_server.py`; `python -m unittest discover -s database -p 'test_*.py'`; `node --test test_profile_api.mjs`; `node --check app.js`.

## Database workstream
- Own storage design, migrations, database-facing tests, and coordination contracts.
- Contacts belong to user accounts and are private by default; account auth is a high-priority stretch goal.
- Sharing, export, account deletion, and AWS/cloud hosting are stretch goals.
- Intended data includes durable contact profiles, meeting-source records, and consent/date evidence. Compressed voice recordings are deferred because the recording flow does not exist.
- Source text receives a 30-day expiration timestamp from creation; automatic cleanup, backups, and provider-side deletion remain unimplemented.

## Working rules
- Product, UI, JS behavior, AI provider, network, and deployment decisions belong to their owners; ask before changing adjacent code.
- Choose small implementation details and explain new concepts. Unknown is valid; document facts, decisions, open questions, and limitations.
- After each change, run affected tests; later run unit, integration, and manual end-to-end checks, including empty, wrong, and repeated use.
- When testing or evaluating a design, ask a subagent to argue against it; review and resolve disagreement before continuing.
- Use specialized subagents for approved cross-boundary work and review their changes before integration.
- Never commit secrets or real personal data. Keep credentials backend-only and prevent secret files from being served.
- Report broken/skipped work before what works. Commit each working step with a clear message.
- On `demo check`, run the whole demo like a judge, fix failures, and provide a five-line script.
- Keep README setup/troubleshooting current; keep this file concise and keep durable detail in `docs/`.

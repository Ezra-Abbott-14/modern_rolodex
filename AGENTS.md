# Rolodexi agent guidance

## Product and demo
- Rolodexi turns a short meeting note into a searchable contact card for people who want to remember acquaintances.
- Two-minute demo: introduce the modern rolodex, enter a memory, extract/review/save a card, reload/find it, and show Street Valley.
- Preserve the existing retro stacked-card design, animations, alphabet navigation, and Street Valley.
- Gemini extracts only explicitly stated facts; never infer missing gender, pronouns, appearance, or events.

## Architecture and status
- Flask/Waitress serves the app; Gemini is server-side; contacts persist in MySQL/RDS through `database/repository.py`.
- MVP uses a temporary fixed owner `dev-user-1`; real auth and sharing are not complete.
- Meeting source text is stored separately with a 30-day expiry field; automatic deletion is not implemented yet.
- Local setup: copy `.env.example` to `.env`, install `requirements.txt`, run `python server.py` at `http://localhost:8000`.
- Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; run `python database/db_harness.py migrate` before first use.

## Working rules
- Read `README.md`, `docs/`, and relevant tests before editing. Keep documentation truthful and update it when behavior changes.
- Database work owns schema, migrations, repository behavior, persistence routes, and database tests. Ask before changing unrelated UI/API behavior.
- Do the legwork: run changed code, unit/integration tests, and a full end-to-end flow. Cover empty input, wrong input, and doing it twice.
- Ask a review subagent to argue about risky verification/design decisions and reconcile disagreements before proceeding.
- Never commit passwords, API keys, private notes, audio, or `.env`; keep secrets server-side.
- Commit each working step with a clear message. Report broken or skipped work before what works.
- On `demo check`, run the whole judge flow, fix failures, and provide a five-line demo script.

# Folio / iHack 2026

- Build: an AI-assisted personal Rolodex for people who want to remember contacts.
- Theme/category: Re-Invent — Innovating Yesterday.
- Two-minute demo: add two notes about “Maya”; AI matches them into one Maya profile, while “Maya Chen” remains a separate person.
- Deadline: Saturday, November 14, 2026 at 4:00 PM local event time.
- Stack: browser HTML/CSS/JavaScript plus a small Python standard-library API server.
- Run: `export OPENAI_API_KEY="..." && python3 server.py`, then open `http://localhost:8000`.
- Test: syntax-check Python, exercise `/api/merge`, then run the browser flow manually.
- Done: typed capture, manual entry, search, filters, local storage, local fallback merge, AI API scaffold.
- Next: exact-name AI matching, API integration test, business-card capture only if time remains, demo polish.

## Working rules

- Build quickly; explain only when asked.
- Keep Maya and Maya Chen separate; merge only when the AI has strong identity evidence.
- Do not add features outside the agreed MVP without asking.
- Run changed code after every step and test empty input, bad input, and duplicate submission.
- Test unit logic, API integration, and the complete browser demo before calling it done.
- Never put API keys or passwords in source control.
- Commit each working step with a clear message.
- Report skipped or broken work before reporting successes.

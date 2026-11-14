# Rolodexi hackathon guidance

## Scope and demo
- Current main: type a short meeting note, extract details with Google Gemini, and create/update a person card for people who struggle to remember acquaintances.
- Category: "re-innovating yesterday, reimagine a past invention product or idea for today's world."
- Two-minute demo: introduce the traditional rolodex, enter a memory, extract/review/save a card, find it again, and show its Street Valley connection.
- Fields: name, explicitly stated gender/pronouns, meeting place, memorable events, and described appearance; never invent missing details.
- Deadline: November 14, 2026, 4 p.m. America/Denver (Rexburg, Idaho).
- Design: main's working card archive with ui_thinking's cream/ink/acid-green palette and R opening animation; vertical dark alphabet index, bottom-up next-card motion, no About/Why links, ticker, or Remember/Why section. Retain nine seed cards, saved contacts, and Street Valley.
- Team knows JavaScript, HTML, CSS, Python, C, C++, C#; explain each implementation step before prioritizing speed.
- Provider: Gemini; Flask/Waitress backend. Key remains server-side. AWS teammate is preparing hosting/RDS; provisioning and public HTTPS verification are explicitly deferred.
- Start the local backend with outbound network access; a restricted agent process can serve localhost but block Gemini (Windows 10013). After restarting, verify a real fictional-note extraction in the browser; fixture success alone does not verify provider connectivity.

## Run, test, and status
- Setup: `./setup.ps1` (or virtualenv + pip install -r requirements.txt). Run `./start.ps1` or activated-venv `python server.py`; local URL http://localhost:8000.
- Copy .env.example to .env and set GEMINI_API_KEY privately; optional GEMINI_MODEL defaults to gemini-3.1-flash-lite; output limit 2,048 tokens. Restart after changes.
- Implemented: typed notes, Gemini extraction, optional-field-safe review, exact-name merge, update dialog, localStorage, deck/search/export, and Street Valley.
- Tests: `./start.ps1 -Test` / virtualenv `python -m unittest discover -v -p 'test_*.py'` (25); `node --test test_profile_api.mjs` (12); syntax-check runtime JS. Fixture is test-only on 8001.
- Verified: live Gemini extraction/review/save/reload/search on Python port 8000 and supported Live Server port 5500; Python must stay running on 8000 for preview extraction.
- Verified main repair: nine fresh examples; Add/cancel/manual save, same-name merge, Update, search/index/navigation, export, village pause/resume, real Gemini save/reload. Dictation is not present in current main.
- Hosted mode requires HTTPS PUBLIC_ORIGIN, Gemini key, DEMO_ACCESS_CODE and SESSION_SECRET; one process/replica only. See DEPLOYMENT.md for proxy trust, secrets, limits, and pending second-device checks. RDS is not connected by this change.

## Working rules
- Do the legwork: run, test, research, and fix issues. Product, design, behavior, and tool decisions belong to the team; batch questions in one message.
- Choose small implementation details and explain those choices. Build only requested features and build them well.
- Keep README.md explicit and detailed: exact commands, expected results, architecture, configuration, troubleshooting, and verified limitations; keep AGENTS.md under 40 lines.
- For every major update, append DEVELOPMENT_LOG.md: date/branch, request, findings, changed files, key decisions with concise rationale, tests/results, limitations, next steps, and open questions with status/answers. Update it as work progresses; never log secrets, raw private notes/audio, or private internal reasoning.
- After each change, run the affected part and confirm its behavior. Open browser apps and use them; operate non-browser apps directly.
- Once the complete flow exists, run it start to finish as a person would, and repeat after later changes; claim completion only after observing it work.
- Test logic with unit tests, connections with integration tests, and the full flow manually and through automated end-to-end tests; cover empty input, wrong input, and doing it twice.
- Commit each working step clearly; never commit passwords or API keys. Keep API keys on the backend and prevent serving secret files.
- Report broken or skipped work before what works. Explain each step in a few sentences: what, why, and one point the team can explain to a judge.
- On "demo check", run the entire demo like a judge, fix failures, and provide a five-line demo script.

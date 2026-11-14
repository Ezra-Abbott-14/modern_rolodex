# Rolodexi hackathon guidance

## Scope and demo
- Current main: type a short meeting note, extract details with Google Gemini, and create/update a person card for people who struggle to remember acquaintances.
- Category: "re-innovating yesterday, reimagine a past invention product or idea for today's world."
- Two-minute demo: introduce the traditional rolodex, enter a memory, extract/review/save a card, find it again, and show its Street Valley connection.
- Fields: name, explicitly stated gender/pronouns, meeting place, memorable events, and described appearance; never invent missing details.
- Deadline: November 14, 2026, 4 p.m. America/Denver (Rexburg, Idaho).
- Preserve main's current retro stacked-card design, blue-purple styling, alphabet navigation, and Street Valley; retain the nine example cards and saved contacts.
- Team knows JavaScript, HTML, CSS, Python, C, C++, C#; explain each implementation step before prioritizing speed.
- Provider: Google Gemini; Python backend retained. Team key is configured in ignored .env; Gemini 3.1 Flash-Lite passed a live extraction. Deployment remains local.

## Run, test, and status
- Run: `python server.py` or Windows `./start.ps1`; open http://localhost:8000. Bundled Python was located and used successfully.
- Copy .env.example to .env and set GEMINI_API_KEY privately; optional GEMINI_MODEL defaults to gemini-3.1-flash-lite; output limit 2,048 tokens. Restart after changes.
- Implemented: typed notes, Gemini extraction, optional-field-safe review, exact-name merge, update dialog, localStorage, deck/search/export, and Street Valley.
- Tests: `python -m unittest -v test_server.py` (13 tests); `node --test test_profile_api.mjs` (10 tests); syntax-check all runtime JS modules. `python browser_fixture.py` is test-only on port 8001.
- Verified: live Gemini extraction/review/save/reload/search on Python port 8000 and supported Live Server port 5500; Python must stay running on 8000 for preview extraction.
- Verified main repair: nine fresh examples; Add/cancel/manual save, same-name merge, Update, search/index/navigation, export, village pause/resume, real Gemini save/reload. Dictation is not present in current main.

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

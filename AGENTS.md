# Rolodexi hackathon guidance

## Scope and demo
- Website for people who struggle to remember new acquaintances: dictate a short meeting note, extract details with Google Gemini, and create a person card.
- Category: "re-innovating yesterday, reimagine a past invention product or idea for today's world."
- Two-minute demo: introduce the traditional rolodex, dictate a memory, show extracted details, then find the new card in the deck.
- Fields: name, explicitly stated gender/pronouns, meeting place, memorable events, and described appearance; never invent missing details.
- Deadline: November 14, 2026, 4 p.m. America/Denver (Rexburg, Idaho).
- Preserve the main-branch Rolodexi style closely: wood case, teal alphabet index, cream stacked cards, retro typography and navigation.
- Team knows JavaScript, HTML, CSS, Python, C, C++, C#; explain each implementation step before prioritizing speed.
- Provider: Google Gemini; Python backend retained. Team key is configured in ignored .env; Gemini 3.1 Flash-Lite passed a live extraction. Deployment remains local.

## Run, test, and status
- Run: `python server.py` or Windows `./start.ps1`; open http://localhost:8000. Bundled Python was located and used successfully.
- Copy .env.example to .env and set GEMINI_API_KEY privately; optional GEMINI_MODEL defaults to gemini-3.1-flash-lite; output limit 2,048 tokens. Restart after changes.
- Implemented: browser dictation, editable note, /api/profile Gemini extraction, profile review/save, required fields, localStorage, and existing deck/search/export.
- Tests: `python -m unittest -v test_server.py`; `node --test test_profile_api.mjs`; `node --check app.js`. `python browser_fixture.py` is test-only on port 8001.
- Verified: 11 Python and 7 JS tests; wrong-server recovery on Live Server port 5500, two live Gemini extractions after the fix, review/save, reload/appearance search.
- Next: finish a spoken-microphone demo check with the team; actual microphone transcription remains unverified. Go was granted for implementation.

## Working rules
- Do the legwork: run, test, research, and fix issues. Product, design, behavior, and tool decisions belong to the team; batch questions in one message.
- Choose small implementation details and explain those choices. Build only requested features and build them well.
- Keep README.md explicit and detailed: exact commands, expected results, architecture, configuration, troubleshooting, and verified limitations; keep AGENTS.md under 40 lines.
- After each change, run the affected part and confirm its behavior. Open browser apps and use them; operate non-browser apps directly.
- Once the complete flow exists, run it start to finish as a person would, and repeat after later changes; claim completion only after observing it work.
- Test logic with unit tests, connections with integration tests, and the full flow manually and through automated end-to-end tests; cover empty input, wrong input, and doing it twice.
- Commit each working step clearly; never commit passwords or API keys. Keep API keys on the backend and prevent serving secret files.
- Report broken or skipped work before what works. Explain each step in a few sentences: what, why, and one point the team can explain to a judge.
- On "demo check", run the entire demo like a judge, fix failures, and provide a five-line demo script.

# Rolodexi hackathon guidance

## Scope and demo
- Website for people who struggle to remember new acquaintances: dictate a short meeting note, extract details with Google Gemini, and create a person card.
- Category: "re-innovating yesterday, reimagine a past invention product or idea for today's world."
- Two-minute demo: introduce the traditional rolodex, dictate a memory, show extracted details, then find the new card in the deck.
- Fields: name, explicitly stated gender/pronouns, meeting place, memorable events, and described appearance; never invent missing details.
- Deadline: November 14, 2026, 4 p.m. America/Denver (Rexburg, Idaho).
- Preserve the main-branch Rolodexi style closely: wood case, teal alphabet index, cream stacked cards, retro typography and navigation.
- Team knows JavaScript, HTML, CSS, Python, C, C++, C#; explain each implementation step before prioritizing speed.
- Provider: Google Gemini. API credentials, account quota, deployment target, and final backend choice remain to be confirmed.

## Run, test, and status
- Existing run command: `python server.py` (or `python3 server.py`); open http://localhost:8000. Python was unavailable in the earlier environment audit.
- Current server expects OPENAI_API_KEY and optionally OPENAI_MODEL; migrate these to Gemini during approved implementation.
- Browser app has manual card entry, localStorage, search, alphabet index, deck navigation, and export code; this new version has not been browser-tested in this audit.
- Backend /api/merge still calls OpenAI; current app.js does not call it. Voice-to-Gemini-to-card flow is unfinished.
- Syntax check: `node --check app.js`; no automated suite configured yet.
- Next: confirm key availability and backend/deployment choices, then obtain the team's "go" before implementation.

## Working rules
- Do the legwork: run, test, research, and fix issues. Product, design, behavior, and tool decisions belong to the team; batch questions in one message.
- Choose small implementation details and explain those choices. Build only requested features and build them well.
- After each change, run the affected part and confirm its behavior. Open browser apps and use them; operate non-browser apps directly.
- Once the complete flow exists, run it start to finish as a person would, and repeat after later changes; claim completion only after observing it work.
- Test logic with unit tests, connections with integration tests, and the full flow manually and through automated end-to-end tests; cover empty input, wrong input, and doing it twice.
- Commit each working step clearly; never commit passwords or API keys. Keep API keys on the backend and prevent serving secret files.
- Report broken or skipped work before what works. Explain each step in a few sentences: what, why, and one point the team can explain to a judge.
- On "demo check", run the entire demo like a judge, fix failures, and provide a five-line demo script.

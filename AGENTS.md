# Folio — hackathon project guidance

## Product and demo
- Build a website that turns a short dictated note about someone into a person profile using an external LLM API.
- Audience: people who struggle to remember the people they meet.
- Category: "re-innovating yesterday, reimagine a past invention product or idea for today's world."
- Two-minute demo: introduce the traditional rolodex, dictate a meeting memory, show extracted details, and display the new person's card.
- Profile fields: name, explicitly provided gender/pronouns, meeting place, memorable events, and appearance description; leave unknown details unset.
- Deadline: November 14, 2026, 4:00 p.m. America/Denver (Rexburg, Idaho).
- Follow the team's new site outline closely; its reference is not present locally and must be supplied or located before design changes.
- Team knows JavaScript, HTML, CSS, Python, C, C++, and C#; explain each implementation step.
- LLM provider and backend tools are not selected; the team decides (Gemini is a candidate).

## Run, test, and current state
- Current app: static index.html, styles.css, and app.js; open index.html in a browser for the typed-input prototype.
- For microphone testing, serve the folder on localhost and use a browser supporting speech recognition; no committed server/start command exists yet.
- Syntax check: `node --check app.js`. No automated test suite is configured yet.
- Previous browser audit verified typed notes create cards, consecutive creation works, and empty input displays a toast.
- Missing: real LLM/backend integration, saved profiles, extraction of all required fields, full sorting, and automated tests; voice input remains unverified.
- Next: obtain design reference and provider/tool decisions, agree on the plan, then wait for the team's "go" before implementation.

## Working rules
- Do the legwork: run, test, research, and fix issues. Product, design, behavior, and tool decisions belong to the team; batch unresolved questions in one message.
- Choose small implementation details and tell the team what you chose. Explaining comes before speed.
- Build only the requested features and build them well.
- After each change, run the affected part and verify its behavior. Open browser apps in a browser and use them; operate other apps directly.
- Once the full flow exists, run it end to end as a person would, and repeat after later changes. Never claim completion without observing it work.
- Test logic with unit tests, connections with integration tests, and the complete flow both manually and with automated end-to-end tests; cover empty input, wrong input, and repeated use.
- Commit after each working step with a clear message; never commit passwords or API keys. Keep provider secrets on the backend.
- Report broken or skipped work before reporting what works.
- After each step, explain in a few sentences what was built, why, and one point the team can explain to a judge.
- On "demo check", run the entire demo like a judge, fix failures, and provide a five-line demo script.

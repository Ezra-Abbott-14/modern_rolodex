# Development log

Append a dated entry for each major update. Record the request, observed evidence,
changed files, decisions with concise rationale, tests, limitations, next steps,
and open questions with their status. Preserve earlier entries. Never include API
keys, raw private notes/recordings, or private internal reasoning.

## 2026-11-14 — Repair Extract profile (ezraWorkflow)

### Request and scope

The team reported a problem with dictation-to-Gemini, then clarified that the
**Extract profile button**, not dictation, was the intended focus. Initial uncommitted
recording/transcription work was removed after that clarification. Existing dictation
behavior remains unchanged. The team also requested this iterated development log.

### Evidence and root cause

- The Python server's `/api/health` responded with `configured: true`.
- A browser test at `http://127.0.0.1:5500/index.html` reproduced extraction failure.
- `profile-api.mjs` always fetched the relative `/api/profile`. From Live Server,
  that reached the static server on port 5500 rather than Python on port 8000.
- Live Server returned a non-JSON response. Existing code displayed the wrong-server
  message, but extraction could not complete from that otherwise working page.
- Team confirmed the exact URL `http://127.0.0.1:5500/index.html` and the message
  “The Rolodexi backend could not be reached. Keep the terminal running with
  ./start.ps1 or python server.py, then retry. Your note is still here.” This confirms
  the affected development origin; it does not prove whether Python was running at
  the instant of their earlier failure. Both routing and backend availability matter.

### Changed files and decisions

- `profile-api.mjs`: requests from localhost/127.0.0.1 port 5500 now target the same
  hostname on port 8000. Python-served pages and other deployed sites retain relative
  endpoints. Network failures carry a specific code for the existing recovery link.
- `server.py`: implement CORS preflight and exact-origin response headers for the two
  local Live Server origins. Reject unrelated browser origins before calling Gemini.
- `app.js`: show existing backend recovery help for connection failures as well as
  wrong-server responses. Do not clear the note on error.
- `test_profile_api.mjs` / `test_server.py`: cover preview routing, same-origin
  routing, preflight, actual response headers, and untrusted-origin rejection.
- `AGENTS.md`: require a new detailed log entry for each major update, including
  decisions/rationale, verification, limitations, and open questions with answers.
- `README.md`: explain supported Live Server extraction, the required running Python
  service, and the distinction between development preview and backend behavior.
- Rationale: make the button work in the team's development workflow instead of
  repeatedly requiring users to switch URLs. Keep the key on Python; do not introduce
  a proxy service, new provider, broad wildcard CORS, or a new recording feature.

### Verification

- Passed: 9 JavaScript unit tests (`node --test test_profile_api.mjs`).
- Passed: 13 Python unit/HTTP integration tests (`./start.ps1 -Test`).
- Passed: JavaScript syntax check (`node --check app.js`).
- Passed live browser path 1: `http://127.0.0.1:5500/index.html` -> Extract profile
  -> Gemini returned the fictional Avery Stone profile -> Save -> reload -> search
  by green scarf found the saved card. This exercised the browser's actual CORS path.
- Passed live browser path 2: `http://localhost:8000/` -> Extract profile -> Gemini
  returned fictional Sam Alder -> Save -> reload -> search by orange coat found it.
- Evidence: ignored local screenshot `test-results/extract-profile-fixed.png`.
- During verification, Live Server auto-reloaded when documentation files were
  edited, resetting an in-progress form. Repeated the full test after edits settled;
  the repeated extraction/save/reload checks above passed. Do not edit files during
  a Live Server demonstration; use the Python-served page for a stable presentation.
- Initial recorder tests and synthesized audio checks are not evidence for this final
  change: that implementation was removed following the team's scope clarification.

### Open questions and follow-up

- Answered by team: the URL was `127.0.0.1:5500/index.html` with the backend-unreachable
  message. The earlier broad dictation report specifically meant Extract profile.
- Known limitation: Python still needs to run on port 8000 when the UI uses Live
  Server port 5500. Other preview ports are not automatically routed.
- Existing limitation: actual physical microphone behavior has not been verified by
  this extraction-focused update; no microphone implementation changes were retained.
- Follow-up: team should reload their current preview tab to load the corrected module
  and retry their note. The local backend has been restarted with this fix. Keep its
  terminal alive; the preview cannot run extraction if Python is stopped.

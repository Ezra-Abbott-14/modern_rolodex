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

## 2026-11-14 — Restore main after merge regressions

### Request and clarified scope

Inspect main against past working capabilities and repair the broken Add person
button and missing example cards. The initial request for exactly one example was
subsequently changed to “leave most of the example cards.” Preserve all nine existing
examples and existing saved contacts; do not reset anyone's localStorage.

### Findings

- `profile-api.mjs` declared `const endpoint` twice after a merge. Node reproduced
  `SyntaxError: Identifier 'endpoint' has already been declared`. Since app.js imports
  this module, none of its startup code ran: no cards, alphabet buttons, Add person,
  Update card, search handlers, or Street Valley initialization.
- Main's HTML intentionally comments out the pronouns input, but extraction still
  assigned `.value` on that missing control. This could turn a valid Gemini response
  into an exception before the rest of the form was filled.
- `server.py` contained duplicate do_OPTIONS definitions plus wildcard and exact
  Access-Control-Allow-Origin headers. Browsers reject multiple allow-origin values.

### Changes and rationale

- `profile-api.mjs`: retain one endpoint decision, including working port-5500 routing;
  add a form population helper that skips intentionally absent optional controls.
- `app.js`: use that helper, retain all nine seeds, and avoid deck keyboard navigation
  while either dialog or a select field is active. Preserve current blue-purple
  design, exact-name merging, update dialog, exports, and Street Valley modules.
- `server.py`: retain one preflight handler and exact local-origin CORS headers;
  keep explicit public module routes and do not expose configuration/source files.
- `test_profile_api.mjs`: cover the missing optional-field regression and explicit
  rejection of unsupported file:// opening; the app needs an HTTP server for modules.
- `test_server.py`: assert exactly one CORS header and serve/test Street Valley modules.
- Rationale: repair integration seams rather than replacing the team's current main
  with an older UI or clearing saved cards to hide startup failures.

### Verification and open questions

- Passed: syntax checks for all four runtime JavaScript modules; 10 JavaScript unit
  tests and 13 Python unit/HTTP tests.
- Passed in a fresh browser origin (`127.0.0.1:8000`): exactly nine original examples
  rendered before adding any test profiles. Existing localhost contacts were left intact.
- Passed: Add person opens, Cancel closes, blank-name submission is blocked, manual
  Morgan Demo save works, and saving the same name again merges notes without adding
  a duplicate. Selective appearance update persisted after reload.
- Passed: appearance search, alphabet filter, Next navigation, Street Valley pause/
  resume, and JSON export (downloaded and parsed ten cards: nine seeds plus test contact).
- Passed live Gemini flow: typed fictional Alex Restore note, extracted all visible
  fields without the missing-pronouns exception, saved, reloaded, and found by teal scarf.
- Browser console contained no errors. Evidence: ignored `test-results/main-restored.png`.
- Answered: example-card count — preserve existing examples per latest instruction.
- No new product decision is needed. Main currently exposes typed capture, not a
  microphone button; this repair does not reverse that earlier intentional UI change.
- Team explicitly authorized pushing the finished repair to GitHub main. After all
  checks passed, the next step is commit, fetch/check the remote head, and a normal
  fast-forward push without overwriting concurrent changes. Refresh the running app
  to load the repaired modules; keep the Python server running.

## 2026-11-14 — Secure Python backend and prepare shared-device hosting

### Request, clarified infrastructure, and scope

Secure the backend so other machines can use Gemini without receiving the API key.
The team requested detailed docs. Their teammate is preparing AWS with MySQL RDS;
they explicitly asked us to bypass the hosting-provisioning step for now. RDS is the
database, not compute. Public deployment, HTTPS/domain details, and an actual second
device are pending that teammate. Do not claim remote deployment is complete.

### Changes and key decisions

- `webapp.py`, `templates/login.html`: Flask application with production startup
  validation, shared demo access code, signed HttpOnly/Secure/SameSite sessions,
  four-hour expiry and server-side session revocation, CSRF, origin/host checks,
  security headers, HTTPS redirects, login/API rate limits, and Gemini concurrency cap.
- `server.py`: retain Gemini extraction/validation, replace the development HTTP
  handler with the Flask app served by Waitress for every normal startup path.
- `profile-api.mjs`, `app.js`, `index.html`: attach CSRF when signed in, show session
  expiry help, and sign out. No Gemini key is returned to the browser.
- `requirements.txt`, `setup.ps1`, `start.ps1`: pin dependencies, use an ignored
  project virtualenv, and run the complete test suite. Installation was tested.
- `Dockerfile`, `.dockerignore`, `Procfile`: portable non-root image/start settings,
  named asset copies, health check, and exclusion of .env/Git/generated media.
- `DEPLOYMENT.md`: detailed AWS handoff, environment/secret/proxy contract, operational
  limits, example commands, and explicit pending public-device acceptance checklist.
- `README.md`, `AGENTS.md`, `.env.example`: reflect new setup and production requirements.
- Rationale: a shared-code gate is appropriate for the bounded hackathon demo without
  introducing a new identity provider or altering profile storage. Keep the key and
  hosting secrets server-side. A production WSGI server replaces the development server.
- Production uses exactly one process/replica because session revocation and limits
  are in memory. Scaling requires shared state; RDS migration is separate work.
- Proxy protocol trust is opt-in and requires a private backend listener reachable
  only from the trusted TLS proxy. Forwarded host/IP values are not trusted.

### Verification (updated as checks finish)

- Passed: pinned dependencies installed in .venv; Windows setup.ps1 and start.ps1 -Test.
- Passed: 25 Python unit/security/Flask integration tests and 12 JavaScript tests.
- Tests include fail-closed production settings, unauthenticated rejection before
  Gemini, login/API CSRF, cookie flags, logout/replayed-cookie rejection, forged
  cookies, rate/concurrency limits, HTTPS/proxy behavior, body limits, origin/host
  checks, private-file exclusion, secret-free error responses, and existing extraction.
- Passed browser test at a loopback-only test instance: incorrect code rejected,
  correct test code opened all nine example cards; real Gemini extraction for a
  fictional Casey Secure note completed with the CSRF header; Save, reload, and
  appearance search succeeded. Sign out returned to the login page and a new login
  session retained browser-local contacts. No real access code was created or logged.
- Passed existing local development browser flow: fictional Dana Local extraction,
  Save, reload, and appearance search. One Gemini connection attempt timed out; a
  manual retry succeeded. There is no silent model fallback or automatic billed retry.
- The browser check exposed that a no-referrer policy can produce Origin:null on
  form navigation. Corrected it to strict-origin-when-cross-origin and retested the
  real form successfully; retained rejection of null/untrusted origins. Local origin
  aliases were also limited to localhost/127.0.0.1 on the actual backend port.
- Evidence: ignored test-results/secured-backend-login.png and secured-backend-profile.png.
- Passed: pip check and JavaScript syntax checks; dependency setup/launcher work.
- Preserved exclusive socket binding on Windows before handing the listener to
  Waitress; a regression test confirms a second process cannot share the port.
- Final normal-server restart passed `/api/health` with HTTP 200 and CSP/nosniff
  headers. A real profile request through the final Waitress socket path returned
  fictional Jamie Demo successfully. The temporary sign-in server was stopped.
- Not run: Docker build (Docker unavailable), AWS deployment, public certificate/
  networking checks, or real external-device access. These must remain explicit gaps.

### Open questions and answers

- Answered by team: AWS teammate is preparing infrastructure; defer provisioning.
- Pending AWS teammate: compute/service selection, HTTPS public origin, secrets
  injection method/role, private proxy networking, and the final deployment URL.
- No new Gemini key is needed per device once the shared service is deployed.
- Data persistence remains browser-local; signing in does not connect RDS or share
  contacts between devices. Confirm database requirements in a separate task.

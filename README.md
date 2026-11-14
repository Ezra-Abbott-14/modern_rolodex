# Rolodexi

iHack 2026: reinvent the physical rolodex for people who struggle to remember new acquaintances.
Type a short memory, let Gemini extract the details, review the results, and file a new card.
The wood case, teal index, cream cards, and deck navigation preserve the original Rolodex design.
Street Valley is a separate animated village below the card deck.

## Start locally

### 1. Open a terminal in this project

In VS Code, open the `modern_rolodex` folder and choose **Terminal → New Terminal**.
On this team's Windows machine, run:

```powershell
Set-Location 'C:\Users\EzraA\OneDrive\Desktop\modern_rolodex'
```

All commands below assume that this folder is the terminal's current directory.
The app needs Python 3.9 or newer and internet access for Gemini. No pip dependencies
are required. Node.js is only needed for the JavaScript tests.

### 2. Configure the key once

The team has already configured this machine's `.env`; skip copying if it exists.
For a new teammate's machine, create a key in [Google AI Studio](https://aistudio.google.com/apikey),
then run this command, which will not overwrite an existing `.env`:

```powershell
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

Open `.env` locally in your editor and use this format:

```dotenv
GEMINI_API_KEY=put_your_real_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=8000
```

Put the real key only in `.env`. `.env.example` is a tracked template and must keep
its key blank. Never paste the key into a chat, a JavaScript file, or a Git commit.
The server reads `.env` at startup; restart it after editing the file.
If the same variable is already set in the terminal environment, that value takes
precedence over `.env`. Check this when a model or key change appears to have no effect.

### 3. Start the Python application

In PowerShell, run:

```powershell
.\start.ps1
```

The launcher looks for `python` or `python3`, then tries the bundled runtime available
in this Codex workspace. The bundled runtime is a convenience on this machine, not
something another teammate can assume is installed. With a normal Python installation,
you can instead run:

```powershell
python server.py
```

On macOS/Linux, use `python3 server.py`. A successful startup prints:

```text
Rolodexi: http://localhost:8000
```

Keep that terminal running while using the website. Closing it stops the backend,
even if the website is still visible in a browser tab. If a traceback follows the
startup message, the server did not start successfully; see troubleshooting below.

### 4. Open the app (Python server or supported Live Server preview)

In Chrome or Edge, open [http://localhost:8000/](http://localhost:8000/).
For this demo, consistently use that exact hostname and port.

VS Code's **Go Live / Live Server** normally opens `http://127.0.0.1:5500/index.html`.
That static server does not execute `server.py`, but extraction now supports this
development workflow: keep Python running on port 8000, then use Live Server on 5500.
The Extract button explicitly sends the request to `http://127.0.0.1:8000/api/profile`.
For `http://localhost:5500`, it uses `http://localhost:8000/api/profile`.

Python allows these two exact preview origins and answers the browser's OPTIONS
preflight. This is restricted CORS (cross-origin resource sharing); unrelated websites
are not allowed to spend your Gemini quota through the local backend.
The API key still stays in Python. Live Server alone is not enough: both processes
must be running. After updating the code, restart Python and reload the preview tab.
Live Server may automatically reload the page when any project file is edited,
including documentation. Finish editing before a demo, or use the Python-served page
on port 8000 to avoid that development-server refresh resetting an open form.

This fixes the reported backend-unreachable error at `127.0.0.1:5500/index.html`.
Previously, the request incorrectly targeted Live Server's own `/api/profile`.
Other preview ports are not automatically forwarded. For a custom Python port, open
the Python-served page at that port. Direct `file://` opening is unsupported.
That server can display the HTML/CSS/JavaScript, but it does not execute `server.py`.
The Extract button requests `/api/profile` on the same server as the page. On port
5500 it reaches Live Server, which has no Gemini endpoint. A directly opened `index.html`
can use the backend on `http://localhost:8000` when the Python server is running, but the
recommended demo path is still the complete Python app on port 8000.

Do not use Live Server or double-click `index.html` for the end-to-end demo.
Use the Python app on port 8000. Both the frontend and backend are served together.
The updated error identifies a non-JSON/static-server response, preserves your note,
and offers a link to the full application in a new tab.

### 5. Check the backend before the presentation

Open [http://localhost:8000/api/health](http://localhost:8000/api/health) or run:

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/health
```

Expect `configured: true` (a browser displays `{"configured": true}`). This confirms
that the local server is running and loaded a nonempty key. It does not prove that
the key has valid permissions, remaining quota, or that Gemini is reachable; test
an extraction to verify those parts.

### 6. Stop and restart cleanly

To stop the app, focus its terminal and press **Ctrl+C**. Wait for the terminal
prompt to return before running `.\start.ps1` again. Do not keep starting copies.
The app rejects duplicate listeners on port 8000. If a server launched through a
launcher remains running, first inspect the port rather than stopping every Python process:

```powershell
netstat -ano | Select-String ':8000'
```

Find the `LISTENING` row and its PID. In Task Manager's Details tab, verify that this
is the Rolodexi Python process before ending it. Other Python processes may belong to
unrelated work. Start one application instance afterward and check `/api/health` again.

Click **Add person**, type a note, and click **Extract profile**. Review/edit the fields and **Save card**.
Saving another card with the exact same normalized name updates the existing card; “Maya” and
“Maya Chen” remain separate. Use **Update card** to choose a person by name and select only the
fields you want to change. Search matches names, notes, appearance, pronouns, and memorable events.
Cards stay in this browser's localStorage; **Export cards** downloads a JSON backup.
This is a local hackathon app, with no account login or cross-device sync.

### A complete user interaction

1. Click **Add person**. The top of the dialog contains the meeting note; the rest
   contains editable profile fields. You can enter a card manually without Gemini.
2. Type the person's name and the details you want to remember in the meeting note.
3. Click **Extract profile** once. While it runs, extraction/save controls are disabled
   to avoid submitting overlapping work. The note is limited to 8,000 characters.
4. Wait for “Details extracted with Gemini.” Review all fields and correct mistakes.
   Unknown details are left blank; a name is required to save. Events use one line each.
5. Click **Save card**. The new card appears at the front, and the search is cleared
   so it is not hidden by an earlier query. Saving writes the card to this browser.
6. Search for a name or appearance detail, then reload the page and search again.
   The saved card should remain. Saving the same exact name updates one card instead of creating a duplicate.

Browser storage is specific to the browser profile, hostname, and port. Cards on
`127.0.0.1:5500`, `127.0.0.1:8000`, and `localhost:8000` are separate collections.
Switching URLs does not delete the previous collection. Use **Export cards** on the
old URL to keep a backup; automatic import is not implemented. A private/incognito
window or clearing site data may remove its saved cards.

## Troubleshooting by symptom

| Symptom | Meaning and next action |
| --- | --- |
| Page works, but extraction says to open port 8000 | Check the address bar. Open `http://localhost:8000/`, not Live Server on port 5500. Copy your note before switching tabs. |
| Backend could not be reached | Keep Python running with `.\start.ps1`, check `http://localhost:8000/api/health`, and reload the browser tab. Live Server on 5500 now forwards extraction to 8000, but cannot start Python for you. |
| Browser cannot open localhost:8000 | Python is stopped or failed to start. Read the terminal traceback; a printed startup URL alone is not enough if followed by an error. |
| `configured: false` or Gemini is not configured | Check that the file is named `.env` exactly, is next to `server.py`, and contains a nonempty `GEMINI_API_KEY`. Restart the server. |
| Access denied, rejected request, or unavailable model | Check the key/project/model in Google AI Studio. The live-tested configuration is `gemini-3.1-flash-lite`; account access can differ. |
| Gemini quota is exhausted or busy | Wait and check the project's quota/billing in AI Studio. Avoid repeatedly pressing Extract. Manual card entry remains available. |
| Extraction timed out | The note remains in the dialog. Check connectivity and retry once. Check `GEMINI_MODEL` if it was changed; the original 3.8 Flash configuration timed out during testing. |
| Unreadable data / invalid profile | The service returned a response that does not match the expected format. Retry and report the exact message; this is distinguished from a connection failure. |
| Need to add a memory | Voice capture is intentionally removed. Type the note into the meeting-note box, then extract the profile. |
| Cards appear to be missing | Return to the same browser profile, hostname, and port used to save them; check search and the active alphabet filter. |
| Address already in use / WinError 10048 / WinError 10013 | Check for an existing Rolodexi instance on the port and stop that instance before restarting. Do not run multiple copies. |

When reporting a problem, include the browser URL, exact on-screen error, the action
that triggered it, and the relevant terminal error. Never include the API key or `.env` contents.

## How it works

| File | Responsibility |
| --- | --- |
| `index.html` | Retro layout, deck controls, note input, and review/save form. |
| `styles.css` | Wood case, teal index, cream cards, responsive layout, and dialog styling. |
| `app.js` | Typed note capture, profile review, exact-name merge/update, card rendering, search/index navigation, and localStorage. |
| `street_valley_characters.js` | 100 original pixel-villager data definitions with gender, palette, job, favorite place, and walking speed. |
| `street_valley_world.js` | Code-drawn canvas village where Rolodex contacts and ambient villagers automatically wander. |
| `profile-api.mjs` | Profile request, timeout, response validation, and distinct service-error messages. |
| `server.py` | Serves public assets, loads environment configuration, validates requests, and calls Gemini. |
| `start.ps1` | Windows startup and Python-test launcher; keeps the application attached to the terminal. |
| `.env.example` | Shareable configuration template with an empty API-key field. |
| `.env` | Local secret configuration, excluded from Git and never served by Python. |
| `test_server.py` | Python unit and HTTP integration tests with simulated upstream responses. |
| `test_profile_api.mjs` | JavaScript tests for valid results, wrong servers, invalid data, and connection errors. |
| `browser_fixture.py` | Explicit test-only simulated Gemini server on port 8001. |
| `DEVELOPMENT_LOG.md` | Dated major-update entries: findings, changed files, decisions/rationale, test evidence, limitations, and open questions/answers. |

Current main uses typed capture; it does not expose a dictation button. The browser
sends the note to Python's `POST /api/profile` (explicit port 8000 when using the
supported Live Server preview). Python sends the note to Gemini
over HTTPS, requests a JSON schema, validates the result, and returns fields for review.
Unknown details stay empty. Gender is never inferred from pronouns, name, voice, or appearance.
The key stays on the backend; the web server serves only an explicit list of public files.
There is no pretend AI fallback: missing keys, network failures, and quota errors are shown clearly.
Manual card entry remains available.

`GEMINI_MODEL` is configurable and defaults to `gemini-3.1-flash-lite`; your project must have access
and quota for the selected model. The implementation uses Google's supported REST
`generateContent` endpoint with output capped at 2,048 tokens. `PORT` defaults to 8000.
The server binds to this computer only and rejects duplicate listeners on the same port.

## Tests and demo verification

Main's startup was repaired after merge regressions: a duplicate `endpoint`
declaration prevented all JavaScript initialization, hiding the examples and disabling
Add person. The existing nine examples remain in the seed data. Existing browser
contacts are preserved; no reset is required. If the old broken page is still open,
refresh it after restarting Python. Optional fields hidden in the HTML are skipped
when populating Gemini results. See DEVELOPMENT_LOG.md for the full repair evidence.

- `python -m unittest -v test_server.py` or Windows `./start.ps1 -Test`: unit and HTTP integration tests.
- `node --check app.js`: JavaScript syntax check.
- `node --test test_profile_api.mjs`: ten JavaScript request/response/form tests, including
  the Live Server HTML error that caused the reported failure. No npm packages needed.
  This also imports the real API module (catching startup syntax errors) and checks
  that a hidden optional pronouns field cannot break successful Gemini extraction.
- `python browser_fixture.py`: test-only server at http://localhost:8001 with simulated Gemini responses.
  The normal app never enables this fixture. Do not present it as a real AI demo.
- Automated browser checks performed: extract Jamie Rivera, review fields, save, extract Casey Morgan,
  save again, search by appearance, verify empty search navigation, and reload to check persistence.
  Also checked empty notes, a note with no name, and the normal server's missing-key response.
- To repeat the browser checks against the fixture, use notes containing Jamie Rivera and Casey Morgan;
  `unnamed` triggers a missing-name result. Only those test responses are supplied by the fixture.

The Python suite currently has 13 tests, including Live Server preflight/response
headers and rejection of untrusted browser origins. Tests simulate Gemini to make edge cases
repeatable without spending API quota; they do not prove that Google's live API works.
The frontend suite sends notes through a supplied test transport to check error
classification and data handling. Browser tests are separate scripted interactions
that check the actual page, form, save behavior, and reload persistence.
After implementation changes, run both suites, then use the browser for the full flow.
For the current error fix, run Python on 8000 and repeat extraction from port 5500:
it should now return real profile fields rather than requiring a URL switch. Stop
Python to check the recovery message; the entered note must remain intact.

## Development notes and open questions

Read `DEVELOPMENT_LOG.md` for the evidence and decisions behind each major update.
Each entry records the request, affected branch/files, root-cause findings, concise
decision rationale, exact verification, unfinished work, and questions with answers
or a pending status. Update the entry as verification proceeds rather than describing
unfinished checks as successful. Never put keys or private recordings in these logs.

The Street Valley scene is original code art inspired by the team's pixel-farming-game
references. It does not bundle copied game sprites. Adding a contact syncs that person
into the village; their selected gender chooses a matching character palette, while
unspecified contacts receive a neutral villager.

Live Gemini extraction was verified with the team's local key using Gemini 3.1 Flash-Lite:
the real browser flow extracted Jamie Rivera and Casey Morgan, saved both cards, and
found Jamie by appearance after a reload. The original
3.8 Flash configuration timed out; Flash-Lite with the bounded output passed the live test.
To rehearse, run this full demo twice:

1. Introduce the old rolodex: a physical memory aid for the people you meet.
2. Add a person and type: “I met Jamie Rivera at the Rexburg hackathon. They use they/them pronouns,
   wear red glasses, and won a robotics contest last summer.”
3. Extract with Gemini and verify name, meeting place, appearance, pronouns, and memorable event.
4. Save the card, find it using the index or appearance search, and reload to show it remains saved.
5. Explain: “We reinvented yesterday's rolodex to turn a remembered detail into a card for today.”

## Main-branch conflict resolution

The integration of `origin/main` at `cc4699b` preserves the working Rolodexi deck,
Gemini profile endpoint, typed review dialog, exact-name merge, and detailed setup instructions.
Main contained previously committed conflict markers in `app.js` and `styles.css`
from combining the original Folio grid with the retro deck. Its HTML also replaced
the deck elements with old capture controls while JavaScript still expected the deck.
These incompatible fragments were removed rather than carried into the working app.
The Rolodexi title and AI-powered page description are retained.

The older main-branch `AGENTS.md` described OpenAI and a different capture flow. The
current implementation keeps Gemini, typed capture, exact normalized-name merging,
and the update-by-name dialog. “Maya” and “Maya Chen” are intentionally separate.
The team’s earlier work remains available in Git history.

The merge is performed on `ezraAiUse2.0` so the integration can be reviewed and tested
before merging its pull request into `main`. Do not force-push over another teammate’s work.

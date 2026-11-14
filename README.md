# Rolodexi

iHack 2026: reinvent the physical rolodex for people who struggle to remember new acquaintances.
Dictate a short memory, let Gemini extract the details, review the results, and file a new card.
The wood case, teal index, cream cards, and deck navigation follow the team's design on main.

## Start locally

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env`. Edit `.env` locally and set `GEMINI_API_KEY=your_key`.
   Do not paste the key in chat, browser code, or Git. No key is included in this repository.
3. Run `python server.py` (or `python3 server.py`). On this Windows workspace, `./start.ps1`
   also finds the bundled Python runtime when Python is not on PATH. No pip packages needed.
4. Open http://localhost:8000 in Chrome or Edge. Restart the server after editing `.env`.

Click **Add person**, then **Dictate a note** and allow microphone access. Speak, click **Stop dictation**,
and check the transcript. You can also type it. Click **Extract profile**, review/edit the fields,
and **Save card**. Search matches names, notes, appearance, pronouns, and memorable events.
Cards stay in this browser's localStorage; **Export cards** downloads a JSON backup.
This is a local hackathon app, with no account login or cross-device sync.

## How it works

The browser's speech-recognition service transcribes the voice; it needs browser support,
microphone permission, and generally internet access. Unsupported browsers can still use typed notes.
The browser sends the text to Python's `POST /api/profile`. Python sends the note to Gemini
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

- `python -m unittest -v test_server.py` or Windows `./start.ps1 -Test`: unit and HTTP integration tests.
- `node --check app.js`: JavaScript syntax check.
- `python browser_fixture.py`: test-only server at http://localhost:8001 with simulated Gemini responses.
  The normal app never enables this fixture. Do not present it as a real AI demo.
- Automated browser checks performed: extract Jamie Rivera, review fields, save, extract Casey Morgan,
  save again, search by appearance, verify empty search navigation, and reload to check persistence.
  Also checked empty notes, a note with no name, and the normal server's missing-key response.
- To repeat the browser checks against the fixture, use notes containing Jamie Rivera and Casey Morgan;
  `unnamed` triggers a missing-name result. Only those test responses are supplied by the fixture.

Live Gemini extraction was verified with the team's local key using Gemini 3.1 Flash-Lite:
the real browser flow extracted Jamie Rivera and Casey Morgan, saved both cards, and
found Jamie by appearance after a reload. The original
3.8 Flash configuration timed out; Flash-Lite with the bounded output passed the live test.
Actual microphone transcription still requires a spoken browser test.
To rehearse, run this full demo twice:

1. Introduce the old rolodex: a physical memory aid for the people you meet.
2. Add a person and dictate: “I met Jamie Rivera at the Rexburg hackathon. They use they/them pronouns,
   wear red glasses, and won a robotics contest last summer.”
3. Extract with Gemini and verify name, meeting place, appearance, pronouns, and memorable event.
4. Save the card, find it using the index or appearance search, and reload to show it remains saved.
5. Explain: “We reinvented yesterday's rolodex to turn a spoken memory into a card for today.”

"""Rolodexi localhost server and Gemini extraction. No external Python dependencies."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
OPENAI_URL = "https://api.openai.com/v1/responses"
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

MERGE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "matched_contact_id": {
            "type": "string",
            "description": "The id of the existing contact this note belongs to, or an empty string for a new person.",
        },
        "contact": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "name": {"type": "string"},
                "where": {"type": "string"},
                "summary": {"type": "string"},
                "facts": {"type": "array", "items": {"type": "string"}},
                "new_information": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["name", "where", "summary", "facts", "new_information"],
        },
    },
    "required": ["matched_contact_id", "contact"],
}

SYSTEM_PROMPT = """You organize a private personal rolodex.

Compare the new note with the existing contacts. Decide whether the note refers to one
of the existing people, even when it uses a first name, nickname, spelling variation,
or pronoun instead of the full name. Match only when the evidence is reasonable. If
the evidence is ambiguous, create a new contact rather than guessing.

When there is a match, return the existing contact's identity and merge old and new
information into ONE profile. Do not duplicate facts. Preserve useful dates, plans,
relationships, work, interests, and where the people met. The summary should be one
short, natural sentence. Facts should be short bullet-ready phrases. new_information
should contain only what the new note added; use an empty list when it adds nothing.
Never invent details. Return only the requested JSON shape."""


def response_text(payload):
    """Extract the text from a Responses API result."""
    if payload.get("output_text"):
        return payload["output_text"]
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                return content.get("text", "")
    return ""


def call_openai(contacts, note):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Start the server with your API key in the environment.")

    request_body = {
        "model": MODEL,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps({"existing_contacts": contacts, "new_note": note}, ensure_ascii=False),
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "contact_merge",
                "strict": True,
                "schema": MERGE_SCHEMA,
            }
        },
    }
    request = Request(
        OPENAI_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=35) as response:
            payload = json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI returned HTTP {error.code}: {detail[:500]}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach OpenAI: {error.reason}") from error

    text = response_text(payload)
    if not text:
        raise RuntimeError("OpenAI returned no structured output.")
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise RuntimeError("OpenAI returned invalid JSON.") from error


class FolioHandler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/api/profile':
            return self.send_json(404, {'error': 'Not found'})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 1_000_000:
                self.send_json(413, {"error": "Request is too large"})
                return
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            contacts = body.get("contacts", [])
            note = body.get("new_note", "")
            if not isinstance(contacts, list) or not isinstance(note, str) or not note.strip():
                self.send_json(400, {"error": "contacts must be a list and new_note must be non-empty"})
                return
            result = call_openai(contacts, note.strip())
            self.send_json(200, result)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": f"Invalid JSON request: {error}"})
        except RuntimeError as error:
            self.send_json(503, {'error': str(error)})

    def do_GET(self):
        if self.path == '/api/health':
            return self.send_json(200, {'configured': bool(os.environ.get('GEMINI_API_KEY', '').strip())})
        # Only serve explicit public assets, never secrets, source code, or Git metadata.
        assets = {'/': ('index.html', 'text/html; charset=utf-8'),
                  '/index.html': ('index.html', 'text/html; charset=utf-8'),
                  '/styles.css': ('styles.css', 'text/css; charset=utf-8'),
                  '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
                  '/profile-api.mjs': ('profile-api.mjs', 'text/javascript; charset=utf-8'),
                  '/roladexi.jpg': ('roladexi.jpg', 'image/jpeg')}
        asset = assets.get(self.path.split('?', 1)[0])
        if not asset or not (ROOT / asset[0]).is_file():
            return self.send_json(404, {'error': 'Not found'})
        content = (ROOT / asset[0]).read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', asset[1])
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == '__main__':
    load_env()
    port = int(os.environ.get('PORT', '8000'))
    print(f'Rolodexi: http://localhost:{port}', flush=True)
    httpd = LocalHTTPServer(('127.0.0.1', port), RolodexHandler)
    httpd.serve_forever()

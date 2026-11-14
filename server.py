"""Local Folio server: static files plus an AI contact merge endpoint.

Run with:
    OPENAI_API_KEY=your_key_here python3 server.py
Then open http://localhost:8000.
"""

import json
import mimetypes
import os
import re
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

Compare the new note with the eligible existing contacts. The eligible contacts have
already been filtered by the app using the captured name. Never match a contact whose
name is not exactly the same normalized name as the captured name. In particular,
"Maya" and "Maya Chen" are different people and must stay separate. Two notes that
both identify the person as "Maya" may be merged into the existing Maya profile.

If there is no eligible contact, create a new contact. If the evidence is ambiguous,
create a new contact rather than guessing.

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


def normalize_name(value):
    """Normalize spacing and punctuation without dropping name parts."""
    cleaned = re.sub(r"[^a-z0-9 ]", "", str(value or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def eligible_contacts(contacts, captured_name):
    """Only allow exact normalized-name candidates; never use prefix matching."""
    key = normalize_name(captured_name)
    if not key:
        return []
    return [contact for contact in contacts if normalize_name(contact.get("name")) == key]


def enforce_match_guard(result, eligible, captured_name):
    """Prevent a model response from bypassing the exact-name boundary."""
    allowed_ids = {contact.get("id") for contact in eligible}
    if result.get("matched_contact_id", "") not in allowed_ids:
        result["matched_contact_id"] = ""
        result.setdefault("contact", {})["name"] = result.get("contact", {}).get("name") or captured_name or "New connection"
    return result


def call_openai(contacts, note, captured_name):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Start the server with your API key in the environment.")

    request_body = {
        "model": MODEL,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps({"captured_name": captured_name, "eligible_contacts": contacts, "new_note": note}, ensure_ascii=False),
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
        with urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
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


def merge_contacts(contacts, note, captured_name):
    candidates = eligible_contacts(contacts, captured_name)
    result = call_openai(candidates, note, captured_name)
    return enforce_match_guard(result, candidates, captured_name)


class FolioHandler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/merge":
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 1_000_000:
                self.send_json(413, {"error": "Request is too large"})
                return
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            contacts = body.get("contacts", [])
            note = body.get("new_note", "")
            captured_name = body.get("captured_name", "")
            if not isinstance(contacts, list) or not isinstance(note, str) or not note.strip() or not isinstance(captured_name, str):
                self.send_json(400, {"error": "contacts must be a list, new_note must be non-empty, and captured_name must be text"})
                return
            result = merge_contacts(contacts, note.strip(), captured_name.strip())
            self.send_json(200, result)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": f"Invalid JSON request: {error}"})
        except RuntimeError as error:
            self.send_json(502, {"error": str(error)})

    def do_GET(self):
        requested = self.path.split("?", 1)[0]
        relative = "index.html" if requested in ("", "/") else requested.lstrip("/")
        file_path = (ROOT / relative).resolve()
        try:
            file_path.relative_to(ROOT)
        except ValueError:
            self.send_error(403)
            return
        if not file_path.is_file():
            self.send_error(404)
            return
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(str(file_path))[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"Folio running at http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), FolioHandler).serve_forever()

# modern_rolodex
Ihack 2026 entry — an AI-powered personal Rolodex

## Run the AI version

The AI merge endpoint lives in `server.py`. It keeps the API key off the browser and
asks the Responses API for structured JSON: one matched contact, an updated summary,
deduplicated facts, and the new information from the note.

1. Set your key in the terminal (do not paste it into `app.js`):

   ```sh
   export OPENAI_API_KEY="your_api_key_here"
   ```

2. Start the app:

   ```sh
   python3 server.py
   ```

3. Open [http://localhost:8000](http://localhost:8000).

When you add a note, the app sends the note and existing contact summaries to
`POST /api/merge`. The AI can match “Maya” to “Maya Chen” and update the same card.
If the server or AI is unavailable, the browser uses its local merge fallback.

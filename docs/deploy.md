# Optional deployment (not the hackathon demo path)

Ardham's whole point is running **on-device, offline**, on the field officer's own
phone/laptop — that's the setup in the main `README.md` and the one judges see.

This page is for the *optional* later step: if a lender pilot wants a shared backend
instead of (or alongside) each officer's own on-device Gemma, the FastAPI backend can
be containerized and pointed at the AI Studio API instead of local Ollama.

## What this does NOT change

- The guard, extraction, explanation, and quiz logic are identical either way.
- Sample data is still fictional; this is not wired to any real lender system.
- This does not add auth, a multi-tenant database, or HTTPS — a pilot deployment
  would need those added on top; this is just "the backend runs somewhere that
  isn't localhost."

## Build and run

```bash
docker build -t ardham-backend -f backend/Dockerfile .
docker run -p 8000:8000 \
  -e ARDHAM_BACKEND=aistudio \
  -e GOOGLE_API_KEY=your_key_here \
  -v ardham-data:/app/data \
  ardham-backend
```

The container has no Ollama and no GPU assumptions — it always runs against the
AI Studio backend (`ARDHAM_BACKEND=aistudio` is the image default). Local Gemma via
Ollama only makes sense on a machine the officer is physically holding, which a
shared cloud container by definition isn't.

`/app/data` is where SQLite and session uploads (loan card photos, answer audio)
live — mount a volume so that survives container restarts. Given loan photos and
voice recordings are sensitive, treat that volume the way you'd treat any PII
store: encrypted at rest, access-controlled, not something you mount or back up
casually.

## docker-compose, for local testing of the container

```yaml
services:
  ardham-backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      ARDHAM_BACKEND: aistudio
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
    volumes:
      - ardham-data:/app/data
volumes:
  ardham-data:
```

Point `frontend/.env`'s `VITE_API_BASE` at wherever this container ends up running,
rebuild the frontend, and the rest of the app behaves exactly as it does locally.

# Optional container for the backend — e.g. a future lender pilot deployment.
#
# The hackathon demo itself is NOT meant to run this way: the whole point of
# Ardham is on-device Gemma 4 with no network. This image exists for the case
# where someone wants to run the FastAPI backend somewhere other than the
# officer's own laptop (a pilot server talking to the AI Studio backend,
# for example) — it does not include Ollama or a local model.
#
# Build:  docker build -t ardham-backend -f backend/Dockerfile .
# Run:    docker run -p 8000:8000 \
#           -e ARDHAM_BACKEND=aistudio -e GOOGLE_API_KEY=... \
#           -v ardham-data:/app/data \
#           ardham-backend
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY skills/ skills/
COPY samples/ samples/
COPY frontend/dist/ frontend/dist/

ENV ARDHAM_BACKEND=aistudio
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

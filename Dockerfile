# Stage 1: Build frontend React SPA
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI backend
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY skills/ skills/
COPY samples/ samples/
COPY --from=frontend-builder /app/frontend/dist frontend/dist

ENV ARDHAM_BACKEND=aistudio
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

#!/usr/bin/env bash
# Starts backend + frontend together for the demo. Run from the repo root.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] && export $(grep -v '^#' .env | xargs) || true

cleanup() {
  echo "==> Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Starting backend (ARDHAM_BACKEND=${ARDHAM_BACKEND:-local})"
# shellcheck disable=SC1091
source backend/.venv/bin/activate
(cd backend && uvicorn main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!
deactivate

echo "==> Starting frontend"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "==> Backend:  http://localhost:8000/docs"
echo "==> Frontend: http://localhost:5173"
echo "==> Press Ctrl+C to stop both."
wait

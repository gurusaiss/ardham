#!/usr/bin/env bash
# One-time setup for Ardham. Run from the repo root: ./scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Backend: creating venv and installing requirements"
python3 -m venv backend/.venv
# shellcheck disable=SC1091
source backend/.venv/bin/activate
pip install -q -r backend/requirements.txt
deactivate

echo "==> Frontend: installing npm dependencies"
(cd frontend && npm install)

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example — edit it if you want the AI Studio backend"
fi

echo "==> Checking for Ollama"
if command -v ollama >/dev/null 2>&1; then
  echo "    Ollama found. Pulling gemma4:e4b (this can take a while the first time)..."
  ollama pull gemma4:e4b
else
  echo "    Ollama not found. Install it from https://ollama.com before running the local backend,"
  echo "    or set ARDHAM_BACKEND=aistudio in .env to use the AI Studio backup instead."
fi

echo "==> Setup complete. Run ./scripts/run_demo.sh to start the app."

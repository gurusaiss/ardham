# Live Deployment Guide for Ardham (అర్థం)

Ardham is built as an **offline-first PWA**, designed to run on-device with zero internet in rural villages.
However, for hackathon submissions (Devpost / MLH), having a **live URL** that judges and organizers can test from their own phones or laptops is crucial.

FastAPI is configured to serve the production React frontend build (`frontend/dist`) as a **single unified full-stack web service**. You only need to deploy **one container or service** to get a single public URL.

---

## The Winning Hackathon Strategy: The "Trinity"

1. **The Live Presentation**: Run locally on your laptop with **Wi-Fi OFF** (`ARDHAM_BACKEND=local` via Ollama) to prove the "village microfinance" offline concept.
2. **The Safety Net Video**: A 2-3 minute screen recording of the full flow. If venue Wi-Fi or laptop battery fails, you have the video ready.
3. **The Submission Form**: Provide the **Live URL** (from Render, Railway, or Hugging Face) and GitHub link so remote judges and attendees can try it out themselves.

---

## Option 1: Render.com (Recommended — 100% Free, Simplest)

Render provides free Docker web services directly connected to your GitHub repository.

### Steps:
1. Push your repository to GitHub (public repo, e.g., `github.com/<your-username>/ardham`).
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **"New +" -> "Web Service"**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` or you can configure manually:
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `.`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `ARDHAM_BACKEND`: `aistudio`
   - `GOOGLE_API_KEY`: `<your_gemini_api_key>`
   - `GROQ_API_KEY`: `<optional_groq_api_key>`
6. Click **"Deploy Web Service"**.
7. In ~2-3 minutes, you will get your live link: `https://ardham-xxxx.onrender.com`.

---

## Option 2: Railway.app (Ultra-Fast 1-Click Deploy)

1. Go to [railway.com](https://railway.com) and log in with GitHub.
2. Click **"New Project" -> "Deploy from GitHub repo"**.
3. Select your `ardham` repository.
4. In Project Settings:
   - Set **Dockerfile Path**: `backend/Dockerfile`
5. In **Variables**, add:
   - `ARDHAM_BACKEND`: `aistudio`
   - `GOOGLE_API_KEY`: `<your_gemini_api_key>`
6. Railway automatically assigns a public domain under Settings -> Networking -> **Generate Domain**.

---

## Option 3: Hugging Face Spaces (Free Permanent URL)

Hugging Face Spaces provides free hosting with open-source recognition.

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. Name: `ardham`
3. License: `apache-2.0`
4. SDK: Select **Docker** (Blank).
5. Push your code to the HF Space git repository:
   - Place a `Dockerfile` at root (or symlink `backend/Dockerfile`).
6. In Space Settings -> **Repository Secrets**, add:
   - `GOOGLE_API_KEY`: `<your_gemini_api_key>`
   - `ARDHAM_BACKEND`: `aistudio`

---

## Local Docker Testing

To test the production container locally before deploying:

```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Build docker image
docker build -t ardham-fullstack -f backend/Dockerfile .

# Run container
docker run -p 8000:8000 \
  -e ARDHAM_BACKEND=aistudio \
  -e GOOGLE_API_KEY=your_key_here \
  ardham-fullstack
```

Open `http://localhost:8000` — both the React frontend and FastAPI backend will run on port 8000.

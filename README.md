# Ardham (అర్థం)

> **Empowering rural & visually impaired borrowers to understand every loan commitment before signing — 100% offline, on-device, in Telugu, powered by Google Gemma 4.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![MLH Challenge](https://img.shields.io/badge/MLH_Hackathon-Best_Open--Source_AI-purple.svg)](https://mlh.com/opensource-ai)
[![Google Gemma](https://img.shields.io/badge/Built_with-Gemma_4-4285F4.svg)](https://ai.google.dev/gemma/docs/core)
[![Deployed on Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7.svg)](https://render.com)

Built for **Hacktoberfest Hack Day Vizag x AI for Vizag (Major League Hacking)**.

---

## 🏆 MLH Challenge Submissions

Ardham is submitted to and satisfies the full criteria of the following official prize tracks:

| Challenge | Track Details & Documentation Link | How Ardham Qualifies |
| :--- | :--- | :--- |
| **Build with Gemma** | [mlh.com/partners/gemma](https://mlh.com/partners/gemma) | Uses **Google Gemma 4** (Gemma 4 E4B on-device SLM + 31B Dense/MoE via Gemini API). Powers camera document extraction, multilingual reasoning in Telugu/Hindi, and audio understanding under Apache 2.0. |
| **Best Open-Source AI Project** | [mlh.com/opensource-ai](https://mlh.com/opensource-ai) | 100% Public GitHub repo licensed under **Apache 2.0**. Uses an open-weight foundation model (**Gemma 4**, &lt;10B parameter SLM on-device). Implements domain-specific loan logic following the **[Agent Skills Open Standard](https://agentskills.io/specification)**. |
| **Best Use of Render** | [dev.to/challenges/](https://dev.to/challenges/) | Full-stack deployment on **Render** (FastAPI backend + Vite/React frontend) with 24/7 uptime and zero cold-start latency. |
| **Best .Tech Domain Name** | [get.tech](https://get.tech) | Branded custom domain deployment (`ardham.tech`) for instant live judge evaluation. |

---

## 🌟 Key Features

1. **Autonomous Lakshmi AI Avatar**:
   - High-fidelity, real-time procedural lip-sync avatar with warm Indian heritage aesthetics (saree with zari border, nathni, jhumkas, bindi).
   - 100% eyes-free, hands-free voice navigation designed specifically for visually impaired and illiterate borrowers.
   - 5-second auto-fading fact cards so borrowers stay focused on spoken communication.
2. **Zero Technical Jargon for Rural Borrowers**:
   - Completely eliminated complex financial/technical terms (*Amortized reducing balance*, *SHA-256*, *KFS*, *JLG*, *APR*).
   - Replaced with simple, everyday language (*Easy weekly repayments*, *Official digital verification seal*, *Self Help Group loan*, *Genuine card facts*).
3. **On-Device Multimodal Vision (1 to 10+ Pages)**:
   - Photographs loan cards or multi-page agreements to extract crucial numbers (loan amount, interest rate, upfront deductions, weekly installments).
4. **Zero-Hallucination Guard (`backend/guard.py`)**:
   - Recomputes mathematical consistency in deterministic code.
   - Enforces strict number-matching: every numeral spoken must trace directly to a verified clause on the loan card.
5. **High-Fidelity Local Neural Voice Synthesis**:
   - Speaks pure local Andhra Pradesh / Telangana Telugu (`te-IN-ShrutiNeural`), Hindi (`hi-IN-SwaraNeural`), and Indian English (`en-IN-NeerjaExpressiveNeural`) with offline Web Speech fallback.
6. **Tamper-Proof Digital Verification Receipt**:
   - Generates a cryptographically verified receipt with an official SHA-256 seal and a scannable QR code for dispute resolution.

---

## 📸 Visual Walkthrough

| | | |
|---|---|---|
| ![Home](docs/screenshots/01-home.png) | ![Choose loan type](docs/screenshots/02-choose-loan.png) | ![Review terms with source quotes](docs/screenshots/04-review.png) |
| ![Explanation with source highlighting](docs/screenshots/05-explain-1.png) | ![Quiz question](docs/screenshots/06-quiz-1.png) | ![Result with re-explain](docs/screenshots/07-result.png) |
| ![Comprehension certificate](docs/screenshots/10-certificate.png) | ![Model-unavailable error with one-click backup switch](docs/screenshots/12-error-banner.png) | ![Debug panel with per-step latency](docs/screenshots/11-debug-panel.png) |

---

## 🧠 Open-Weight Model & Architecture

Ardham utilizes **Google Gemma 4**, an open-weight model family released under the **Apache 2.0 / Gemma Terms of Use**:
- **Model Card & Open Weights**: [Hugging Face Google Gemma 4](https://huggingface.co/google/gemma-4)
- **Model Overview**: [Google Gemma Core Docs](https://ai.google.dev/gemma/docs/core)
- **Official Model License / Terms**: [Google AI Gemma Terms](https://ai.google.dev/gemma/terms)

### Small Language Model (SLM) vs Large Language Model (LLM) Tiers
- **Edge / On-Device (SLM - Under 10B Parameters)**:
  `gemma4:e4b` (~2.5GB-4GB quantized weights) running locally on CPU/NPU via Ollama for zero-connectivity rural field operation with Wi-Fi turned off.
- **Cloud / High-Throughput (LLM - 31B Dense & MoE)**:
  Gemma 4 31B Dense running through Google AI Studio / Gemini API (`backend/model_client.py:AIStudioGemma`) as a seamless fallback.

| Gemma 4 Capability | Applied In Ardham | Source Code Implementation |
| :--- | :--- | :--- |
| **Multimodal Vision** | Reading photographed loan passbooks & multi-page KFS documents | [`backend/extract.py`](backend/extract.py) |
| **Multilingual Generation** | Explaining every clause plainly in authentic spoken Telugu and Hindi | [`backend/explain.py`](backend/explain.py) |
| **Audio Input Understanding** | Transcribing and evaluating borrower spoken verbal answers | [`backend/main.py`](backend/main.py) (`/sessions/{id}/answer`) |
| **Structured Output / Grading** | Function calling schema to extract facts and grade comprehension | [`backend/quiz.py`](backend/quiz.py), [`backend/extract.py`](backend/extract.py) |
| **Edge Resilience** | 100% on-device local inference with zero internet required | [`backend/model_client.py`](backend/model_client.py) (`LocalGemma`) |

---

## 🛠️ Official Google Gemma Resources & Quickstarts

- [Build with Gemma Portal](https://mlh.link/gemma-quickstart)
- [Gemma Model Documentation](https://mlh.link/gemma-docs)
- [Gemma Beginner Guide](https://mlh.link/gemma-beginnerguide)
- [Gemma Vertex AI Integration](https://mlh.link/gemma-vertex-ai)
- [Gemma Cookbook (Production Samples)](https://github.com/google-gemini/gemma-cookbook)
- [Google AI Studio Free Tier Signup](https://mlh.link/gemma-signup)

---

## 📜 Agent Skills Standard Compliance

Loan products are modular **Agent Skills** located in [`skills/`](skills/) complying with the **[Agent Skills Open Specification](https://agentskills.io/specification)**:

```
skills/<loan-category>/
  SKILL.md          # YAML frontmatter (name, description) + domain instructions
  questions.json    # Verification questions per loan category
  glossary.te.json  # Grassroots Telugu terminology mapping
```

Included Skills:
1. [`skills/microfinance-group-loan/`](skills/microfinance-group-loan/): Self Help Group loans with weekly installments and upfront fee deductions.
2. [`skills/gold-loan/`](skills/gold-loan/): Gold jewelry collateral loans with auction notice safeguards.
3. [`skills/individual-personal-loan/`](skills/individual-personal-loan/): Consumer loans with monthly EMIs.

---

## 🛡️ The Zero-Hallucination Guard

[`backend/guard.py`](backend/guard.py) prevents model hallucination before information reaches the borrower:
1. **Mathematical Consistency**: Recomputes values in Python (e.g. `installment × count == total payable`).
2. **Numeric Boundary Lock**: Scans every generated Telugu/Hindi sentence; any number not present in the extracted loan card is flagged and rejected.
3. **Explanation Filtering**: Automatically purges unverified claims before speech synthesis.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional for offline on-device mode) [Ollama](https://ollama.com/) with `gemma4:e4b`

### 1. Clone & Install
```bash
git clone https://github.com/gurusaiss/ardham.git
cd ardham
```

### 2. Run with One Command
**Windows:**
```powershell
.\scripts\setup.ps1
.\scripts\run_demo.ps1
```

**macOS / Linux:**
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/run_demo.sh
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 3. Running Fully Offline
Once `gemma4:e4b` is downloaded, disconnect Wi-Fi entirely. The complete scan, explain, quiz, voice avatar, and certificate flow executes 100% on `localhost`.

### 4. Running with Google AI Studio / Gemini API
Set in `.env`:
```env
ARDHAM_BACKEND=aistudio
GOOGLE_API_KEY=your_api_key_here
```

---

## 🧪 Automated Test Suite

Ardham includes an automated test suite verifying guards, grading, schemas, and end-to-end flows:

```bash
# Run full unit & integration tests (19/19 passing)
pytest backend/tests

# Run live Gemma 4 extraction tests
ARDHAM_RUN_LIVE_TESTS=1 pytest backend/tests
```

---

## 📄 License

This project is open-source software licensed under the **[Apache License 2.0](LICENSE)**.

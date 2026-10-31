# Step 0 — Spike Results

Run from a cloud sandbox with no GPU, no Ollama, and no Google API key connected yet
(network to `generativelanguage.googleapis.com` confirmed reachable; `ai.google.dev`,
`mlh.link`, and `ollama.com` all confirmed **blocked** from this sandbox — so Ollama
itself can't even be installed here, not just "no GPU to run it fast"). Scripts are
written and ready; live execution of the local-Ollama path and anything needing an
API key must happen on your laptop.

| # | Check | Status | Notes / latency |
|---|---|---|---|
| 1 | Gemma 4 E4B runs locally (Ollama) | **Not yet run** — needs your laptop | Confirmed model tag: `gemma4:e4b` (Ollama); released 2026-03-31, 128K context, ~2.5GB download. Script ready at `spikes/01_local_text.py`. |
| 2 | Vision: photo → structured JSON | **Not yet run** — needs Ollama or `GOOGLE_API_KEY` | Script ready at `spikes/02_vision_extract.py`. Sample fictional loan card generated at `samples/microfinance_group_loan_card.png` + `.expected.json` for scoring. |
| 3 | Audio: spoken Telugu understood | **Not yet run against a live model** — fixtures ready, needs Ollama/API key | Confirmed Gemma 4 E2B/E4B natively support audio input (distinct from, and newer than, Gemma 3n — don't confuse the two). Script ready at `spikes/03_audio_telugu.py`. Three synthetic Telugu WAV fixtures generated with `espeak-ng` at `samples/sample_telugu_answer_{correct,wrong,dontknow}.wav` — real Telugu phonemes, robotic voice; re-record with a human voice before the actual demo. Fallback already defined in build doc: tap/type answers if this fails. |
| 4 | Function calling / structured output | **Not yet run** — needs Ollama or `GOOGLE_API_KEY` | Script ready at `spikes/04_function_calling.py`, 3 graded test cases (correct, wrong-number, non-answer). |
| 5 | Telugu TTS (`te-IN` voice) | **Research only** — couldn't test a real browser from this sandbox | No authoritative confirmation that Chrome ships a `te-IN` voice by default; it's OS/platform-dependent, so must be checked live on your demo laptop with `spikes/05_tts_telugu_check.html`. Fallback path confirmed viable: **AI4Bharat Indic Parler TTS** (Apache-2.0, supports Telugu, runs offline via HF Transformers) if Web Speech API has no Telugu voice. Last-resort fallback (per build doc): Telugu text on screen + Hindi/English speech. |

## Full-app verification actually done in this sandbox

Since real Gemma 4 is unreachable here, I built a deterministic stand-in
(`StubGemma`, `ARDHAM_BACKEND=stub` — see `backend/model_client.py` and the
README's "What StubGemma is (and isn't)" section) and used it to prove the
**rest of the system** — not Gemma's output quality, but everything around it —
actually works, rather than just type-checking and unit-testing in isolation:

1. **Backend, real HTTP, real SQLite:** `backend/tests/test_e2e_stub.py` drives
   the full `POST /extract → confirm → explain → quiz → answer → certificate`
   flow through the real FastAPI app via `TestClient`. It's part of the normal
   `pytest` run (not gated), so it runs on every test invocation. It caught a
   real bug: `TestClient(app)` without a `with` block never fires the startup
   lifespan, so `storage.init_db()` never ran — every session route would have
   404'd on first use against a fresh database. Fixed in both this test and the
   live-model `test_e2e.py`, which had the same latent bug.
2. **Frontend, a real browser, real servers:** started the actual backend
   (`ARDHAM_BACKEND=stub`) and the actual Vite dev server, then drove a real
   headless Chromium through every screen with Playwright: Home → choose loan
   type → upload the sample card → Review (confirmed all 11 fields show with
   their source quotes) → Explain (confirmed the source-highlight box renders
   the exact card line) → Quiz (answered one correctly, three wrong) → Result
   (confirmed the score and the "re-explain missed parts" list) → targeted
   re-explanation (confirmed it regenerates only the 3 wrong fields, not all 8)
   → back to Result → Certificate (SHA-256 hash present) → debug panel (showed
   live per-step latency and `backend: stub`). Zero browser console errors,
   zero page errors, across the whole run.
3. **The error path, for real:** separately ran the backend in its actual
   default mode (`ARDHAM_BACKEND=local`, no Ollama reachable) and drove the
   Scan screen in a real browser. Got the real `503 model_unavailable` error,
   rendered in the real error banner, clicked the real "Switch to AI Studio
   backup and retry" button, and confirmed the backend's active setting
   actually flipped (`GET /settings` returned `aistudio` afterward, and the
   banner's button text flipped to offer switching back to local).

What this proves: the guard, the API contracts, the frontend state management,
the targeted re-explain logic, the certificate generation, and the error/backup
UX all work correctly as a system. What it does **not** prove: that Gemma 4
actually reads a loan card correctly, explains it well in Telugu, or
understands spoken Telugu answers — that still requires the live-model path
below, on a machine that can actually reach Gemma 4.

## Key findings worth acting on

1. **Gemma 4 ≠ Gemma 3n.** Some docs/cookbook pages still only reference Gemma 3n for audio — that's the prior generation. Gemma 4 E4B (what we're using) supports audio natively and has a much larger context window (128K vs 32K). No change to the plan, just don't get confused mid-build if a doc only mentions "3n."
2. **AI Studio free tier is real but has been tightening** (several rate-limit cuts through 2026). It's fine as the offline-demo backup it's designed to be; don't lean on it for anything latency-sensitive or high-volume.
3. **TTS is the biggest open risk still.** Must be checked on the actual demo machine before relying on the Web Speech API — if it's missing a Telugu voice, pivot to AI4Bharat Indic Parler TTS, which is a bigger local dependency (Python + model download) than just a browser API, so decide early (Hour 3–4.5 per the build order) not last-minute.

## What's built and ready

- `spikes/model_client_spike.py` — shared local/AI-Studio client
- `spikes/01-04_*.py` — all four runnable spike scripts
- `spikes/05_tts_telugu_check.html` — browser voice checker
- `samples/microfinance_group_loan_card.{html,png,expected.json}` — first fictional sample loan card + expected extraction, ready for spike 2 and later for the real `extract.py` tests
- `samples/sample_telugu_answer_{correct,wrong,dontknow}.wav` — synthetic Telugu audio fixtures for spike 3 and the golden end-to-end test
- **The full application** (backend + frontend, all screens, the guard, the quiz loop,
  targeted re-explanation, the debug/latency panel, the one-click backend-switch on
  error, the comprehension certificate) is built, and `backend/tests/` has **15
  passing tests** (13 pure-logic unit tests + 2 always-on `StubGemma`-backed
  end-to-end tests) plus 2 live-model tests gated behind `ARDHAM_RUN_LIVE_TESTS=1`.
  See the main `README.md` for the full feature list, and the section above for
  exactly what was proven by actually running it, not just testing it in pieces.

## Next action

Once you connect your Google API key and/or get Ollama running with `gemma4:e4b` pulled:

```bash
cd backend && source .venv/bin/activate
ARDHAM_RUN_LIVE_TESTS=1 pytest -v
```

This runs the real extraction-accuracy test and the golden end-to-end test
(`backend/tests/test_extract.py`, `backend/tests/test_e2e.py`) against whichever
backend `ARDHAM_BACKEND` is set to. Report back what fails — extraction quality in
particular is worth a close look, since that's the one spike that couldn't be
verified at all without a live model.

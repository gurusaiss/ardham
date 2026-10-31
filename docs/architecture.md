# Architecture

```
                         ┌─────────────────────────────┐
                         │   Field officer's phone/PC   │
                         │   React + Vite + TS + PWA     │
                         │   (frontend/)                 │
                         └───────────────┬───────────────┘
                                         │ HTTP (localhost, offline)
                         ┌───────────────▼───────────────┐
                         │        FastAPI (backend/)      │
                         │                                 │
   photo ──────────────▶ │  extract.py  ──▶  guard.py ◀──┐ │
                         │       │        (consistency,   │ │
                         │       ▼         number-match)  │ │
                         │  LoanTerms ─────────────────────┘ │
                         │       │                            │
                         │       ▼                            │
                         │  explain.py ──▶ guard.filter ──▶ Telugu sentences
                         │       │
   spoken/typed ───────▶ │  quiz.py (questions from skill, grade answers)
   answer                │       │
                         │       ▼
                         │  certificate.py (JSON + SHA-256 + HTML)
                         │       │
                         │       ▼
                         │  storage.py (SQLite + /data/sessions/<id>/)
                         └───────────────┬────────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │        model_client.py          │
                         │  LocalGemma (Ollama, default)   │
                         │  AIStudioGemma (Gemini API, backup) │
                         │  switched by ARDHAM_BACKEND env  │
                         └───────────────┬────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   Gemma 4 E4B         │
                              │ (vision, audio, text, │
                              │  function calling)     │
                              └────────────────────────┘

         ┌─────────────────────────────────────────────┐
         │  skills/  — one Agent Skill folder per loan   │
         │  type (SKILL.md + questions.json +            │
         │  glossary.te.json). extract/explain/quiz all  │
         │  read from here instead of hardcoding wording. │
         └─────────────────────────────────────────────┘
```

## Why the guard sits where it does

`guard.py` is called from two places, not one:
- **After extraction** (`check_consistency`): recomputes derived numbers (instalment ×
  count vs total payable) purely in code — no model call, so it can't hallucinate.
- **After explanation generation** (`filter_explanation`): every sentence Gemma writes
  is checked against the already-extracted, already-verified `LoanTerms` before the
  borrower ever hears it. A sentence with a number that doesn't trace back to an
  extracted field is dropped, not shown.

This means a hallucinated number can enter the system in at most one place
(extraction itself) and gets a chance to be caught by consistency checks or
by the officer's manual review in the Review screen — it can never also slip
through again during explanation, because the guard is the single source of
truth for what "quoting the exact line" is allowed to say.

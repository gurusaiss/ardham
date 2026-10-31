# Pitch notes (1 slide worth)

**Ardham (అర్థం)** — Telugu for "meaning" / "understanding."

- **Problem:** rural loan borrowers sign Key Fact Statements they can't fully read.
  RBI's KFS rules require explanation in a language the borrower understands, but
  there is no proof it happened — no record if a dispute or audit comes later.
- **Solution:** a field officer's app that scans the loan card, explains every term
  in Telugu quoting the exact source line, checks understanding with spoken/typed
  questions, re-explains only what's missed, and issues a signed comprehension
  certificate — fully offline, on-device.
- **Why Gemma 4, specifically:** one model does vision (reading the card), audio
  (hearing the answer), multilingual (explaining in Telugu), and function calling
  (running the quiz/grading loop) — all on-device, which matters because villages
  have weak network and loan data is sensitive.
- **The differentiator:** the hallucination guard. Every number in every explanation
  is checked against the extracted fields in code, not trusted from the model. An
  invented number is blocked before the borrower ever hears it.
- **Three things to say to judges:**
  1. "This runs with Wi-Fi off — watch." (flip airplane mode, show the Offline ✓ badge)
  2. "Every number you just heard is traceable to this exact line on the card — that's
     not a prompt instruction, it's enforced in code in `guard.py`."
  3. "Adding a new loan product or language is just a new folder under `skills/` with
     a `SKILL.md` — no code change — because it follows the Agent Skill Open Standard."
  4. (If asked about speed) "Here's the debug panel — every step's on-device latency,
     live, no cherry-picking." (tap the "debug" button in the corner)

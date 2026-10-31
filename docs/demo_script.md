# Demo script (under 3 minutes, every time)

1. **Hook (20s):** "Lakhs of rural borrowers sign loans they can't read. The rules
   say explain it in their language, but nobody can prove they understood."
2. **Airplane mode on (10s):** show the phone/laptop is fully offline. Point at the
   "Offline ✓" badge in the app header.
3. **Scan (30s):** photograph `samples/microfinance_group_loan_card.png` (printed or
   on a second screen). Extracted fields appear with source lines.
4. **Explain (40s):** Telugu explanation plays per field, each one traceable to its
   source line. Mention the hallucination guard caught/would catch any invented number.
5. **Check (50s):** answer one question correctly (spoken or typed), one wrongly.
   Ardham re-explains only the missed part.
6. **Proof (20s):** show the comprehension certificate — score, timestamp, SHA-256 hash.
7. **Close (10s):** "Open source, on-device Gemma 4, built for the lenders who need
   proof and the borrowers who deserve to understand."

## Before you go on stage

- [ ] `ollama pull gemma4:e4b` done, `ollama list` shows it
- [ ] `./scripts/setup.sh` run, `.env` configured
- [ ] `./scripts/run_demo.sh` tested end to end at least once, Wi-Fi OFF
- [ ] `samples/sample_telugu_answer.wav` recorded, or fallback (tap/type) rehearsed
- [ ] Telugu voice checked on the actual demo machine (`spikes/05_tts_telugu_check.html`)
- [ ] Laptop charged, power bank + headset + phone hotspot as backup (backup only —
      the point of the demo is that the hotspot is never needed)

## If something breaks live

- Extraction/explain/answer fails with "model unavailable" → the error banner has a
  **"Switch to AI Studio backup and retry"** button right there — click it, no
  restart needed. (Needs a moment of Wi-Fi for that one call — say so plainly to
  the audience, it's honest and judges respect it.)
- Telugu audio input doesn't work → fall back to the typed-answer box in the Quiz screen.
- Telugu TTS voice missing → explanation text and its source quote are still shown on
  screen (the source-highlighting box); read it aloud yourself for the demo, or let
  the Hindi/English fallback voice speak it.
- Want to show judges the on-device speed claim isn't just talk → tap "debug" in the
  bottom-right corner any time to show live per-step latency.

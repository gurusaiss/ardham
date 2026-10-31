# Step 0 spikes

Shared client: `model_client_spike.py` — switches via `ARDHAM_BACKEND=local|aistudio`.

| # | Script | What it checks | Needs |
|---|---|---|---|
| 1 | `01_local_text.py` | Gemma 4 E4B loads locally, tokens/sec | Ollama + `ollama pull gemma4:e4b` |
| 2 | `02_vision_extract.py` | Loan card photo → structured JSON | Ollama or `GOOGLE_API_KEY` |
| 3 | `03_audio_telugu.py` | Spoken Telugu understood | Ollama or `GOOGLE_API_KEY`; synthetic fixtures already in `samples/sample_telugu_answer_*.wav` (re-record with a real voice before the actual demo) |
| 4 | `04_function_calling.py` | Reliable structured grading output | Ollama or `GOOGLE_API_KEY` |
| 5 | `05_tts_telugu_check.html` | Browser has a `te-IN` voice | Open in the demo browser (Chrome) |

## Run order on your laptop

```bash
# local backend (default)
ollama pull gemma4:e4b
cd spikes
python 01_local_text.py
python 02_vision_extract.py
python 04_function_calling.py
python 03_audio_telugu.py   # uses the synthetic fixtures already in samples/
```

```bash
# AI Studio backup — set once you have a key
export ARDHAM_BACKEND=aistudio
export GOOGLE_API_KEY=your_key_here
python 01_local_text.py   # (text-only; this one still mostly tests the local path's value)
python 02_vision_extract.py
python 04_function_calling.py
python 03_audio_telugu.py
```

Open `05_tts_telugu_check.html` directly in Chrome — no server needed.

See `../docs/SPIKE_RESULTS.md` for the results table and what was already confirmed by research
before any hardware was available to test on.

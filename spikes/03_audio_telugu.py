"""
Spike 3: send a short WAV of spoken Telugu, check that Gemma 4 transcribes/understands it.

Three synthetic fixtures (espeak-ng Telugu voice, generated during scaffolding —
robotic but real Telugu phonemes, good enough to test the plumbing) are at
samples/sample_telugu_answer_{correct,wrong,dontknow}.wav. Re-record them with a
real human voice before the actual demo — synthetic TTS is not a substitute for
testing against real borrower speech.

Test local Ollama first:
    python 03_audio_telugu.py

Then the AI Studio backup:
    ARDHAM_BACKEND=aistudio GOOGLE_API_KEY=... python 03_audio_telugu.py

If BOTH fail for audio, build.md's fallback applies: borrower taps/types answers,
voice answers fall back to Hindi/English.
"""
import os
from model_client_spike import generate

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")
FIXTURES = {
    "correct": ("sample_telugu_answer_correct.wav", "ఆరు వందల తొంభై రూపాయలు (690 rupees)"),
    "wrong": ("sample_telugu_answer_wrong.wav", "వెయ్యి రూపాయలు (1000 rupees, wrong)"),
    "dontknow": ("sample_telugu_answer_dontknow.wav", "నాకు తెలియదు (I don't know)"),
}

PROMPT = (
    "Listen to this audio clip. The speaker is answering, in Telugu, the question "
    "'How much will you pay every week for your loan?'. "
    "Transcribe what they said, and tell me the amount in rupees if one was mentioned."
)

if __name__ == "__main__":
    any_found = False
    for label, (filename, description) in FIXTURES.items():
        path = os.path.join(SAMPLES_DIR, filename)
        if not os.path.exists(path):
            print(f"[{label}] STATUS: skipped — {filename} not found")
            continue
        any_found = True
        print(f"[{label}] expecting: {description}")
        try:
            result = generate(PROMPT, audio=path)
            print(f"[{label}] STATUS: works, latency={result['latency_s']}s")
            print(f"[{label}] TEXT:", result["text"])
        except Exception as e:
            print(f"[{label}] STATUS: fails — {e!r}")
            print("FALLBACK: borrower taps/types answers; voice answers in Hindi/English only")
    if not any_found:
        print("No fixtures found. Run from samples/: espeak-ng -v te -w <file>.wav '<telugu text>'")

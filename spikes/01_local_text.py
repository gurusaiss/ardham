"""
Spike 1: confirm Gemma 4 E4B runs locally and measure tokens/sec.

Run on your laptop (needs Ollama + `ollama pull gemma4:e4b`):
    python 01_local_text.py

Report: works/fails, tokens/sec, exact model tag used.
"""
from model_client_spike import generate

PROMPT = (
    "Explain in simple Telugu, in two short sentences, what an interest rate "
    "on a loan means for someone who has never taken a loan before."
)

if __name__ == "__main__":
    try:
        result = generate(PROMPT)
        print("STATUS: works")
        print("MODEL TAG:", __import__("os").environ.get("OLLAMA_MODEL", "gemma4:e4b"))
        print("LATENCY (s):", result["latency_s"])
        print("TOKENS/SEC:", result.get("tokens_per_sec"))
        print("TEXT:\n", result["text"])
    except Exception as e:
        print("STATUS: fails")
        print("ERROR:", repr(e))

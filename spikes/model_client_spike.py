"""
Minimal shared client for the Step 0 spikes.

Two backends, selected by env var ARDHAM_BACKEND=local|aistudio:
  - local:    Ollama running Gemma 4 E4B (http://localhost:11434)
  - aistudio: Google AI Studio / Gemini API (needs GOOGLE_API_KEY)

Keep this dumb on purpose — it's a throwaway spike client, not the real
backend/model_client.py (which will be built properly in Hour 1-3).
"""
import base64
import json
import os
import time
import urllib.request

BACKEND = os.environ.get("ARDHAM_BACKEND", "local")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
AISTUDIO_MODEL = os.environ.get("AISTUDIO_MODEL", "gemma-4-27b-it")


def _post_json(url, payload, headers=None, timeout=120):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers or {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def generate(prompt, images=None, audio=None, schema=None):
    """
    images: list of local file paths (png/jpg)
    audio: local file path (wav)
    schema: optional JSON schema dict to request structured output
    Returns: dict with text, latency_s, raw
    """
    t0 = time.time()
    if BACKEND == "local":
        result = _generate_local(prompt, images, audio, schema)
    elif BACKEND == "aistudio":
        result = _generate_aistudio(prompt, images, audio, schema)
    else:
        raise ValueError(f"Unknown ARDHAM_BACKEND={BACKEND}")
    result["latency_s"] = round(time.time() - t0, 2)
    result["backend"] = BACKEND
    return result


def _b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _generate_local(prompt, images, audio, schema):
    msg = {"role": "user", "content": prompt}
    if images:
        msg["images"] = [_b64(p) for p in images]
    # NOTE: Ollama's audio support varies by build; this is what Step 0 is checking.
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [msg],
        "stream": False,
    }
    if schema:
        payload["format"] = schema
    raw = _post_json(f"{OLLAMA_URL}/api/chat", payload)
    text = raw.get("message", {}).get("content", "")
    tokens = raw.get("eval_count")
    eval_duration_ns = raw.get("eval_duration")
    tok_per_sec = None
    if tokens and eval_duration_ns:
        tok_per_sec = round(tokens / (eval_duration_ns / 1e9), 1)
    return {"text": text, "raw": raw, "tokens": tokens, "tokens_per_sec": tok_per_sec}


def _generate_aistudio(prompt, images, audio, schema):
    if not GOOGLE_API_KEY:
        raise RuntimeError("Set GOOGLE_API_KEY to use ARDHAM_BACKEND=aistudio")
    parts = [{"text": prompt}]
    if images:
        for p in images:
            mime = "image/png" if p.lower().endswith("png") else "image/jpeg"
            parts.append({"inline_data": {"mime_type": mime, "data": _b64(p)}})
    if audio:
        parts.append({"inline_data": {"mime_type": "audio/wav", "data": _b64(audio)}})
    payload = {"contents": [{"role": "user", "parts": parts}]}
    if schema:
        payload["generationConfig"] = {
            "response_mime_type": "application/json",
            "response_schema": schema,
        }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{AISTUDIO_MODEL}:generateContent?key={GOOGLE_API_KEY}"
    )
    raw = _post_json(url, payload, timeout=120)
    try:
        text = raw["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        text = ""
    usage = raw.get("usageMetadata", {})
    return {"text": text, "raw": raw, "tokens": usage.get("candidatesTokenCount")}

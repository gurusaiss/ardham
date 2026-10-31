"""
One interface over Gemma 4, two real backends, chosen by ARDHAM_BACKEND=local|aistudio.
A third, non-Gemma option (ARDHAM_BACKEND=stub) exists purely for offline UI/integration
rehearsal — see StubGemma's docstring; it is never the default and never what the
actual hackathon demo should run on.

generate(prompt, images=None, audio=None, schema=None) -> {"text": str, "latency_s": float, ...}

Keep this the single place that talks to the model so extract/explain/quiz never
care which backend is live.
"""
from __future__ import annotations

import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from pathlib import Path


class ModelUnavailableError(RuntimeError):
    """Raised when the configured Gemma backend can't be reached at all
    (Ollama not running, AI Studio unreachable/rejected) — distinct from the
    model running but returning bad output, which callers handle separately."""

    def __init__(self, backend: str, reason: str):
        self.backend = backend
        self.reason = reason
        super().__init__(f"{backend} backend unavailable: {reason}")


class GemmaClient(ABC):
    @abstractmethod
    def generate(
        self,
        prompt: str,
        images: list[str | Path] | None = None,
        audio: str | Path | None = None,
        schema: dict | None = None,
    ) -> dict:
        ...


def _post_json(url: str, payload: dict, headers: dict | None = None, timeout: int = 120) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers or {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _b64(path: str | Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


class LocalGemma(GemmaClient):
    """Gemma 4 E4B via a local Ollama instance."""

    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or os.environ.get("OLLAMA_URL", "http://localhost:11434")
        self.model = model or os.environ.get("OLLAMA_MODEL", "gemma4:e4b")

    def generate(self, prompt, images=None, audio=None, schema=None) -> dict:
        t0 = time.time()
        message: dict = {"role": "user", "content": prompt}
        if images:
            message["images"] = [_b64(p) for p in images]
        # Audio: Ollama's multimodal audio support is runtime-dependent — Step 0
        # spike 3 is what confirms this actually works before relying on it here.
        if audio:
            message["content"] += "\n[audio attached, see Step 0 spike for support status]"
        payload: dict = {"model": self.model, "messages": [message], "stream": False}
        if schema:
            payload["format"] = schema
        try:
            raw = _post_json(f"{self.base_url}/api/chat", payload)
        except (urllib.error.URLError, ConnectionError, OSError) as e:
            raise ModelUnavailableError(
                "local", f"could not reach Ollama at {self.base_url} ({e})"
            ) from e
        text = raw.get("message", {}).get("content", "")
        tokens = raw.get("eval_count")
        eval_duration_ns = raw.get("eval_duration")
        tokens_per_sec = round(tokens / (eval_duration_ns / 1e9), 1) if tokens and eval_duration_ns else None
        return {
            "text": text,
            "latency_s": round(time.time() - t0, 2),
            "tokens": tokens,
            "tokens_per_sec": tokens_per_sec,
            "backend": "local",
        }


class AIStudioGemma(GemmaClient):
    """Gemma 4 via the Google AI Studio / Gemini API — the offline-demo backup."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
        self.model = model or os.environ.get("AISTUDIO_MODEL", "gemma-4-27b-it")
        if not self.api_key:
            raise ModelUnavailableError("aistudio", "GOOGLE_API_KEY is not set")

    def generate(self, prompt, images=None, audio=None, schema=None) -> dict:
        t0 = time.time()
        parts: list[dict] = [{"text": prompt}]
        if images:
            for p in images:
                mime = "image/png" if str(p).lower().endswith("png") else "image/jpeg"
                parts.append({"inline_data": {"mime_type": mime, "data": _b64(p)}})
        if audio:
            parts.append({"inline_data": {"mime_type": "audio/wav", "data": _b64(audio)}})
        payload: dict = {"contents": [{"role": "user", "parts": parts}]}
        if schema:
            payload["generationConfig"] = {"response_mime_type": "application/json", "response_schema": schema}
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        try:
            raw = _post_json(url, payload, timeout=120)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace") if e.fp else ""
            raise ModelUnavailableError("aistudio", f"HTTP {e.code} from AI Studio: {body[:300]}") from e
        except (urllib.error.URLError, ConnectionError, OSError) as e:
            raise ModelUnavailableError("aistudio", f"could not reach AI Studio ({e})") from e
        try:
            text = raw["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            text = ""
        usage = raw.get("usageMetadata", {})
        return {
            "text": text,
            "latency_s": round(time.time() - t0, 2),
            "tokens": usage.get("candidatesTokenCount"),
            "backend": "aistudio",
        }


class StubGemma(GemmaClient):
    """NOT Gemma. A deterministic, offline stand-in that exists for one reason:
    proving the rest of the system (FastAPI routes, the guard, storage, the
    certificate, and the whole frontend flow) actually works end-to-end when no
    real Gemma backend is reachable — such as a sandbox with no GPU and no
    network path to Ollama or AI Studio.

    It always answers as if looking at the bundled
    samples/microfinance_group_loan_card.png, regardless of what image is
    actually sent, and returns canned-but-internally-consistent values so the
    hallucination guard still has real numbers to check against. Never select
    this for an actual demo — it has no idea what's really on any given loan
    card. It is intentionally NOT listed in GET /settings' available_backends,
    so the frontend's backend-switch UI can never choose it.
    """

    def __init__(self):
        self._sample_terms = self._load_sample_terms()

    @staticmethod
    def _load_sample_terms() -> dict:
        path = (
            Path(__file__).parent.parent
            / "samples"
            / "microfinance_group_loan_card.expected.json"
        )
        with path.open() as f:
            return json.load(f)

    def generate(self, prompt, images=None, audio=None, schema=None) -> dict:
        t0 = time.time()
        text = self._respond(prompt, audio=audio)
        return {"text": text, "latency_s": round(time.time() - t0, 3), "backend": "stub"}

    def _respond(self, prompt: str, audio) -> str:
        if "Extract ONLY the fields" in prompt:
            return json.dumps(
                {
                    field_id: {
                        "value": field["value"],
                        "source_text": field["source_text"],
                        "confidence": 0.95,
                    }
                    for field_id, field in self._sample_terms.items()
                }
            )

        if "You are explaining one line item" in prompt:
            field_match = re.search(r"Field: (\w+)", prompt)
            value_match = re.search(r"Value as printed on the card: (.+)", prompt)
            field_id = field_match.group(1) if field_match else "this"
            value = value_match.group(1).strip() if value_match else "?"
            return f"{field_id.replace('_', ' ')} విలువ {value} రూపాయలు. (stub వివరణ)"

        if prompt.startswith("Transcribe this spoken Telugu answer"):
            # Matches samples/sample_telugu_answer_correct.wav's script (690 rupees).
            # Good enough to drive a UI rehearsal; not real transcription.
            return "ఆరు వందల తొంభై రూపాయలు"

        if "Decide if this answer is correct" in prompt:
            field_match = re.search(r'for "(\w+)"', prompt)
            expected_match = re.search(r"is ([\d.]+) \(as printed", prompt)
            answer_match = re.search(r'transcribed or typed, was:\n\n"(.*)"', prompt)
            field_id = field_match.group(1) if field_match else ""
            answer_text = answer_match.group(1) if answer_match else ""
            try:
                expected = float(expected_match.group(1)) if expected_match else None
                numbers = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", answer_text)]
                correct = expected is not None and any(abs(n - expected) <= max(1.0, expected * 0.05) for n in numbers)
            except ValueError:
                correct = False
            return json.dumps({"correct": correct, "heard": answer_text, "field_id": field_id})

        return json.dumps({"text": "[stub: unrecognized prompt shape]"})


def get_client() -> GemmaClient:
    backend = os.environ.get("ARDHAM_BACKEND", "local")
    if backend == "local":
        return LocalGemma()
    if backend == "aistudio":
        return AIStudioGemma()
    if backend == "stub":
        return StubGemma()
    raise ValueError(f"Unknown ARDHAM_BACKEND={backend!r}, expected local|aistudio|stub")

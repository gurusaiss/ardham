"""Photo of a loan card -> LoanTerms. See prompts/extract.md for the exact wording."""
from __future__ import annotations

import json
from pathlib import Path

from model_client import GemmaClient
from schemas import FIELD_IDS, LoanField, LoanTerms

_PROMPT_TEMPLATE = (
    "You are reading a photographed loan Key Fact Statement or loan card for a "
    "{loan_type} in India. Extract ONLY the fields listed below, using text and "
    "numbers that literally appear on the card.\n\n"
    "Rules:\n"
    "- Do not calculate, round, or infer any value that is not printed on the card.\n"
    "- For every field, also return the exact line of text it came from (source_text).\n"
    "- If you are not confident a field is read correctly, set confidence below 0.7.\n"
    "- If a field is not present on the card, set its value to null and confidence to 0.\n"
    "- Never invent a borrower name, amount, or rate that is not visible in the image.\n\n"
    f"Fields: {', '.join(FIELD_IDS)}.\n\n"
    "Return JSON matching the given schema exactly."
)

_FIELD_SCHEMA = {
    "type": "object",
    "properties": {"value": {"type": ["number", "string", "null"]}, "source_text": {"type": "string"}, "confidence": {"type": "number"}},
    "required": ["value", "source_text", "confidence"],
}

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {field_id: _FIELD_SCHEMA for field_id in FIELD_IDS},
    "required": FIELD_IDS,
}


def extract_terms(
    client: GemmaClient, image_path: str | Path, loan_type: str
) -> tuple[LoanTerms, float]:
    """Returns (terms, latency_s) — latency surfaced for the frontend's debug panel."""
    prompt = _PROMPT_TEMPLATE.format(loan_type=loan_type)
    result = client.generate(prompt, images=[image_path], schema=EXTRACT_SCHEMA)
    try:
        raw = json.loads(result["text"])
    except json.JSONDecodeError as e:
        raise ValueError(f"extraction did not return valid JSON: {result['text']!r}") from e

    terms: LoanTerms = {}
    for field_id in FIELD_IDS:
        field_raw = raw.get(field_id) or {"value": None, "source_text": "", "confidence": 0.0}
        terms[field_id] = LoanField(
            value=field_raw.get("value"),
            source_text=field_raw.get("source_text", ""),
            confidence=float(field_raw.get("confidence", 0.0)),
        )
    return terms, float(result.get("latency_s", 0.0))

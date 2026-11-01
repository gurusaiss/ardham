"""Photo of a loan card -> LoanTerms. See prompts/extract.md for the exact wording."""
from __future__ import annotations

import json
import re
from pathlib import Path

from model_client import GemmaClient
from schemas import FIELD_IDS, NUMERIC_FIELD_IDS, LoanField, LoanTerms

_PROMPT_TEMPLATE = (
    "You are reading a photographed loan Key Fact Statement, loan card, or multi-page loan agreement for a "
    "{loan_type} in India. The document may contain multiple pages (1 to 10+ pages). Inspect ALL pages.\n\n"
    "SAFETY GUARDRAIL & DOCUMENT BARRIER:\n"
    "- If the uploaded images are NOT a genuine loan agreement, microfinance passbook, loan sanction letter, "
    "or debt repayment card (for example: user selfies, pets, landscapes, grocery bills, food, random receipts, blank paper), "
    "DO NOT invent or guess any loan figures. Set every field value to null and confidence to 0.\n\n"
    "Extraction Rules:\n"
    "- Extract ONLY the fields listed below, using text and numbers that literally appear on the pages.\n"
    "- Do not calculate, round, or infer any value that is not printed on the document.\n"
    "- For every field, also return the exact line of text and page context it came from (source_text).\n"
    "- If you are not confident a field is read correctly, set confidence below 0.7.\n"
    "- If a field is not present on any page, set its value to null and confidence to 0.\n"
    "- Never invent a borrower name, amount, or rate that is not visible in the images.\n\n"
    f"Fields: {', '.join(FIELD_IDS)}.\n\n"
    "Return JSON matching the given schema exactly."
)

_FIELD_SCHEMA = {
    "type": "object",
    "properties": {
        "value": {"type": "string"},
        "source_text": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": ["value", "source_text", "confidence"],
}

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {field_id: _FIELD_SCHEMA for field_id in FIELD_IDS},
    "required": FIELD_IDS,
}


def extract_terms(
    client: GemmaClient, image_path: str | Path | list[str | Path], loan_type: str
) -> tuple[LoanTerms, float]:
    """Returns (terms, latency_s) — latency surfaced for the frontend's debug panel."""
    prompt = _PROMPT_TEMPLATE.format(loan_type=loan_type)
    images = image_path if isinstance(image_path, list) else [image_path]
    result = client.generate(prompt, images=images, schema=EXTRACT_SCHEMA)
    try:
        raw = json.loads(result["text"])
    except json.JSONDecodeError as e:
        raise ValueError(f"extraction did not return valid JSON: {result['text']!r}") from e

    terms: LoanTerms = {}
    for field_id in FIELD_IDS:
        field_raw = raw.get(field_id) or {"value": None, "source_text": "", "confidence": 0.0}
        val = field_raw.get("value")
        if isinstance(val, str) and field_id in NUMERIC_FIELD_IDS:
            digits = re.findall(r"\d+(?:\.\d+)?", val.replace(",", ""))
            if digits:
                try:
                    val = float(digits[0]) if "." in digits[0] else int(digits[0])
                except ValueError:
                    pass
        elif isinstance(val, (int, float)):
            val = float(val) if isinstance(val, float) else int(val)

        terms[field_id] = LoanField(
            value=val,
            source_text=str(field_raw.get("source_text", "")),
            confidence=float(field_raw.get("confidence", 0.0)),
        )
    return terms, float(result.get("latency_s", 0.0))

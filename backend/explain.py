"""LoanTerms + skill -> short Telugu explanation sentences, one term at a time.

Every sentence is generated and then passed through guard.filter_explanation()
before it ever reaches the frontend — this module never returns unvalidated text.
"""
from __future__ import annotations

from guard import filter_explanation
from model_client import GemmaClient
from schemas import ExplanationSentence, LoanTerms
from skills_loader import Skill

_PROMPT_TEMPLATE = (
    "You are explaining one line item of a loan to a rural borrower in simple, "
    "spoken Telugu. Use short sentences a person with no financial background "
    "can follow immediately.\n\n"
    "Field: {field_id}\n"
    "Value as printed on the card: {value}\n"
    'Exact source line: "{source_text}"\n'
    "Plain-word glossary for this term: {glossary_entry}\n\n"
    "Rules:\n"
    "- Use ONLY the value given above. Never state a different number.\n"
    "- One or two short sentences, Telugu only, no English words except proper nouns.\n"
    "- Do not add advice, opinions, or warnings — state the fact plainly.\n"
    "- Reply with nothing but the sentence itself."
)

# Fields worth explaining to the borrower, in the order they should hear them.
EXPLAIN_FIELD_ORDER = [
    "loan_amount",
    "interest_rate",
    "instalment_amount",
    "num_instalments",
    "processing_fee",
    "insurance_premium",
    "total_payable",
    "penalty",
]


def generate_explanation(
    client: GemmaClient, terms: LoanTerms, skill: Skill, only_field_ids: list[str] | None = None
) -> tuple[list[ExplanationSentence], list[tuple[ExplanationSentence, str]], dict[str, float]]:
    """Returns (kept, dropped, latency_by_field_id). Pass only_field_ids to regenerate
    just a subset (targeted re-explanation after a wrong quiz answer)."""
    drafts: list[ExplanationSentence] = []
    latency_by_field: dict[str, float] = {}
    field_order = only_field_ids if only_field_ids is not None else EXPLAIN_FIELD_ORDER
    for field_id in field_order:
        field = terms.get(field_id)
        if field is None or field.value is None:
            continue
        prompt = _PROMPT_TEMPLATE.format(
            field_id=field_id,
            value=field.value,
            source_text=field.source_text,
            glossary_entry=skill.glossary.get(field_id, ""),
        )
        result = client.generate(prompt)
        drafts.append(ExplanationSentence(field_id=field_id, text_te=result["text"].strip()))
        latency_by_field[field_id] = float(result.get("latency_s", 0.0))

    kept, dropped = filter_explanation(drafts, terms)
    return kept, dropped, latency_by_field

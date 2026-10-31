"""Generate quiz questions from a skill's templates; grade spoken/typed answers.

Numbers are compared deterministically first (fast, free, no hallucination risk).
Only non-numeric or ambiguous answers fall through to the model for grading.
"""
from __future__ import annotations

import json

from guard import numbers_in_text  # reuse the same numeral parsing as the guard
from model_client import GemmaClient
from schemas import GradeResult, LoanTerms, Question
from skills_loader import Skill

GRADE_SCHEMA = {
    "type": "object",
    "properties": {
        "correct": {"type": "boolean"},
        "heard": {"type": "string"},
        "field_id": {"type": "string"},
    },
    "required": ["correct", "heard", "field_id"],
}

_GRADE_PROMPT = (
    'The correct answer for "{field_id}" is {expected_value} (as printed on the loan '
    'card). The borrower\'s answer, transcribed or typed, was:\n\n"{answer_text}"\n\n'
    "Decide if this answer is correct. Numbers within ~5% of the expected value, or "
    'stated in different units/words, count as correct. A vague, off-topic, or '
    '"I don\'t know" style answer is incorrect.\n\n'
    'Return JSON: {{"correct": bool, "heard": "<what you understood them to say>", '
    '"field_id": "{field_id}"}}'
)

TOLERANCE = 0.05


def generate_questions(skill: Skill) -> list[Question]:
    return [Question(**q) for q in skill.questions]


def _try_deterministic_grade(field_id: str, answer_text: str, terms: LoanTerms) -> GradeResult | None:
    field = terms.get(field_id)
    if field is None or not isinstance(field.value, (int, float)):
        return None
    candidate_numbers = numbers_in_text(answer_text)
    if not candidate_numbers:
        return None
    expected = float(field.value)
    correct = any(abs(n - expected) <= max(1.0, expected * TOLERANCE) for n in candidate_numbers)
    return GradeResult(correct=correct, heard=answer_text, field_id=field_id)


def grade_answer(
    client: GemmaClient, field_id: str, answer_text: str, terms: LoanTerms
) -> tuple[GradeResult, float]:
    """Returns (result, latency_s). Deterministic grades cost ~0 latency (no model call)."""
    deterministic = _try_deterministic_grade(field_id, answer_text, terms)
    if deterministic is not None:
        return deterministic, 0.0

    field = terms.get(field_id)
    expected_value = field.value if field else None
    prompt = _GRADE_PROMPT.format(field_id=field_id, expected_value=expected_value, answer_text=answer_text)
    result = client.generate(prompt, schema=GRADE_SCHEMA)
    latency_s = float(result.get("latency_s", 0.0))
    try:
        parsed = json.loads(result["text"])
        return GradeResult(**parsed), latency_s
    except (json.JSONDecodeError, TypeError, ValueError):
        return GradeResult(correct=False, heard=answer_text, field_id=field_id), latency_s

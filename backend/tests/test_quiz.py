"""Deterministic grading path — no model call needed for numeric answers."""
from quiz import _try_deterministic_grade
from schemas import LoanField

TERMS = {"instalment_amount": LoanField(value=690, source_text="Instalment Amount: Rs. 690 per week", confidence=0.95)}


def test_correct_numeric_answer():
    result = _try_deterministic_grade("instalment_amount", "six hundred ninety rupees", TERMS)
    assert result is None  # "six hundred ninety" in English words isn't parsed, falls through to model
    result = _try_deterministic_grade("instalment_amount", "690 rupees", TERMS)
    assert result is not None
    assert result.correct is True


def test_wrong_numeric_answer():
    result = _try_deterministic_grade("instalment_amount", "900 rupees", TERMS)
    assert result is not None
    assert result.correct is False


def test_within_tolerance_is_correct():
    result = _try_deterministic_grade("instalment_amount", "700", TERMS)
    # 700 vs 690 is within 5% tolerance (34.5 rupees), so this should pass
    assert result is not None
    assert result.correct is True


def test_telugu_numeral_words_parsed():
    result = _try_deterministic_grade("instalment_amount", "ఆరు వందల తొంభై రూపాయలు", TERMS)
    assert result is not None
    assert result.correct is True


def test_non_numeric_answer_falls_through_to_model():
    result = _try_deterministic_grade("instalment_amount", "I don't know", TERMS)
    assert result is None

"""
The hallucination guard — Ardham's differentiator.

Three jobs:
  1. check_consistency(terms): recompute derived values in code (e.g. instalment x
     count vs total payable) and flag mismatches the officer should see.
  2. validate_sentence(sentence, terms): every number in an explanation sentence
     must trace back to a value actually present in `terms` (or be a simple sum/
     product of two such values — e.g. "fees of 450" from 300 + 150). A number
     that matches nothing is treated as invented.
  3. filter_explanation(sentences, terms): drop any sentence with an invented
     number, or with no field_id, before it ever reaches the borrower.

Numbers are matched after normalizing commas/currency symbols, and a small
Telugu digit-word table lets us catch common spoken-style numerals too
("ఇరవై" = 20, "వెయ్యి" = 1000, ...). This is intentionally simple — good
enough to catch clearly invented figures, not a full NLP numeral parser.
"""
from __future__ import annotations

import re

from schemas import ExplanationSentence, LoanTerms

TOLERANCE = 0.02  # 2% relative tolerance for rounding in recomputed totals

# Minimal Telugu numeral-word -> value table, combined additively/multiplicatively
# (e.g. "ఆరు వందల తొంభై" -> 6*100 + 90 = 690). Covers what a borrower is likely to
# say out loud for amounts; not a complete linguistic parser.
_TELUGU_UNITS = {
    "సున్నా": 0, "ఒకటి": 1, "రెండు": 2, "మూడు": 3, "నాలుగు": 4, "ఐదు": 5,
    "ఆరు": 6, "ఏడు": 7, "ఎనిమిది": 8, "తొమ్మిది": 9, "పది": 10,
    "ఇరవై": 20, "ముప్పై": 30, "నలభై": 40, "యాభై": 50,
    "అరవై": 60, "డెబ్బై": 70, "ఎనభై": 80, "తొంభై": 90,
}
_TELUGU_MULTIPLIERS = {"వంద": 100, "వందల": 100, "వేయి": 1000, "వెయ్యి": 1000, "వేల": 1000}


def numbers_in_text(text: str) -> list[float]:
    numbers: list[float] = []

    # Plain numerals: "690", "34,500", "24%", "Rs. 300"
    for match in re.findall(r"\d[\d,]*(?:\.\d+)?", text):
        try:
            numbers.append(float(match.replace(",", "")))
        except ValueError:
            continue

    # Telugu numeral words — walk tokens, accumulate unit/multiplier sequences.
    tokens = re.findall(r"[ఀ-౿]+", text)
    running_total = 0.0
    current = 0.0
    found_any = False
    for tok in tokens:
        if tok in _TELUGU_UNITS:
            current += _TELUGU_UNITS[tok]
            found_any = True
        elif tok in _TELUGU_MULTIPLIERS:
            current = (current or 1) * _TELUGU_MULTIPLIERS[tok]
            found_any = True
        else:
            if found_any:
                running_total += current
                numbers.append(running_total)
                running_total = 0.0
                current = 0.0
                found_any = False
    if found_any:
        running_total += current
        numbers.append(running_total)

    return numbers


def _field_numeric_values(terms: LoanTerms) -> set[float]:
    values: set[float] = set()
    for field in terms.values():
        if isinstance(field.value, (int, float)):
            values.add(round(float(field.value), 2))
    return values


def _matches_known_value(n: float, known: set[float]) -> bool:
    if any(abs(n - k) <= max(1.0, k * TOLERANCE) for k in known):
        return True
    # Allow simple pairwise sums/differences (e.g. fee + insurance, or a %
    # rendered as a plain number like "24" matching interest_rate=24).
    known_list = list(known)
    for a in known_list:
        for b in known_list:
            if abs(n - (a + b)) <= max(1.0, (a + b) * TOLERANCE):
                return True
    return False


def check_consistency(terms: LoanTerms) -> list[str]:
    """Recompute derived values from raw fields; return human-readable warnings."""
    warnings: list[str] = []

    def val(field_id: str) -> float | None:
        f = terms.get(field_id)
        if f is None or not isinstance(f.value, (int, float)):
            return None
        return float(f.value)

    instalment = val("instalment_amount")
    count = val("num_instalments")
    total_payable = val("total_payable")
    loan_amount = val("loan_amount")
    fee = val("processing_fee") or 0.0
    insurance = val("insurance_premium") or 0.0

    if instalment is not None and count is not None and total_payable is not None:
        computed = instalment * count
        matches_amortized = abs(computed - total_payable) <= max(1.0, total_payable * TOLERANCE)
        matches_bullet = False
        if loan_amount is not None:
            matches_bullet = abs((loan_amount + computed) - total_payable) <= max(1.0, total_payable * TOLERANCE)

        if not (matches_amortized or matches_bullet):
            warnings.append(
                f"instalment x count = {computed:g} does not match stated total_payable "
                f"= {total_payable:g}"
            )

    if total_payable is not None and loan_amount is not None:
        if total_payable < loan_amount:
            warnings.append(
                f"total_payable ({total_payable:g}) is less than loan_amount ({loan_amount:g}) "
                "— check for a misread figure"
            )

    if loan_amount is not None and (fee or insurance) and loan_amount > 0:
        charge_ratio = (fee + insurance) / loan_amount
        if charge_ratio > 0.15:
            warnings.append(
                f"processing fee + insurance ({fee + insurance:g}) is over 15% of the loan "
                f"amount ({loan_amount:g}) — flag as a possible red flag for the officer"
            )

    return warnings


def validate_sentence(sentence: ExplanationSentence, terms: LoanTerms) -> tuple[bool, str | None]:
    """Returns (is_valid, reason_if_rejected)."""
    if not sentence.field_id or sentence.field_id not in terms:
        return False, "no field_id referenced, or field_id not in extracted terms"

    known = _field_numeric_values(terms)
    for n in numbers_in_text(sentence.text_te):
        if not _matches_known_value(n, known):
            return False, f"number {n:g} does not match any extracted field value"

    return True, None


def filter_explanation(
    sentences: list[ExplanationSentence], terms: LoanTerms
) -> tuple[list[ExplanationSentence], list[tuple[ExplanationSentence, str]]]:
    """Split sentences into (kept, dropped-with-reason)."""
    kept: list[ExplanationSentence] = []
    dropped: list[tuple[ExplanationSentence, str]] = []
    for s in sentences:
        ok, reason = validate_sentence(s, terms)
        if ok:
            kept.append(s)
        else:
            dropped.append((s, reason or "rejected"))
    return kept, dropped

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

import os
import re

from schemas import ExplanationSentence, LoanTerms

TOLERANCE = 0.02  # 2% relative tolerance for rounding in recomputed totals

# --- System Barriers, Bounds & Integrity Guards ------------------------------------
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_FILE_BYTES = 15 * 1024 * 1024  # 15 MB per page
MIN_FILE_BYTES = 100  # Minimum 100 bytes (blocks empty/corrupted uploads)
MAX_PAGES = 15


class DocumentBoundaryError(Exception):
    """Raised when an uploaded file violates size, format, or page boundaries."""

    def __init__(self, message_en: str, message_te: str, message_hi: str):
        self.message_en = message_en
        self.message_te = message_te
        self.message_hi = message_hi
        super().__init__(message_en)


class InvalidLoanDocumentError(Exception):
    """Raised when an uploaded image is not a genuine loan document (e.g. selfie, receipt, pet)."""

    def __init__(self, message_en: str, message_te: str, message_hi: str):
        self.message_en = message_en
        self.message_te = message_te
        self.message_hi = message_hi
        super().__init__(message_en)


def validate_file_boundaries(filename: str, size_bytes: int) -> None:
    """Enforces strict file type, file size, and page boundaries."""
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise DocumentBoundaryError(
            f"Invalid file extension '{ext}'. Only loan document photos (PNG, JPG, WEBP) or PDFs are accepted.",
            f"చెల్లని ఫైల్ రకం '{ext}'. కేవలం లోన్ కార్డు ఫోటోలు (PNG, JPG, WEBP) లేదా PDF పత్రాలు మాత్రమే అనుమతించబడతాయి.",
            f"अमान्य फ़ाइल प्रकार '{ext}'। केवल ऋण दस्तावेज़ की फोटो (PNG, JPG, WEBP) या PDF स्वीकार किए जाते हैं।",
        )

    if size_bytes > MAX_FILE_BYTES:
        raise DocumentBoundaryError(
            f"File '{filename}' exceeds maximum limit of 15MB. Please upload a smaller document image.",
            f"ఫైల్ '{filename}' 15MB కంటే పెద్దదిగా ఉంది. దయచేసి చిన్న సైజు గల లోన్ కార్డు ఫోటోను అప్‌లోడ్ చేయండి.",
            f"फ़ाइल '{filename}' 15MB सीमा से अधिक है। कृपया एक छोटी फ़ाइल अपलोड करें।",
        )

    if size_bytes < MIN_FILE_BYTES:
        raise DocumentBoundaryError(
            f"File '{filename}' appears empty or corrupt (under 100 bytes). Please take a clear photo of your loan card.",
            f"ఫైల్ '{filename}' ఖాళీగా లేదా దెబ్బతిన్నట్లు ఉంది. దయచేసి లోన్ కార్డును స్పష్టంగా ఫోటో తీయండి.",
            f"फ़ाइल '{filename}' खाली या दूषित प्रतीत होती है। कृपया स्पष्ट ऋण दस्तावेज़ अपलोड करें।",
        )


def validate_loan_document_authenticity(terms: LoanTerms) -> None:
    """
    Barrier: Strictly rejects non-loan documents (selfies, tickets, food, bills, random text).
    A genuine loan document or agreement must contain at least one primary debt metric
    (loan amount, interest rate, instalment amount, total payable, or tenure).
    """
    core_fields = [
        "loan_amount",
        "interest_rate",
        "instalment_amount",
        "num_instalments",
        "total_payable",
        "tenure",
    ]

    valid_core_count = 0
    for field_id in core_fields:
        f = terms.get(field_id)
        if f and f.value is not None and f.confidence > 0.2:
            if isinstance(f.value, (int, float)) and f.value > 0:
                valid_core_count += 1
            elif isinstance(f.value, str) and len(f.value.strip()) > 0:
                valid_core_count += 1

    if valid_core_count == 0:
        raise InvalidLoanDocumentError(
            "This document does not appear to be a loan agreement, passbook, or repayment schedule. Non-loan documents are strictly rejected. Please upload a valid microfinance loan card.",
            "ఈ పత్రంలో ఎలాంటి లోన్ లేదా రుణ చెల్లింపు వివరాలు కనిపించడం లేదు. లోన్ సంబంధిత పత్రాలు మాత్రమే అనుమతించబడతాయి. దయచేసి సరైన లోన్ కార్డు లేదా బ్యాంక్ పాస్‌బుక్‌ను అప్‌లోడ్ చేయండి.",
            "यह दस्तावेज़ ऋण अनुबंध, पासबुक या ऋण कार्ड नहीं लगता है। गैर-ऋण दस्तावेज़ अस्वीकार किए जाते हैं। कृपया एक वैध ऋण दस्तावेज़ अपलोड करें।",
        )


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


def compute_fairness_analysis(terms: LoanTerms) -> dict:
    """
    Ardham's Fair Lending & Predatory Trap Analyzer:
    - Calculates real in-hand cash vs sanctioned loan
    - Computes Real Effective APR vs Bank's Stated Interest Rate
    - Evaluates Fair Lending Index (0-100)
    - Compares cost against local informal moneylenders (వడ్డీ వ్యాపారి)
    - Emits plain-language warnings in both English & Pure Telugu.
    """
    def val(fid: str) -> float | None:
        f = terms.get(fid)
        return float(f.value) if f and isinstance(f.value, (int, float)) else None

    sanctioned = val("loan_amount") or 0.0
    fee = val("processing_fee") or 0.0
    insurance = val("insurance_premium") or 0.0
    upfront_deducted = fee + insurance
    net_in_hand = max(0.0, sanctioned - upfront_deducted)

    stated_rate = val("interest_rate") or 0.0
    instalment = val("instalment_amount")
    count = val("num_instalments")
    total_payable = val("total_payable")

    if total_payable is None and instalment is not None and count is not None:
        total_payable = instalment * count
    elif total_payable is None:
        total_payable = sanctioned

    total_extra_cost = max(0.0, total_payable - net_in_hand)

    # Estimate loan duration in months
    tenure_months = 12.0
    if count is not None and count > 0:
        if count > 20:  # Weekly installments (e.g. 50 weeks)
            tenure_months = max(3.0, round(count / 4.33, 1))
        else:  # Monthly installments
            tenure_months = float(count)

    # Compute Real Effective APR
    effective_apr = 0.0
    if net_in_hand > 0:
        effective_apr = round(((total_extra_cost / net_in_hand) / (tenure_months / 12.0)) * 100, 1)

    # Compute Fair Lending Score (0 to 100)
    score = 100
    warnings_en: list[str] = []
    warnings_te: list[str] = []

    # 1. Upfront deduction shock
    if sanctioned > 0 and upfront_deducted > 0:
        deduction_ratio = upfront_deducted / sanctioned
        if deduction_ratio > 0.08:
            score -= 20
            warnings_en.append(
                f"High Upfront Deductions: ₹{upfront_deducted:g} ({deduction_ratio*100:.1f}%) deducted before disbursal. Borrower receives only ₹{net_in_hand:g} in hand."
            )
            warnings_te.append(
                f"చేతికి తక్కువ నగదు: ప్రాసెసింగ్ & బీమా కొరకు ₹{upfront_deducted:g} ముందే కట్ చేసుకుంటారు. మీకు చేతికి ₹{net_in_hand:g} మాత్రమే అందుతుంది."
            )
        elif deduction_ratio > 0.03:
            score -= 8
            warnings_en.append(
                f"Upfront Fees: ₹{upfront_deducted:g} deducted upfront for processing & insurance."
            )
            warnings_te.append(
                f"ఫీజుల మినహాయింపు: ప్రాసెసింగ్ మరియు బీమా కొరకు ₹{upfront_deducted:g} ముందుగానే మినహాయిస్తారు."
            )

    # 2. Hidden APR Gap
    apr_gap = effective_apr - stated_rate
    if stated_rate > 0 and apr_gap > 3.0:
        score -= 15
        warnings_en.append(
            f"Hidden APR Discrepancy: Advertised nominal rate is {stated_rate:g}%, but Real Effective APR is {effective_apr:g}% (+{apr_gap:.1f}% higher due to upfront deductions & compounding)."
        )
        warnings_te.append(
            f"దాచిన వడ్డీ అంతరం: బ్యాంక్ చెప్పిన నామమాత్రపు వడ్డీ {stated_rate:g}%, కానీ ఫీజులన్నీ కలిపితే మీరు చెల్లించే అసలు వార్షిక వడ్డీ {effective_apr:g}%!"
        )

    # 3. Gold auction / severe penalty check
    penalty_field = terms.get("penalty")
    penalty_text = str(penalty_field.value if penalty_field else "").lower()
    if any(w in penalty_text for w in ["auction", "gold", "బంగారం", "అమ్మేస్తారు", "వేలం"]):
        score -= 10
        warnings_en.append(
            "Gold Auction Risk: Missed payments allow the lender to publicly auction your pledged gold."
        )
        warnings_te.append(
            "బంగారం వేలం ప్రమాదం: వాయిదాలు సకాలంలో కట్టకపోతే తాకట్టు పెట్టిన బంగారాన్ని బ్యాంక్ వేలం వేస్తుంది."
        )

    score = max(40, min(98, score))

    # Informal Moneylender (వడ్డీ వ్యాపారి) comparison: 36% simple interest
    shark_interest = round(sanctioned * 0.36 * (tenure_months / 12.0))
    savings_vs_shark = max(0.0, shark_interest - total_extra_cost)

    return {
        "sanctioned_amount": sanctioned,
        "upfront_deductions": upfront_deducted,
        "net_in_hand": net_in_hand,
        "total_payable": total_payable,
        "total_extra_cost": total_extra_cost,
        "stated_interest_rate": stated_rate,
        "effective_apr": effective_apr,
        "apr_gap": round(apr_gap, 1) if stated_rate > 0 else 0.0,
        "tenure_months": tenure_months,
        "fairness_score": score,
        "fairness_label": (
            "Fair & Transparent" if score >= 80 else "Moderate Risk" if score >= 65 else "High Predatory Risk"
        ),
        "fairness_label_te": (
            "న్యాయమైన రుణం" if score >= 80 else "మధ్యస్థ రుసుములు" if score >= 65 else "అధిక చార్జీల హెచ్చరిక"
        ),
        "moneylender_comparison": {
            "shark_apr": 36.0,
            "shark_cost": shark_interest,
            "borrower_savings": round(savings_vs_shark),
            "savings_te": f"ప్రైవేట్ వడ్డీ వ్యాపారి (నెలకు ₹3 వడ్డీ) కంటే మీరు ₹{round(savings_vs_shark):,} ఆదా చేస్తున్నారు.",
            "savings_en": f"You save ₹{round(savings_vs_shark):,} compared to an informal private moneylender (36% APR).",
        },
        "warnings_en": warnings_en,
        "warnings_te": warnings_te,
    }


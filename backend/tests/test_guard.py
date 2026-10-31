"""Guard tests: an invented number gets caught, mismatched totals get flagged,
unreferenced claims get dropped. These are the three behaviors the build doc
calls out explicitly as the quality bar for guard.py.
"""
from guard import check_consistency, filter_explanation, validate_sentence
from schemas import ExplanationSentence, LoanField

SAMPLE_TERMS = {
    "lender": LoanField(value="Sample Rural Credit MFI Ltd.", source_text="Lender: Sample Rural Credit MFI Ltd.", confidence=0.95),
    "loan_amount": LoanField(value=30000, source_text="Loan Amount Sanctioned: Rs. 30,000", confidence=0.95),
    "interest_rate": LoanField(value=24, source_text="Interest Rate (Reducing Balance): 24% per annum", confidence=0.9),
    "instalment_amount": LoanField(value=690, source_text="Instalment Amount: Rs. 690 per week", confidence=0.95),
    "num_instalments": LoanField(value=50, source_text="Number of Instalments: 50", confidence=0.95),
    "processing_fee": LoanField(value=300, source_text="Processing Fee: Rs. 300", confidence=0.9),
    "insurance_premium": LoanField(value=150, source_text="Insurance Premium: Rs. 150", confidence=0.9),
    "total_payable": LoanField(value=34500, source_text="Total Amount Payable: Rs. 34,500", confidence=0.95),
    "penalty": LoanField(value=20, source_text="Penalty: Rs. 20 per missed instalment", confidence=0.9),
}


def test_invented_number_is_rejected():
    sentence = ExplanationSentence(
        field_id="instalment_amount",
        text_te="మీరు ప్రతి వారం 900 రూపాయలు కడతారు.",  # 900 does not appear anywhere in terms
    )
    ok, reason = validate_sentence(sentence, SAMPLE_TERMS)
    assert ok is False
    assert "900" in reason


def test_correct_number_is_accepted():
    sentence = ExplanationSentence(
        field_id="instalment_amount",
        text_te="మీరు ప్రతి వారం 690 రూపాయలు కడతారు.",
    )
    ok, reason = validate_sentence(sentence, SAMPLE_TERMS)
    assert ok is True
    assert reason is None


def test_sum_of_two_known_values_is_accepted():
    # fee (300) + insurance (150) = 450 should be accepted as a legitimate combined figure
    sentence = ExplanationSentence(
        field_id="processing_fee",
        text_te="రుసుము మరియు బీమా కలిపి 450 రూపాయలు మినహాయిస్తారు.",
    )
    ok, _ = validate_sentence(sentence, SAMPLE_TERMS)
    assert ok is True


def test_sentence_with_no_field_id_is_rejected():
    sentence = ExplanationSentence(field_id="not_a_real_field", text_te="ఇది 690 రూపాయలు.")
    ok, reason = validate_sentence(sentence, SAMPLE_TERMS)
    assert ok is False
    assert "field_id" in reason


def test_filter_explanation_drops_unreferenced_claims():
    sentences = [
        ExplanationSentence(field_id="instalment_amount", text_te="మీరు ప్రతి వారం 690 రూపాయలు కడతారు."),
        ExplanationSentence(field_id="instalment_amount", text_te="మీరు ప్రతి వారం 1500 రూపాయలు కడతారు."),  # invented
    ]
    kept, dropped = filter_explanation(sentences, SAMPLE_TERMS)
    assert len(kept) == 1
    assert len(dropped) == 1
    assert "1500" in dropped[0][1]


def test_mismatched_total_is_flagged():
    bad_terms = dict(SAMPLE_TERMS)
    bad_terms["total_payable"] = LoanField(value=50000, source_text="Total Amount Payable: Rs. 50,000", confidence=0.9)
    warnings = check_consistency(bad_terms)
    assert any("does not match stated total_payable" in w for w in warnings)


def test_consistent_total_raises_no_warning():
    warnings = check_consistency(SAMPLE_TERMS)
    assert not any("does not match stated total_payable" in w for w in warnings)


def test_high_fee_ratio_is_flagged():
    bad_terms = dict(SAMPLE_TERMS)
    bad_terms["processing_fee"] = LoanField(value=4000, source_text="Processing Fee: Rs. 4,000", confidence=0.9)
    bad_terms["insurance_premium"] = LoanField(value=1500, source_text="Insurance Premium: Rs. 1,500", confidence=0.9)
    warnings = check_consistency(bad_terms)
    assert any("over 15%" in w for w in warnings)

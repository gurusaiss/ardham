"""Extraction against the sample expected JSON — needs a live Gemma backend
(local Ollama or AI Studio), so it's skipped unless ARDHAM_RUN_LIVE_TESTS=1.
"""
import json
import os
from pathlib import Path

import pytest

from extract import extract_terms
from model_client import get_client

SAMPLES_DIR = Path(__file__).parent.parent.parent / "samples"

pytestmark = pytest.mark.skipif(
    os.environ.get("ARDHAM_RUN_LIVE_TESTS") != "1",
    reason="needs a live Gemma backend; set ARDHAM_RUN_LIVE_TESTS=1 and ARDHAM_BACKEND",
)


def test_extracts_sample_microfinance_card():
    image_path = SAMPLES_DIR / "microfinance_group_loan_card.png"
    expected = json.loads((SAMPLES_DIR / "microfinance_group_loan_card.expected.json").read_text())

    client = get_client()
    terms, _latency_s = extract_terms(client, image_path, "microfinance-group-loan")

    for field_id in ["loan_amount", "interest_rate", "instalment_amount", "total_payable"]:
        assert terms[field_id].value == expected[field_id]["value"], f"{field_id} mismatch"

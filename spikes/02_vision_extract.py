"""
Spike 2: send the sample loan card image, get structured JSON fields back.

Run locally (Ollama) or here in the sandbox against AI Studio:
    ARDHAM_BACKEND=aistudio GOOGLE_API_KEY=... python 02_vision_extract.py

Report: works/fails, whether fields match samples/microfinance_group_loan_card.expected.json,
and latency.
"""
import json
import os
from model_client_spike import generate

IMAGE_PATH = os.path.join(os.path.dirname(__file__), "..", "samples", "microfinance_group_loan_card.png")
EXPECTED_PATH = os.path.join(os.path.dirname(__file__), "..", "samples", "microfinance_group_loan_card.expected.json")

SCHEMA = {
    "type": "object",
    "properties": {
        "lender": {"type": "string"},
        "borrower_name": {"type": "string"},
        "loan_amount": {"type": "number"},
        "interest_rate": {"type": "number"},
        "tenure_weeks": {"type": "number"},
        "instalment_amount": {"type": "number"},
        "num_instalments": {"type": "number"},
        "processing_fee": {"type": "number"},
        "insurance_premium": {"type": "number"},
        "total_payable": {"type": "number"},
        "penalty": {"type": "number"},
    },
    "required": [
        "lender", "borrower_name", "loan_amount", "interest_rate", "tenure_weeks",
        "instalment_amount", "num_instalments", "processing_fee", "insurance_premium",
        "total_payable", "penalty",
    ],
}

PROMPT = (
    "Read this loan Key Fact Statement card. Extract exactly these fields as JSON, "
    "using only numbers and text that literally appear on the card. "
    "Do not calculate or infer any value that is not printed. "
    "If a field is missing, use null."
)

if __name__ == "__main__":
    try:
        result = generate(PROMPT, images=[IMAGE_PATH], schema=SCHEMA)
        print("STATUS: works")
        print("LATENCY (s):", result["latency_s"])
        print("RAW TEXT:\n", result["text"])

        with open(EXPECTED_PATH) as f:
            expected = json.load(f)
        try:
            got = json.loads(result["text"])
        except json.JSONDecodeError:
            print("JSON PARSE: fails — model did not return valid JSON")
            got = None

        if got:
            checks = [
                ("loan_amount", expected["loan_amount"]["value"]),
                ("interest_rate", expected["interest_rate"]["value"]),
                ("instalment_amount", expected["instalment_amount"]["value"]),
                ("total_payable", expected["total_payable"]["value"]),
            ]
            for field, exp_val in checks:
                got_val = got.get(field)
                match = "OK" if got_val == exp_val else f"MISMATCH (got {got_val}, expected {exp_val})"
                print(f"  {field}: {match}")
    except Exception as e:
        print("STATUS: fails")
        print("ERROR:", repr(e))

"""
Spike 4: confirm reliable structured output for the quiz-grading loop.

Simulates grading one borrower answer against the expected field value.
"""
import json
from model_client_spike import generate

SCHEMA = {
    "type": "object",
    "properties": {
        "correct": {"type": "boolean"},
        "heard": {"type": "string"},
        "field_id": {"type": "string"},
    },
    "required": ["correct", "heard", "field_id"],
}

PROMPT = (
    "The correct weekly instalment amount is Rs. 690 (field_id: instalment_amount). "
    "The borrower answered (transcribed): 'six hundred ninety rupees every week'. "
    "Return JSON: whether the answer is correct, what you heard them say, and the field_id checked."
)

TEST_CASES = [
    ("six hundred ninety rupees every week", True),
    ("seven hundred rupees", False),
    ("I don't know", False),
]

if __name__ == "__main__":
    results = []
    for answer, expected_correct in TEST_CASES:
        prompt = (
            f"The correct weekly instalment amount is Rs. 690 (field_id: instalment_amount). "
            f"The borrower answered (transcribed): '{answer}'. "
            f"Return JSON: whether the answer is correct, what you heard them say, and the field_id checked."
        )
        try:
            result = generate(prompt, schema=SCHEMA)
            try:
                parsed = json.loads(result["text"])
                match = "OK" if parsed.get("correct") == expected_correct else "MISMATCH"
                print(f"[{match}] answer={answer!r} -> {parsed}")
            except json.JSONDecodeError:
                print(f"[PARSE FAIL] answer={answer!r} -> {result['text']!r}")
        except Exception as e:
            print(f"[ERROR] answer={answer!r} -> {e!r}")

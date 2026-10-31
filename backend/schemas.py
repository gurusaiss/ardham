"""Shared data shapes. Kept as plain dataclasses/dicts-in-Pydantic, no ORM."""
from pydantic import BaseModel


class LoanField(BaseModel):
    value: float | str | None
    source_text: str
    confidence: float = 1.0


LoanTerms = dict[str, LoanField]

FIELD_IDS = [
    "lender",
    "borrower_name",
    "loan_amount",
    "interest_rate",
    "tenure",
    "instalment_amount",
    "num_instalments",
    "processing_fee",
    "insurance_premium",
    "total_payable",
    "penalty",
]

NUMERIC_FIELD_IDS = [
    "loan_amount",
    "interest_rate",
    "instalment_amount",
    "num_instalments",
    "processing_fee",
    "insurance_premium",
    "total_payable",
    "penalty",
]


class ExplanationSentence(BaseModel):
    field_id: str
    text_te: str


class Question(BaseModel):
    field_id: str
    prompt_te: str
    prompt_en: str


class GradeResult(BaseModel):
    correct: bool
    heard: str
    field_id: str


class Certificate(BaseModel):
    session_id: str
    loan_type: str
    terms: LoanTerms
    questions: list[Question]
    results: list[GradeResult]
    score: int
    created_at: str
    sha256: str

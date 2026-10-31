"""FastAPI app — one process, wires extract -> guard -> explain -> quiz -> certificate."""
from __future__ import annotations

import os
import shutil
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import storage
from certificate import build_certificate, render_html
from extract import extract_terms
from explain import generate_explanation
from guard import check_consistency
from model_client import ModelUnavailableError, get_client
from quiz import generate_questions, grade_answer
from schemas import GradeResult, LoanField, LoanTerms, Question
from skills_loader import Skill, list_loan_types


@asynccontextmanager
async def lifespan(_app: FastAPI):
    storage.init_db()
    yield


app = FastAPI(title="Ardham backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon demo, single local user — fine to leave open
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_client_or_503():
    """Every route that talks to the model goes through this, so a down model
    (Ollama not running, AI Studio unreachable) always surfaces the same
    structured error shape the frontend can act on with a one-click switch."""
    try:
        return get_client()
    except ModelUnavailableError as e:
        raise HTTPException(
            status_code=503,
            detail={"error": "model_unavailable", "backend": e.backend, "reason": e.reason},
        ) from e


def _call_model_or_503(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except ModelUnavailableError as e:
        raise HTTPException(
            status_code=503,
            detail={"error": "model_unavailable", "backend": e.backend, "reason": e.reason},
        ) from e


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "backend": os.environ.get("ARDHAM_BACKEND", "local")}


@app.get("/settings")
def get_settings() -> dict:
    return {
        "backend": os.environ.get("ARDHAM_BACKEND", "local"),
        "available_backends": ["local", "aistudio"],
    }


class BackendChoice(BaseModel):
    backend: str


@app.post("/settings/backend")
def set_backend(choice: BackendChoice) -> dict:
    if choice.backend not in ("local", "aistudio"):
        raise HTTPException(status_code=400, detail="backend must be 'local' or 'aistudio'")
    os.environ["ARDHAM_BACKEND"] = choice.backend
    return {"backend": choice.backend}


@app.get("/loan-types")
def loan_types() -> dict:
    return {"loan_types": list_loan_types()}


def _get_session_or_404(session_id: str) -> dict:
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    return session


@app.post("/extract")
async def extract(loan_type: str = Form(...), image: UploadFile = File(...)) -> dict:
    try:
        Skill(loan_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    session_id = storage.create_session(loan_type)
    image_path = storage.session_dir(session_id) / "loan_card.png"
    with image_path.open("wb") as f:
        shutil.copyfileobj(image.file, f)

    client = _get_client_or_503()
    terms, latency_s = _call_model_or_503(extract_terms, client, image_path, loan_type)
    storage.save_terms(session_id, terms)

    warnings = check_consistency(terms)
    return {
        "session_id": session_id,
        "terms": {k: v.model_dump() for k, v in terms.items()},
        "consistency_warnings": warnings,
        "latency": {"extract_s": latency_s},
    }


@app.get("/sessions/{session_id}/terms")
async def get_terms(session_id: str) -> dict:
    session = _get_session_or_404(session_id)
    return {"terms": session["terms"], "loan_type": session["loan_type"]}


@app.post("/sessions/{session_id}/confirm")
async def confirm(session_id: str, body: dict) -> dict:
    _get_session_or_404(session_id)
    raw_terms = body.get("terms", {})
    terms: LoanTerms = {k: LoanField(**v) for k, v in raw_terms.items()}
    storage.save_terms(session_id, terms)
    return {"ok": True}


@app.get("/sessions/{session_id}/explain")
async def explain(session_id: str, field_ids: str | None = None) -> dict:
    """field_ids: optional comma-separated list to regenerate only those fields
    (used for targeted re-explanation after a wrong quiz answer)."""
    session = _get_session_or_404(session_id)
    terms: LoanTerms = {k: LoanField(**v) for k, v in session["terms"].items()}
    skill = Skill(session["loan_type"])
    client = _get_client_or_503()
    only = [f.strip() for f in field_ids.split(",") if f.strip()] if field_ids else None
    kept, dropped, latency_by_field = _call_model_or_503(
        generate_explanation, client, terms, skill, only
    )
    return {
        "sentences": [s.model_dump() for s in kept],
        "dropped": [{"field_id": s.field_id, "reason": reason} for s, reason in dropped],
        "latency": {"explain_by_field_s": latency_by_field, "total_s": sum(latency_by_field.values())},
    }


@app.get("/sessions/{session_id}/quiz")
async def quiz(session_id: str) -> dict:
    session = _get_session_or_404(session_id)
    skill = Skill(session["loan_type"])
    questions = generate_questions(skill)
    storage.save_questions(session_id, questions)
    return {"questions": [q.model_dump() for q in questions]}


@app.post("/sessions/{session_id}/answer")
async def answer(
    session_id: str,
    field_id: str = Form(...),
    audio: UploadFile | None = File(None),
    typed_answer: str | None = Form(None),
) -> dict:
    session = _get_session_or_404(session_id)
    terms: LoanTerms = {k: LoanField(**v) for k, v in session["terms"].items()}
    client = _get_client_or_503()

    transcribe_latency_s = 0.0
    if typed_answer:
        answer_text = typed_answer
    elif audio is not None:
        audio_path = storage.session_dir(session_id) / f"answer_{field_id}.wav"
        with audio_path.open("wb") as f:
            shutil.copyfileobj(audio.file, f)
        transcription = _call_model_or_503(
            client.generate, "Transcribe this spoken Telugu answer to plain text.", audio=audio_path
        )
        answer_text = transcription["text"]
        transcribe_latency_s = float(transcription.get("latency_s", 0.0))
    else:
        raise HTTPException(status_code=400, detail="either audio or typed_answer is required")

    result, grade_latency_s = _call_model_or_503(grade_answer, client, field_id, answer_text, terms)
    storage.append_result(session_id, result)
    return {
        **result.model_dump(),
        "latency": {"transcribe_s": transcribe_latency_s, "grade_s": grade_latency_s},
    }


@app.get("/sessions/{session_id}/certificate")
async def certificate(session_id: str) -> dict:
    session = _get_session_or_404(session_id)
    terms: LoanTerms = {k: LoanField(**v) for k, v in session["terms"].items()}
    questions = [Question(**q) for q in session["questions"]]
    results = [GradeResult(**r) for r in session["results"]]
    cert = build_certificate(session_id, session["loan_type"], terms, questions, results)
    return cert.model_dump()


@app.get("/sessions/{session_id}/certificate.html", response_class=HTMLResponse)
async def certificate_html(session_id: str) -> str:
    session = _get_session_or_404(session_id)
    terms: LoanTerms = {k: LoanField(**v) for k, v in session["terms"].items()}
    questions = [Question(**q) for q in session["questions"]]
    results = [GradeResult(**r) for r in session["results"]]
    cert = build_certificate(session_id, session["loan_type"], terms, questions, results)
    return render_html(cert)

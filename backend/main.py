"""FastAPI app — one process, wires extract -> guard -> explain -> quiz -> certificate."""
from __future__ import annotations

import hashlib
import os
import shutil
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import storage
from certificate import build_certificate, render_html
from extract import extract_terms
from explain import generate_explanation
from guard import (
    DocumentBoundaryError,
    InvalidLoanDocumentError,
    MAX_PAGES,
    check_consistency,
    compute_fairness_analysis,
    validate_file_boundaries,
    validate_loan_document_authenticity,
)
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
        "available_backends": ["local", "aistudio", "groq"],
    }


class BackendChoice(BaseModel):
    backend: str


@app.post("/settings/backend")
def set_backend(choice: BackendChoice) -> dict:
    if choice.backend not in ("local", "aistudio", "groq"):
        raise HTTPException(status_code=400, detail="backend must be 'local', 'aistudio', or 'groq'")
    os.environ["ARDHAM_BACKEND"] = choice.backend
    return {"backend": choice.backend}


@app.get("/loan-types")
def loan_types() -> dict:
    return {"loan_types": list_loan_types()}


SAMPLES_DIR = Path(__file__).parent.parent / "samples"


@app.get("/samples/{loan_type}/card.png")
def get_sample_card(loan_type: str):
    name_map = {
        "microfinance-group-loan": "microfinance_group_loan_card.png",
        "gold-loan": "gold_loan_card.png",
        "individual-personal-loan": "individual_personal_loan_card.png",
    }
    filename = name_map.get(loan_type)
    if not filename:
        raise HTTPException(status_code=404, detail="sample not found")
    path = SAMPLES_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(path, media_type="image/png")


def _get_session_or_404(session_id: str) -> dict:
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    return session


@app.post("/extract")
async def extract(
    loan_type: str = Form(...),
    image: UploadFile | None = File(None),
    images: list[UploadFile] | None = File(None),
) -> dict:
    try:
        Skill(loan_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    upload_list: list[UploadFile] = []
    if images:
        upload_list.extend(images)
    if image and (not images or image.filename != (images[0].filename if images else None)):
        upload_list.append(image)

    if not upload_list:
        raise HTTPException(status_code=400, detail="At least one image or document page is required")

    # Barrier 1: Page quantity limit
    if len(upload_list) > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "DOCUMENT_BOUNDARY_ERROR",
                "message": f"Maximum {MAX_PAGES} pages allowed per session. You provided {len(upload_list)} pages.",
                "message_en": f"Maximum {MAX_PAGES} pages allowed per session. You provided {len(upload_list)} pages.",
                "message_te": f"ఒకేసారి గరిష్టంగా {MAX_PAGES} పేజీలు మాత్రమే అనుమతించబడతాయి. మీరు {len(upload_list)} పేజీలు ఇచ్చారు.",
                "message_hi": f"प्रति सत्र अधिकतम {MAX_PAGES} पृष्ठों की अनुमति है। आपने {len(upload_list)} पृष्ठ दिए हैं।",
            },
        )

    # Barrier 2: File extension preliminary check
    for up in upload_list:
        fname = up.filename or "unknown.png"
        ext = os.path.splitext(fname.lower())[1]
        if ext and ext not in {".png", ".jpg", ".jpeg", ".webp", ".pdf"}:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "DOCUMENT_BOUNDARY_ERROR",
                    "message": f"Invalid file extension '{ext}'. Only loan document photos (PNG, JPG, WEBP) or PDFs are accepted.",
                    "message_en": f"Invalid file extension '{ext}'. Only loan document photos (PNG, JPG, WEBP) or PDFs are accepted.",
                    "message_te": f"చెల్లని ఫైల్ రకం '{ext}'. కేవలం లోన్ కార్డు ఫోటోలు (PNG, JPG, WEBP) లేదా PDF పత్రాలు మాత్రమే అనుమతించబడతాయి.",
                    "message_hi": f"अमान्य फ़ाइल प्रकार '{ext}'। केवल ऋण दस्तावेज़ की फोटो (PNG, JPG, WEBP) या PDF स्वीकार किए जाते हैं।",
                },
            )

    session_id = storage.create_session(loan_type)
    saved_paths: list[Path] = []
    for idx, up in enumerate(upload_list):
        fname = up.filename or f"page_{idx + 1}.png"
        ext = os.path.splitext(fname.lower())[1] or ".png"
        filename = f"loan_card_page_{idx + 1}{ext}"
        path = storage.session_dir(session_id) / filename
        with path.open("wb") as f:
            shutil.copyfileobj(up.file, f)

        file_size = path.stat().st_size
        try:
            validate_file_boundaries(fname, size_bytes=file_size)
        except DocumentBoundaryError as e:
            shutil.rmtree(storage.session_dir(session_id), ignore_errors=True)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "DOCUMENT_BOUNDARY_ERROR",
                    "message": e.message_en,
                    "message_en": e.message_en,
                    "message_te": e.message_te,
                    "message_hi": e.message_hi,
                },
            )
        saved_paths.append(path)

    # Maintain backward compatibility for loan_card.png
    primary_path = storage.session_dir(session_id) / "loan_card.png"
    if not primary_path.exists() and saved_paths:
        shutil.copyfile(saved_paths[0], primary_path)

    client = _get_client_or_503()
    terms, latency_s = _call_model_or_503(extract_terms, client, saved_paths, loan_type)

    # Barrier 3: Enforce loan document authenticity (strictly rejects non-loan images)
    try:
        validate_loan_document_authenticity(terms)
    except InvalidLoanDocumentError as e:
        shutil.rmtree(storage.session_dir(session_id), ignore_errors=True)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_LOAN_DOCUMENT",
                "message": e.message_en,
                "message_en": e.message_en,
                "message_te": e.message_te,
                "message_hi": e.message_hi,
            },
        )

    storage.save_terms(session_id, terms)

    warnings = check_consistency(terms)
    fairness = compute_fairness_analysis(terms)
    return {
        "session_id": session_id,
        "terms": {k: v.model_dump() for k, v in terms.items()},
        "consistency_warnings": warnings,
        "fairness_analysis": fairness,
        "latency": {"extract_s": latency_s},
    }


@app.get("/sessions/{session_id}/terms")
async def get_terms(session_id: str) -> dict:
    session = _get_session_or_404(session_id)
    return {"terms": session["terms"], "loan_type": session["loan_type"]}


@app.get("/sessions/{session_id}/analysis")
async def get_analysis(session_id: str) -> dict:
    session = _get_session_or_404(session_id)
    raw_terms = session.get("terms", {})
    terms: LoanTerms = {k: LoanField(**v) for k, v in raw_terms.items()}
    return compute_fairness_analysis(terms)


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


@app.get("/sessions/{session_id}/audio/{field_id}")
async def get_answer_audio(session_id: str, field_id: str):
    _get_session_or_404(session_id)
    audio_path = storage.session_dir(session_id) / f"answer_{field_id}.wav"
    if audio_path.exists():
        return FileResponse(audio_path, media_type="audio/wav")
    sample_audio = Path(__file__).parent.parent / "samples" / "sample_telugu_answer_correct.wav"
    if sample_audio.exists():
        return FileResponse(sample_audio, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Audio recording not found")


# High-Fidelity Indian Regional Neural Text-To-Speech (Telugu, Hindi, Indian English)
TTS_CACHE_DIR = Path(__file__).parent / "data" / "tts_cache"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

TTS_VOICE_MAP = {
    "te": "te-IN-ShrutiNeural",            # Local Andhra Pradesh & Telangana Telugu Female
    "hi": "hi-IN-SwaraNeural",             # Authentic polite Hindi Female
    "en": "en-IN-NeerjaExpressiveNeural",  # Fluent young Indian English Female
}


@app.get("/api/tts")
async def tts_synthesize(text: str, lang: str = "te"):
    """Synthesizes crystal-clear local Indian accents using neural voice models."""
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    target_lang = "te" if lang.startswith("te") else "hi" if lang.startswith("hi") else "en"
    voice = TTS_VOICE_MAP.get(target_lang, "te-IN-ShrutiNeural")

    # Fast disk cache check
    cache_key = hashlib.sha256(f"{voice}:{cleaned_text}".encode("utf-8")).hexdigest()
    cache_path = TTS_CACHE_DIR / f"{cache_key}.mp3"

    if cache_path.exists():
        return FileResponse(cache_path, media_type="audio/mpeg")

    try:
        import edge_tts

        communicate = edge_tts.Communicate(cleaned_text, voice, rate="-4%", pitch="+2Hz")
        await communicate.save(str(cache_path))
        return FileResponse(cache_path, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Neural TTS service unavailable: {e}")


# Optional Full-Stack Deployment: Serve frontend SPA build if present
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

"""Always-on end-to-end integration test against StubGemma (ARDHAM_BACKEND=stub).

This is NOT a test of Gemma 4 — StubGemma is a deterministic stand-in (see its
docstring in model_client.py). What this proves, for real, on every test run
with no external dependency: the FastAPI routes, the guard's number-matching
against real extracted values, SQLite storage, the quiz/grading wiring, and
certificate generation all fit together correctly. backend/tests/test_e2e.py
is the counterpart that proves the same flow against a real Gemma backend,
gated behind ARDHAM_RUN_LIVE_TESTS=1.
"""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

SAMPLES_DIR = Path(__file__).parent.parent.parent / "samples"


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("ARDHAM_BACKEND", "stub")

    import storage

    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "DB_PATH", tmp_path / "ardham.db")
    storage.init_db()  # TestClient() without `with` doesn't run the app's startup event
    import main

    return TestClient(main.app)


def test_full_flow_scan_to_certificate(client):
    image_path = SAMPLES_DIR / "microfinance_group_loan_card.png"

    with image_path.open("rb") as f:
        resp = client.post(
            "/extract",
            data={"loan_type": "microfinance-group-loan"},
            files={"image": ("loan_card.png", f, "image/png")},
        )
    assert resp.status_code == 200, resp.text
    extract_data = resp.json()
    session_id = extract_data["session_id"]
    terms = extract_data["terms"]
    assert terms["instalment_amount"]["value"] == 690
    assert extract_data["consistency_warnings"] == []  # sample card's numbers are self-consistent
    assert extract_data["latency"]["extract_s"] >= 0

    resp = client.post(f"/sessions/{session_id}/confirm", json={"terms": terms})
    assert resp.status_code == 200

    resp = client.get(f"/sessions/{session_id}/terms")
    assert resp.status_code == 200
    assert resp.json()["terms"]["loan_amount"]["value"] == 30000

    resp = client.get(f"/sessions/{session_id}/explain")
    assert resp.status_code == 200
    explain_data = resp.json()
    sentences = explain_data["sentences"]
    assert len(sentences) == 8  # every EXPLAIN_FIELD_ORDER field has a numeric value
    assert explain_data["dropped"] == []  # the guard must accept every stub sentence
    assert all(s["field_id"] in terms for s in sentences)

    # Targeted re-explanation of a subset
    resp = client.get(f"/sessions/{session_id}/explain?field_ids=penalty,total_payable")
    assert resp.status_code == 200
    only_sentences = resp.json()["sentences"]
    assert {s["field_id"] for s in only_sentences} == {"penalty", "total_payable"}

    resp = client.get(f"/sessions/{session_id}/quiz")
    assert resp.status_code == 200
    questions = resp.json()["questions"]
    assert len(questions) > 0

    # Answer the first correctly (typed, deterministic grading), rest wrong
    resp = client.post(
        f"/sessions/{session_id}/answer",
        data={"field_id": questions[0]["field_id"], "typed_answer": str(terms[questions[0]["field_id"]]["value"])},
    )
    assert resp.status_code == 200
    assert resp.json()["correct"] is True

    for q in questions[1:]:
        resp = client.post(
            f"/sessions/{session_id}/answer",
            data={"field_id": q["field_id"], "typed_answer": "1"},
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is False

    # Audio path: send the real espeak-ng Telugu fixture, StubGemma's canned
    # transcription matches what that file actually says ("690 rupees").
    answer_audio = SAMPLES_DIR / "sample_telugu_answer_correct.wav"
    if answer_audio.exists():
        with answer_audio.open("rb") as f:
            resp = client.post(
                f"/sessions/{session_id}/answer",
                data={"field_id": "instalment_amount"},
                files={"audio": ("answer.wav", f, "audio/wav")},
            )
        assert resp.status_code == 200
        assert resp.json()["correct"] is True

    resp = client.get(f"/sessions/{session_id}/certificate")
    assert resp.status_code == 200
    cert = resp.json()
    assert cert["session_id"] == session_id
    assert cert["sha256"]
    assert 0 <= cert["score"] <= 100

    resp = client.get(f"/sessions/{session_id}/certificate.html")
    assert resp.status_code == 200
    assert "Comprehension Certificate" in resp.text


def test_gold_loan_flow_stub(client):
    image_path = SAMPLES_DIR / "gold_loan_card.png"
    with image_path.open("rb") as f:
        resp = client.post(
            "/extract",
            data={"loan_type": "gold-loan"},
            files={"image": ("gold_loan_card.png", f, "image/png")},
        )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["terms"]["loan_amount"]["value"] == 50000
    assert data["consistency_warnings"] == []


def test_individual_loan_flow_stub(client):
    image_path = SAMPLES_DIR / "individual_personal_loan_card.png"
    with image_path.open("rb") as f:
        resp = client.post(
            "/extract",
            data={"loan_type": "individual-personal-loan"},
            files={"image": ("individual_personal_loan_card.png", f, "image/png")},
        )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["terms"]["loan_amount"]["value"] == 60000
    assert data["consistency_warnings"] == []


def test_model_unavailable_shape_for_real_backends(monkeypatch, tmp_path):
    """Switching back to a real backend with nothing actually running must still
    produce the structured 503 the frontend's error banner depends on."""
    monkeypatch.setenv("ARDHAM_BACKEND", "local")
    monkeypatch.setenv("ARDHAM_STRICT_CLIENT", "1")
    monkeypatch.setenv("OLLAMA_URL", "http://localhost:1")  # nothing listens here

    import storage

    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "DB_PATH", tmp_path / "ardham.db")
    storage.init_db()
    import main

    test_client = TestClient(main.app)
    image_path = SAMPLES_DIR / "microfinance_group_loan_card.png"
    with image_path.open("rb") as f:
        resp = test_client.post(
            "/extract",
            data={"loan_type": "microfinance-group-loan"},
            files={"image": ("loan_card.png", f, "image/png")},
        )
    assert resp.status_code == 503
    detail = resp.json()["detail"]
    assert detail["error"] == "model_unavailable"
    assert detail["backend"] == "local"


def test_tts_endpoint(client):
    """Verifies that the /api/tts endpoint responds with audio/mpeg or 503 if edge_tts network is restricted."""
    resp = client.get("/api/tts", params={"text": "నమస్కారం", "lang": "te"})
    # Either succeeds with 200 and mp3 or 503 if network down in sandbox
    assert resp.status_code in (200, 503)
    if resp.status_code == 200:
        assert resp.headers["content-type"] == "audio/mpeg"
        assert len(resp.content) > 0

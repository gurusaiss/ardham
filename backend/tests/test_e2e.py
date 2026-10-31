"""Golden end-to-end test: the full scan -> review -> explain -> quiz -> certificate
flow against the sample loan card and sample Telugu audio, through the real FastAPI
app. Needs a live Gemma backend, so it's skipped unless ARDHAM_RUN_LIVE_TESTS=1.
"""
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

SAMPLES_DIR = Path(__file__).parent.parent.parent / "samples"

pytestmark = pytest.mark.skipif(
    os.environ.get("ARDHAM_RUN_LIVE_TESTS") != "1",
    reason="needs a live Gemma backend; set ARDHAM_RUN_LIVE_TESTS=1 and ARDHAM_BACKEND",
)


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Isolate this test's SQLite/session data from any real demo data.
    import storage

    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "DB_PATH", tmp_path / "ardham.db")
    storage.init_db()  # TestClient() without `with` doesn't run the app's startup event
    import main

    return TestClient(main.app)


def test_full_flow_scan_to_certificate(client):
    image_path = SAMPLES_DIR / "microfinance_group_loan_card.png"

    # 1. Scan
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

    # 2. Review / confirm (officer accepts as-is)
    resp = client.post(f"/sessions/{session_id}/confirm", json={"terms": terms})
    assert resp.status_code == 200

    # 3. Explain
    resp = client.get(f"/sessions/{session_id}/explain")
    assert resp.status_code == 200
    sentences = resp.json()["sentences"]
    assert len(sentences) > 0
    assert all(s["field_id"] in terms for s in sentences)

    # 4. Quiz
    resp = client.get(f"/sessions/{session_id}/quiz")
    assert resp.status_code == 200
    questions = resp.json()["questions"]
    assert len(questions) > 0

    # 5. Answer with a real Telugu audio fixture (espeak-ng synthesized "690 rupees")
    answer_audio = SAMPLES_DIR / "sample_telugu_answer_correct.wav"
    field_id = questions[0]["field_id"]
    with answer_audio.open("rb") as f:
        resp = client.post(
            f"/sessions/{session_id}/answer",
            data={"field_id": field_id},
            files={"audio": ("answer.wav", f, "audio/wav")},
        )
    assert resp.status_code == 200, resp.text

    # Also answer the rest with a typed wrong answer to exercise the re-explain path
    for q in questions[1:]:
        resp = client.post(
            f"/sessions/{session_id}/answer",
            data={"field_id": q["field_id"], "typed_answer": "1"},
        )
        assert resp.status_code == 200

    # 6. Certificate
    resp = client.get(f"/sessions/{session_id}/certificate")
    assert resp.status_code == 200
    cert = resp.json()
    assert cert["session_id"] == session_id
    assert len(cert["results"]) == len(questions)
    assert cert["sha256"]

    # Certificate HTML renders without error
    resp = client.get(f"/sessions/{session_id}/certificate.html")
    assert resp.status_code == 200
    assert "Comprehension Certificate" in resp.text

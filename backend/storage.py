"""Local SQLite for session state + /data/sessions/<id>/ for images and audio.

Kept deliberately simple: one table, JSON blobs for the nested structures. This
is a one-day hackathon backend, not a system that needs migrations.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path

from schemas import GradeResult, LoanTerms, Question

DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DATA_DIR / "ardham.db"


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                loan_type TEXT NOT NULL,
                terms_json TEXT,
                questions_json TEXT,
                results_json TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def session_dir(session_id: str) -> Path:
    d = DATA_DIR / "sessions" / session_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def create_session(loan_type: str) -> str:
    session_id = str(uuid.uuid4())
    with _connect() as conn:
        conn.execute(
            "INSERT INTO sessions (id, loan_type, created_at) VALUES (?, ?, datetime('now'))",
            (session_id, loan_type),
        )
    session_dir(session_id)
    return session_id


def save_terms(session_id: str, terms: LoanTerms) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE sessions SET terms_json = ? WHERE id = ?",
            (json.dumps({k: v.model_dump() for k, v in terms.items()}), session_id),
        )


def save_questions(session_id: str, questions: list[Question]) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE sessions SET questions_json = ? WHERE id = ?",
            (json.dumps([q.model_dump() for q in questions]), session_id),
        )


def append_result(session_id: str, result: GradeResult) -> list[GradeResult]:
    with _connect() as conn:
        row = conn.execute("SELECT results_json FROM sessions WHERE id = ?", (session_id,)).fetchone()
        existing = json.loads(row["results_json"]) if row and row["results_json"] else []
        existing.append(result.model_dump())
        conn.execute("UPDATE sessions SET results_json = ? WHERE id = ?", (json.dumps(existing), session_id))
        return [GradeResult(**r) for r in existing]


def get_session(session_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row is None:
            return None
        return {
            "id": row["id"],
            "loan_type": row["loan_type"],
            "terms": {k: v for k, v in json.loads(row["terms_json"]).items()} if row["terms_json"] else {},
            "questions": json.loads(row["questions_json"]) if row["questions_json"] else [],
            "results": json.loads(row["results_json"]) if row["results_json"] else [],
            "created_at": row["created_at"],
        }

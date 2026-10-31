"""Build the final comprehension certificate: JSON + SHA-256 hash of the record."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from schemas import Certificate, GradeResult, LoanTerms, Question


def build_certificate(
    session_id: str,
    loan_type: str,
    terms: LoanTerms,
    questions: list[Question],
    results: list[GradeResult],
) -> Certificate:
    score = round(100 * sum(1 for r in results if r.correct) / len(results)) if results else 0
    created_at = datetime.now(timezone.utc).isoformat()

    payload = {
        "session_id": session_id,
        "loan_type": loan_type,
        "terms": {k: v.model_dump() for k, v in terms.items()},
        "questions": [q.model_dump() for q in questions],
        "results": [r.model_dump() for r in results],
        "score": score,
        "created_at": created_at,
    }
    sha256 = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

    return Certificate(**payload, sha256=sha256)


def render_html(cert: Certificate) -> str:
    rows = "".join(
        f"<tr><td>{r.field_id}</td><td>{'✅' if r.correct else '❌'}</td><td>{r.heard}</td></tr>"
        for r in cert.results
    )
    return f"""<!DOCTYPE html>
<html lang="te"><head><meta charset="UTF-8"><title>Ardham Certificate — {cert.session_id}</title>
<style>
  body {{ font-family: sans-serif; max-width: 600px; margin: 40px auto; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
  td, th {{ border: 1px solid #ccc; padding: 6px 10px; text-align: left; }}
  .score {{ font-size: 2em; font-weight: bold; }}
  .hash {{ font-family: monospace; font-size: 0.8em; color: #666; word-break: break-all; }}
  .disclaimer {{ font-size: 0.8em; color: #888; margin-top: 20px; }}
</style></head>
<body>
  <h1>Ardham — Comprehension Certificate</h1>
  <p>Loan type: {cert.loan_type} &middot; Session: {cert.session_id}</p>
  <p>Date: {cert.created_at}</p>
  <div class="score">{cert.score}%</div>
  <table><thead><tr><th>Field</th><th>Result</th><th>Heard</th></tr></thead><tbody>{rows}</tbody></table>
  <p class="hash">SHA-256: {cert.sha256}</p>
  <p class="disclaimer">
    This record assists the field officer and is not legal or financial advice.
    Sample data shown is fictional.
  </p>
</body></html>"""

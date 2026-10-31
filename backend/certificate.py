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
        f"<tr><td><strong>{r.field_id.replace('_', ' ').title()}</strong></td>"
        f"<td style='text-align:center;'>{'<span style=\"color:#16a34a; font-weight:bold;\">✓ PASS</span>' if r.correct else '<span style=\"color:#dc2626; font-weight:bold;\">✗ RE-EXPLAINED</span>'}</td>"
        f"<td>{r.heard or '—'}</td></tr>"
        for r in cert.results
    )
    borrower = cert.terms.get("borrower_name")
    borrower_name = borrower.value if borrower and borrower.value else "Borrower"
    lender = cert.terms.get("lender")
    lender_name = lender.value if lender and lender.value else "Lender"
    loan_amt = cert.terms.get("loan_amount")
    loan_val = f"₹{loan_amt.value:g}" if loan_amt and isinstance(loan_amt.value, (int, float)) else "—"

    return f"""<!DOCTYPE html>
<html lang="te">
<head>
<meta charset="UTF-8">
<title>Ardham Certificate — {cert.session_id}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 680px; margin: 30px auto; padding: 24px; color: #1e293b; background: #fff; }}
  .header {{ border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }}
  .badge {{ display: inline-block; padding: 4px 10px; background: #0f172a; color: white; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }}
  h1 {{ margin: 10px 0 4px; font-size: 24px; }}
  .subtitle {{ color: #64748b; font-size: 13px; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }}
  .meta-item span {{ color: #64748b; display: block; font-size: 11px; text-transform: uppercase; }}
  .score-box {{ margin: 20px 0; padding: 16px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: space-between; }}
  .score-num {{ font-size: 32px; font-weight: bold; color: #15803d; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }}
  td, th {{ border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }}
  th {{ background: #f1f5f9; font-weight: 600; }}
  .hash {{ font-family: monospace; font-size: 11px; color: #64748b; background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; word-break: break-all; margin-top: 24px; }}
  .disclaimer {{ font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; line-height: 1.5; }}
  .print-btn {{ display: inline-block; margin-bottom: 16px; padding: 8px 16px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; cursor: pointer; border: none; }}
  @media print {{
    .print-btn {{ display: none; }}
    body {{ margin: 0; padding: 0; }}
  }}
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <div class="header">
    <span class="badge">RBI KFS Pre-Execution Verification</span>
    <h1>Ardham (అర్థం) &mdash; Comprehension Certificate</h1>
    <div class="subtitle">Borrower Pre-Signing Loan Understanding Audit Record</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><span>Borrower</span><strong>{borrower_name}</strong></div>
    <div class="meta-item"><span>Lender</span><strong>{lender_name}</strong></div>
    <div class="meta-item"><span>Loan Product</span><strong>{cert.loan_type}</strong></div>
    <div class="meta-item"><span>Sanctioned Amount</span><strong>{loan_val}</strong></div>
    <div class="meta-item"><span>Session ID</span><strong style="font-family:monospace; font-size:12px;">{cert.session_id}</strong></div>
    <div class="meta-item"><span>Audit Timestamp (UTC)</span><strong>{cert.created_at}</strong></div>
  </div>

  <div class="score-box">
    <div>
      <div style="font-size:12px; text-transform:uppercase; color:#15803d; font-weight:bold;">Comprehension Score</div>
      <div style="font-size:12px; color:#166534;">Verified through spoken/interactive question loop in Telugu</div>
    </div>
    <div class="score-num">{cert.score}%</div>
  </div>

  <h3 style="font-size:15px; margin: 20px 0 8px;">Question & Answer Verification Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Key Loan Term</th>
        <th style="width:110px; text-align:center;">Result</th>
        <th>Recorded / Transcribed Response</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>

  <div class="hash">
    <strong>SHA-256 Tamper-Evident Hash:</strong><br>{cert.sha256}
  </div>

  <div class="disclaimer">
    <strong>Regulatory & Compliance Notice:</strong> Ardham assists the field officer in verifying borrower comprehension as per RBI Key Fact Statement guidelines and MFI Fair Practices Code. It does not replace underwriting or legal loan contract documentation. Sample data shown is generated for demonstration and testing purposes.
  </div>
</body>
</html>"""

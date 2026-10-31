import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { getCertificate, getCertificateHtmlUrl, type Certificate as CertType } from '../lib/api'

export default function Certificate() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [cert, setCert] = useState<CertType | null>(null)

  useEffect(() => {
    if (!sessionId) return
    getCertificate(sessionId).then(setCert)
  }, [sessionId])

  return (
    <StepLayout title="Comprehension certificate" teluguTitle="ధృవీకరణ పత్రం">
      {cert ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Borrower / Product</span>
              <span className="font-semibold text-slate-900">{cert.loan_type}</span>
            </div>
            <div className="mt-2 flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Comprehension Score</span>
              <span className={`text-base font-bold ${cert.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {cert.score}% {cert.score >= 70 ? '✓ PASS' : '⚠ CONDITIONAL'}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-700">Verification Date</span>
              <span className="text-slate-500">{new Date(cert.created_at).toLocaleString()}</span>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Questions Checked ({cert.results.length})
              </div>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                {cert.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <span className="font-medium text-slate-700 capitalize">
                      {r.field_id.replace('_', ' ')}
                    </span>
                    <span className={r.correct ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>
                      {r.correct ? '✓ Understood' : '↻ Re-explained'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 break-all rounded bg-slate-100 p-2 font-mono text-xs text-slate-600">
              <span className="font-semibold text-slate-800">SHA-256 Audit Seal:</span> {cert.sha256}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              This record assists the field officer and proves compliance with RBI Key Fact Statement regulations.
              Sample data shown is fictional.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              🖨️ Print Certificate
            </button>
            <a
              href={getCertificateHtmlUrl(cert.session_id)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              📄 Printable HTML
            </a>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">Loading certificate...</p>
      )}

      <Link
        to="/"
        className="mt-4 block w-full rounded-xl bg-slate-900 py-4 text-center text-lg font-medium text-white shadow hover:bg-slate-800"
      >
        Start New Loan Verification
      </Link>
    </StepLayout>
  )
}

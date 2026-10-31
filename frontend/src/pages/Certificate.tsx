import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { getCertificate, type Certificate as CertType } from '../lib/api'

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
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Session</span>
            <span className="text-slate-500">{cert.session_id}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="font-medium">Score</span>
            <span>{cert.score}%</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="font-medium">Date</span>
            <span className="text-slate-500">{new Date(cert.created_at).toLocaleString()}</span>
          </div>
          <div className="mt-3 break-all rounded bg-slate-50 p-2 font-mono text-xs text-slate-400">
            SHA-256: {cert.sha256}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            This record assists the field officer and is not legal or financial advice. Sample
            data shown is fictional.
          </p>
        </div>
      ) : (
        <p className="text-slate-500">Loading certificate...</p>
      )}

      <Link
        to="/"
        className="mt-6 block w-full rounded-xl bg-slate-900 py-4 text-center text-lg font-medium text-white"
      >
        New session
      </Link>
    </StepLayout>
  )
}

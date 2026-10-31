import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { confirmTerms, type LoanTerms } from '../lib/api'

export default function Review() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { terms: LoanTerms; consistencyWarnings?: string[] } | null
  const [terms] = useState<LoanTerms>(state?.terms ?? {})
  const consistencyWarnings = state?.consistencyWarnings ?? []
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const lowConfidence = Object.entries(terms).filter(([, f]) => f.confidence < 0.7)

  async function onConfirm() {
    if (!sessionId) return
    setConfirming(true)
    setError(null)
    try {
      await confirmTerms(sessionId, terms)
      navigate(`/explain/${sessionId}`)
    } catch (e) {
      setError(e)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <StepLayout title="Confirm the terms" teluguTitle="వివరాలను నిర్ధారించండి">
      {consistencyWarnings.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">The guard flagged {consistencyWarnings.length} inconsistency(ies):</p>
          <ul className="mt-1 list-inside list-disc">
            {consistencyWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {lowConfidence.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {lowConfidence.length} field(s) had low confidence — double check them against the
          photo before continuing.
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {Object.entries(terms).map(([fieldId, field]) => (
          <li key={fieldId} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-slate-700">
                {fieldId.replace(/_/g, ' ')}
              </span>
              {field.confidence < 0.7 && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  check this
                </span>
              )}
            </div>
            <div className="text-lg">{String(field.value)}</div>
            <div className="mt-1 text-xs text-slate-400">source: "{field.source_text}"</div>
          </li>
        ))}
      </ul>

      {error ? <div className="mt-4"><ErrorBanner error={error} onRetry={onConfirm} /></div> : null}

      <button
        disabled={confirming || Object.keys(terms).length === 0}
        onClick={onConfirm}
        className="mt-6 w-full rounded-xl bg-slate-900 py-4 text-lg font-medium text-white disabled:opacity-50"
      >
        {confirming ? 'Confirming...' : 'Looks correct — continue'}
      </button>
    </StepLayout>
  )
}

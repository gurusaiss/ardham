import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getCertificate, type GradeResult } from '../lib/api'

export default function Result() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const stateResults = (location.state as { results: GradeResult[] } | null)?.results ?? null

  const [results, setResults] = useState<GradeResult[] | null>(stateResults)
  const [error, setError] = useState<unknown>(null)

  function load() {
    if (!sessionId) return
    setError(null)
    getCertificate(sessionId)
      .then((cert) => setResults(cert.results))
      .catch(setError)
  }

  useEffect(() => {
    if (stateResults === null) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (error) {
    return (
      <StepLayout title="Result" teluguTitle="ఫలితం">
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  if (results === null) {
    return (
      <StepLayout title="Result" teluguTitle="ఫలితం">
        <p className="text-slate-500">Loading result...</p>
      </StepLayout>
    )
  }

  const wrong = results.filter((r) => !r.correct)
  const score = results.length ? Math.round((100 * (results.length - wrong.length)) / results.length) : 0

  return (
    <StepLayout title="Result" teluguTitle="ఫలితం">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="text-4xl font-bold">{score}%</div>
        <div className="text-sm text-slate-500">understanding score</div>
      </div>

      {wrong.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {wrong.length} answer(s) need re-explaining:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
            {wrong.map((r) => (
              <li key={r.field_id}>{r.field_id.replace(/_/g, ' ')}</li>
            ))}
          </ul>
          <button
            onClick={() =>
              sessionId &&
              navigate(`/explain/${sessionId}?only=${wrong.map((r) => r.field_id).join(',')}`)
            }
            className="mt-3 w-full rounded-lg bg-amber-600 py-3 font-medium text-white"
          >
            Re-explain missed parts
          </button>
        </div>
      )}

      <button
        onClick={() => sessionId && navigate(`/certificate/${sessionId}`)}
        className="mt-6 w-full rounded-xl bg-slate-900 py-4 text-lg font-medium text-white"
      >
        View comprehension certificate
      </button>
    </StepLayout>
  )
}

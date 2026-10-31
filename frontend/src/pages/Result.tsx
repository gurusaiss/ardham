import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getCertificate, type GradeResult } from '../lib/api'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking } from '../lib/speech'

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
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const wrong = results?.filter((r) => !r.correct) ?? []
  const score =
    results && results.length
      ? Math.round((100 * (results.length - wrong.length)) / results.length)
      : 0

  useEffect(() => {
    if (results && isVoiceAssistantEnabled()) {
      if (wrong.length === 0) {
        speakTelugu(`అభినందనలు! రుణ అవగాహన స్కోర్ ${score} శాతం. అన్ని నిబంధనలు విజయవంతంగా ధృవీకరించబడ్డాయి.`)
      } else {
        speakTelugu(`రుణ అవగాహన స్కోర్ ${score} శాతం. ${wrong.length} అంశాలలో స్పష్టత అవసరం.`)
      }
    }
  }, [results])

  if (error) {
    return (
      <StepLayout title="Result" teluguTitle="అవగాహన ఫలితం">
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  if (results === null) {
    return (
      <StepLayout title="Result" teluguTitle="అవగాహన ఫలితం">
        <p className="text-slate-500">Loading result...</p>
      </StepLayout>
    )
  }

  return (
    <StepLayout title="Understanding Result" teluguTitle="రుణ అవగాహన ఫలితం">
      <div className="rounded-2xl border-2 border-emerald-100 bg-white p-6 text-center shadow-sm">
        <div className="text-5xl font-extrabold text-slate-900">{score}%</div>
        <div className="mt-1 text-sm font-semibold text-emerald-800">
          అవగాహన స్కోర్ (Understanding Score)
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {wrong.length === 0
            ? '✓ రుణగ్రహీత అన్ని నిబంధనలను స్పష్టంగా అర్థం చేసుకున్నారు'
            : 'కొన్ని అంశాలలో మరింత అవగాహన అవసరం'}
        </p>
      </div>

      {wrong.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            {wrong.length} సమాధానాలలో స్పష్టత లోపించింది:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-800 font-medium">
            {wrong.map((r) => (
              <li key={r.field_id}>{r.field_id.replace(/_/g, ' ')}</li>
            ))}
          </ul>
          <button
            onClick={() => {
              stopSpeaking()
              sessionId &&
                navigate(`/explain/${sessionId}?only=${wrong.map((r) => r.field_id).join(',')}`)
            }}
            className="mt-3 w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow hover:bg-amber-700 active:scale-95 transition"
          >
            ఈ అంశాలను మళ్లీ వివరించండి (Re-explain)
          </button>
        </div>
      )}

      <button
        onClick={() => {
          stopSpeaking()
          sessionId && navigate(`/certificate/${sessionId}`)
        }}
        className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
      >
        సర్టిఫికెట్ చూడండి (Comprehension Certificate) →
      </button>
    </StepLayout>
  )
}

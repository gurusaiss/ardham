import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getExplanation, getTerms, type LoanTerms } from '../lib/api'

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const teVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('te'))
  if (teVoice) utterance.voice = teVoice
  utterance.lang = teVoice ? 'te-IN' : 'hi-IN'
  speechSynthesis.speak(utterance)
}

export default function Explain() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const onlyFieldIds = searchParams.get('only')?.split(',').filter(Boolean) ?? null
  const isReExplain = onlyFieldIds !== null && onlyFieldIds.length > 0

  const [terms, setTerms] = useState<LoanTerms>({})
  const [sentences, setSentences] = useState<{ field_id: string; text_te: string }[]>([])
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    Promise.all([getTerms(sessionId), getExplanation(sessionId, onlyFieldIds ?? undefined)])
      .then(([termsRes, explainRes]) => {
        setTerms(termsRes.terms)
        setSentences(explainRes.sentences)
        setIndex(0)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [sessionId])

  const current = sentences[index]
  const sourceField = current ? terms[current.field_id] : undefined

  useEffect(() => {
    if (current?.text_te) {
      speak(current.text_te)
    }
  }, [current])

  if (error) {
    return (
      <StepLayout title="Explanation" teluguTitle="వివరణ">
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  return (
    <StepLayout
      title={isReExplain ? 'Re-explaining missed parts' : 'Explanation'}
      teluguTitle="వివరణ"
    >
      {loading ? (
        <p className="text-slate-500">Loading explanation...</p>
      ) : current ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-lg leading-relaxed">{current.text_te}</p>

          {sourceField && (
            <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                source line on the card
              </div>
              <div className="mt-1 text-sm text-amber-900">"{sourceField.source_text}"</div>
              <div className="mt-1 text-xs text-amber-600">value: {String(sourceField.value)}</div>
            </div>
          )}

          <button
            onClick={() => speak(current.text_te)}
            className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
          >
            🔊 Play again
          </button>
        </div>
      ) : (
        <p className="text-slate-500">No explanation sentences to show.</p>
      )}

      {!loading && sentences.length > 0 && (
        <div className="mt-6 flex gap-3">
          <button
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="flex-1 rounded-xl border border-slate-300 py-3 disabled:opacity-40"
          >
            Back
          </button>
          {index < sentences.length - 1 ? (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
            >
              Next
            </button>
          ) : isReExplain ? (
            <button
              onClick={() => sessionId && navigate(`/result/${sessionId}`)}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
            >
              Back to results
            </button>
          ) : (
            <button
              onClick={() => sessionId && navigate(`/quiz/${sessionId}`)}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-white"
            >
              Start questions
            </button>
          )}
        </div>
      )}
    </StepLayout>
  )
}

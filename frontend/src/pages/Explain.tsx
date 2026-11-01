import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getExplanation, getTerms, type LoanTerms } from '../lib/api'
import {
  speakTelugu,
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
} from '../lib/speech'

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
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    const unsub = subscribeSpeaking(setSpeaking)
    return () => {
      unsub()
      stopSpeaking()
    }
  }, [])

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
    if (current?.text_te && isVoiceAssistantEnabled()) {
      speakTelugu(current.text_te)
    }
  }, [current])

  function toggleAudio() {
    if (speaking) {
      stopSpeaking()
    } else if (current?.text_te) {
      speakTelugu(current.text_te)
    }
  }

  if (error) {
    return (
      <StepLayout title="Explanation" teluguTitle="రుణ వివరాలు">
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  return (
    <StepLayout
      title={isReExplain ? 'Re-explaining missed parts' : 'Loan Terms Explanation'}
      teluguTitle="రుణ వివరాలు — స్వచ్ఛమైన తెలుగులో"
    >
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-slate-500">తెలుగు వివరణ సిద్ధమవుతోంది...</p>
        </div>
      ) : current ? (
        <div className="rounded-2xl border-2 border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>అంశం {index + 1} / {sentences.length}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              {current.field_id.replace('_', ' ')}
            </span>
          </div>

          <p className="mt-4 text-xl font-medium text-slate-900 leading-relaxed">
            {current.text_te}
          </p>

          {sourceField && (
            <div className="mt-5 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                కార్డుపై ముద్రించబడిన అసలు పంక్తి (Source text)
              </div>
              <div className="mt-1 text-sm font-medium text-amber-950 font-mono">
                "{sourceField.source_text}"
              </div>
              <div className="mt-1 text-xs text-amber-700">
                ధృవీకరించబడిన విలువ: <strong className="text-amber-900">{String(sourceField.value)}</strong>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={toggleAudio}
              className={`flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
                speaking
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {speaking ? (
                <>
                  <div className="flex items-center gap-0.5 text-white h-3">
                    <span className="sound-bar h-2"></span>
                    <span className="sound-bar h-3"></span>
                    <span className="sound-bar h-1"></span>
                    <span className="sound-bar h-2.5"></span>
                  </div>
                  <span>⏹️ ఆడియో ఆపు (Stop Audio)</span>
                </>
              ) : (
                <span>🔊 వినండి (Listen in Pure Telugu)</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">No explanation sentences to show.</p>
      )}

      {!loading && sentences.length > 0 && (
        <div className="mt-6 flex gap-3">
          <button
            disabled={index === 0}
            onClick={() => {
              stopSpeaking()
              setIndex((i) => i - 1)
            }}
            className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 active:scale-95"
          >
            ← వెనుకకు (Back)
          </button>

          {index < sentences.length - 1 ? (
            <button
              onClick={() => {
                stopSpeaking()
                setIndex((i) => i + 1)
              }}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 active:scale-95"
            >
              తర్వాత అంశం (Next) →
            </button>
          ) : isReExplain ? (
            <button
              onClick={() => {
                stopSpeaking()
                sessionId && navigate(`/result/${sessionId}`)
              }}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 active:scale-95"
            >
              ఫలితాలు చూడండి (Results)
            </button>
          ) : (
            <button
              onClick={() => {
                stopSpeaking()
                sessionId && navigate(`/quiz/${sessionId}`)
              }}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-95"
            >
              ప్రశ్నలు ప్రారంభించండి (Start Quiz) →
            </button>
          )}
        </div>
      )}
    </StepLayout>
  )
}

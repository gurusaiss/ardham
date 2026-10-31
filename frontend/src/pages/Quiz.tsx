import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getQuiz, getTerms, submitAnswer, type GradeResult, type LoanTerms, type Question } from '../lib/api'

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const teVoice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('te'))
  if (teVoice) utterance.voice = teVoice
  utterance.lang = teVoice ? 'te-IN' : 'hi-IN'
  speechSynthesis.speak(utterance)
}

function getQuickOptions(fieldId: string, terms: LoanTerms): { label: string; value: string }[] {
  const field = terms[fieldId]
  const val = field?.value

  if (typeof val === 'number') {
    const wrongVal = Math.round(val > 50 ? val * 1.3 : val + 10)
    return [
      { label: `₹${val.toLocaleString('en-IN')}`, value: String(val) },
      { label: `₹${wrongVal.toLocaleString('en-IN')}`, value: String(wrongVal) },
      { label: 'తెలీదు (Don’t know)', value: 'తెలీదు' },
    ]
  }

  if (fieldId === 'penalty') {
    return [
      { label: 'బంగారం వేలం వేస్తారు (Gold auctioned)', value: 'బంగారం అమ్మేస్తారు' },
      { label: 'ఏమీ కాదు (No consequence)', value: 'ఏమీ కాదు' },
      { label: 'తెలీదు (Don’t know)', value: 'తెలీదు' },
    ]
  }

  if (typeof val === 'string' && val.length > 0) {
    return [
      { label: val, value: val },
      { label: 'తెలీదు (Don’t know)', value: 'తెలీదు' },
    ]
  }

  return [
    { label: 'అవును (Yes)', value: 'అవును' },
    { label: 'కాదు (No)', value: 'కాదు' },
    { label: 'తెలీదు (Don’t know)', value: 'తెలీదు' },
  ]
}

export default function Quiz() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [terms, setTerms] = useState<LoanTerms>({})
  const [index, setIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<GradeResult[]>([])
  const [error, setError] = useState<unknown>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const pendingAnswer = useRef<{ audio: Blob | null; typed: string | null } | null>(null)

  function loadQuiz() {
    if (!sessionId) return
    setLoadError(null)
    Promise.all([getQuiz(sessionId), getTerms(sessionId)])
      .then(([quizRes, termsRes]) => {
        setQuestions(quizRes.questions)
        setTerms(termsRes.terms)
      })
      .catch(setLoadError)
  }

  useEffect(loadQuiz, [sessionId])

  const current = questions[index]

  // Speak question automatically when question changes
  useEffect(() => {
    if (current?.prompt_te) {
      speak(current.prompt_te)
    }
  }, [current])

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks.current = []
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = (e) => chunks.current.push(e.data)
    rec.onstop = () => onAnswer(new Blob(chunks.current, { type: 'audio/webm' }), null)
    rec.start()
    mediaRecorder.current = rec
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  async function onAnswer(audio: Blob | null, typed: string | null) {
    if (!sessionId || !current) return
    pendingAnswer.current = { audio, typed }
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitAnswer(sessionId, current.field_id, audio, typed)
      const nextResults = [...results, result]
      setResults(nextResults)
      if (index < questions.length - 1) {
        setIndex((i) => i + 1)
      } else {
        navigate(`/result/${sessionId}`, { state: { results: nextResults } })
      }
    } catch (e) {
      setError(e)
    } finally {
      setSubmitting(false)
    }
  }

  function retryPending() {
    const pending = pendingAnswer.current
    if (pending) onAnswer(pending.audio, pending.typed)
  }

  if (loadError) {
    return (
      <StepLayout title="Questions" teluguTitle="ప్రశ్నలు">
        <ErrorBanner error={loadError} onRetry={loadQuiz} />
      </StepLayout>
    )
  }

  const options = current ? getQuickOptions(current.field_id, terms) : []

  return (
    <StepLayout title={`Question ${index + 1} of ${questions.length}`} teluguTitle="ప్రశ్న">
      {current ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-lg shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-slate-900">{current.prompt_te}</span>
              <button
                onClick={() => speak(current.prompt_te)}
                className="shrink-0 rounded-lg bg-slate-100 p-2 text-sm text-slate-700 hover:bg-slate-200"
                title="Listen in Telugu"
              >
                🔊 వినండి
              </button>
            </div>
            <div className="mt-2 text-sm text-slate-500">{current.prompt_en}</div>
          </div>

          {/* Option 1: Speak into microphone */}
          <button
            disabled={submitting}
            onClick={recording ? stopRecording : startRecording}
            className={`w-full rounded-xl py-4 text-base font-medium text-white shadow transition-colors disabled:opacity-50 ${
              recording ? 'bg-red-600 animate-pulse' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {submitting ? 'Grading answer...' : recording ? '⏹ Stop recording' : '🎤 Spoken Answer (Speak in Telugu)'}
          </button>

          {/* Option 2: Tap option buttons fallback */}
          {options.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Or Tap Option (సమాధానాన్ని ఎంచుకోండి):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={submitting}
                    onClick={() => onAnswer(null, opt.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3.5 text-left text-base font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option 3: Type manually */}
          <div className="mt-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Or Type Custom Answer:
            </div>
            <TypedAnswer disabled={submitting} onSubmit={(text) => onAnswer(null, text)} />
          </div>

          {error ? <ErrorBanner error={error} onRetry={retryPending} /> : null}
        </div>
      ) : (
        <p className="text-slate-500">Loading questions...</p>
      )}
    </StepLayout>
  )
}

function TypedAnswer({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:opacity-50"
        placeholder="Type number or answer in Telugu..."
      />
      <button
        disabled={disabled || !value.trim()}
        onClick={() => {
          if (value.trim()) {
            onSubmit(value.trim())
            setValue('')
          }
        }}
        className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getQuiz, getTerms, submitAnswer, type GradeResult, type LoanTerms, type Question } from '../lib/api'
import {
  speakTelugu,
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
} from '../lib/speech'

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
  const [speaking, setSpeaking] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const pendingAnswer = useRef<{ audio: Blob | null; typed: string | null } | null>(null)

  useEffect(() => {
    const unsub = subscribeSpeaking(setSpeaking)
    return () => {
      unsub()
      stopSpeaking()
    }
  }, [])

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadQuiz, [sessionId])

  const current = questions[index]

  // Speak question automatically when question changes if voice assistant is ON
  useEffect(() => {
    if (current?.prompt_te && isVoiceAssistantEnabled()) {
      speakTelugu(current.prompt_te)
    }
  }, [current])

  function toggleAudio() {
    if (speaking) {
      stopSpeaking()
    } else if (current?.prompt_te) {
      speakTelugu(current.prompt_te)
    }
  }

  async function startRecording() {
    stopSpeaking()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => chunks.current.push(e.data)
      rec.onstop = () => onAnswer(new Blob(chunks.current, { type: 'audio/webm' }), null)
      rec.start()
      mediaRecorder.current = rec
      setRecording(true)
    } catch {
      alert('మైక్రోఫోన్ అనుమతి ఇవ్వండి (Please allow microphone access)')
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  async function onAnswer(audio: Blob | null, typed: string | null) {
    if (!sessionId || !current) return
    stopSpeaking()
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
      <StepLayout title="Questions" teluguTitle="అవగాహన ప్రశ్నలు">
        <ErrorBanner error={loadError} onRetry={loadQuiz} />
      </StepLayout>
    )
  }

  const options = current ? getQuickOptions(current.field_id, terms) : []

  return (
    <StepLayout
      title={`Question ${index + 1} of ${questions.length}`}
      teluguTitle="అవగాహన ప్రశ్న"
    >
      {current ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border-2 border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xl font-bold text-slate-900 leading-snug">
                {current.prompt_te}
              </span>
              <button
                onClick={toggleAudio}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 ${
                  speaking
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
                title="వినండి లేదా ఆపండి"
              >
                {speaking ? (
                  <>
                    <div className="flex items-center gap-0.5 text-white h-2.5">
                      <span className="sound-bar h-1.5"></span>
                      <span className="sound-bar h-2.5"></span>
                      <span className="sound-bar h-1"></span>
                    </div>
                    <span>⏹️ ఆపు</span>
                  </>
                ) : (
                  <span>🔊 వినండి</span>
                )}
              </button>
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">
              {current.prompt_en}
            </div>
          </div>

          {/* Option 1: Speak into microphone */}
          <button
            disabled={submitting}
            onClick={recording ? stopRecording : startRecording}
            className={`w-full rounded-2xl py-4 text-base font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
              recording
                ? 'bg-red-600 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {submitting ? (
              <span>సమాధానం ధృవీకరిస్తున్నాం...</span>
            ) : recording ? (
              <span>⏹️ రికార్డింగ్ ఆపు (Stop recording)</span>
            ) : (
              <span>🎤 నోటితో సమాధానం చెప్పండి (Speak in Telugu)</span>
            )}
          </button>

          {/* Option 2: Tap option buttons fallback */}
          {options.length > 0 && (
            <div className="mt-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>లేదా ఒక సమాధానాన్ని నొక్కండి:</span>
                <span className="text-[11px] font-normal text-slate-400">One-touch Option</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={submitting}
                    onClick={() => onAnswer(null, opt.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3.5 text-left text-base font-bold text-slate-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50/50 disabled:opacity-50 active:scale-[0.99] transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option 3: Type manually */}
          <div className="mt-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              లేదా టైప్ చేయండి (Custom Answer):
            </div>
            <TypedAnswer disabled={submitting} onSubmit={(text) => onAnswer(null, text)} />
          </div>

          {error ? <ErrorBanner error={error} onRetry={retryPending} /> : null}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-sm">ప్రశ్నలు లోడ్ అవుతున్నాయి...</p>
        </div>
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
        className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        placeholder="రాయండి (ఉదా: 690 లేదా తెలీదు)..."
      />
      <button
        disabled={disabled || !value.trim()}
        onClick={() => {
          if (value.trim()) {
            onSubmit(value.trim())
            setValue('')
          }
        }}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 active:scale-95 transition"
      >
        Submit
      </button>
    </div>
  )
}

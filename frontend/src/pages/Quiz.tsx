import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getQuiz, submitAnswer, type GradeResult, type Question } from '../lib/api'

export default function Quiz() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
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
    getQuiz(sessionId)
      .then((r) => setQuestions(r.questions))
      .catch(setLoadError)
  }

  useEffect(loadQuiz, [sessionId])

  const current = questions[index]

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

  return (
    <StepLayout title={`Question ${index + 1} of ${questions.length}`} teluguTitle="ప్రశ్న">
      {current ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-lg">
            {current.prompt_te}
            <div className="mt-1 text-sm text-slate-400">{current.prompt_en}</div>
          </div>

          <button
            disabled={submitting}
            onClick={recording ? stopRecording : startRecording}
            className={`w-full rounded-xl py-5 text-lg font-medium text-white disabled:opacity-50 ${
              recording ? 'bg-red-600' : 'bg-slate-900'
            }`}
          >
            {submitting ? 'Grading...' : recording ? '⏹ Stop recording' : '🎤 Record spoken answer'}
          </button>

          <div className="text-center text-sm text-slate-400">or type the answer</div>
          <TypedAnswer disabled={submitting} onSubmit={(text) => onAnswer(null, text)} />

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
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
        placeholder="Type answer in Telugu"
      />
      <button
        disabled={disabled}
        onClick={() => value && onSubmit(value)}
        className="rounded-lg bg-slate-200 px-4 py-2 font-medium disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getQuiz, getTerms, submitAnswer, type GradeResult, type LoanTerms, type Question } from '../lib/api'
import {
  speakText,
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'

function getQuickOptions(fieldId: string, terms: LoanTerms, lang: AppLanguage): { label: string; value: string }[] {
  const field = terms[fieldId]
  const val = field?.value

  const dontKnowLabel = lang === 'en' ? "Don't know" : lang === 'hi' ? 'पता नहीं' : 'తెలీదు'
  const yesLabel = lang === 'en' ? 'Yes' : lang === 'hi' ? 'हाँ' : 'అవును'
  const noLabel = lang === 'en' ? 'No' : lang === 'hi' ? 'नहीं' : 'కాదు'

  if (typeof val === 'number') {
    const wrongVal = Math.round(val > 50 ? val * 1.3 : val + 10)
    return [
      { label: `₹${val.toLocaleString('en-IN')}`, value: String(val) },
      { label: `₹${wrongVal.toLocaleString('en-IN')}`, value: String(wrongVal) },
      { label: dontKnowLabel, value: 'తెలీదు' },
    ]
  }

  if (fieldId === 'penalty') {
    const goldLabel = lang === 'en' ? 'Gold is auctioned' : lang === 'hi' ? 'सोना नीलाम हो जाएगा' : 'బంగారం వేలం వేస్తారు'
    const noneLabel = lang === 'en' ? 'No consequence' : lang === 'hi' ? 'कुछ नहीं होगा' : 'ఏమీ కాదు'
    return [
      { label: goldLabel, value: 'బంగారం అమ్మేస్తారు' },
      { label: noneLabel, value: 'ఏమీ కాదు' },
      { label: dontKnowLabel, value: 'తెలీదు' },
    ]
  }

  if (typeof val === 'string' && val.length > 0) {
    return [
      { label: val, value: val },
      { label: dontKnowLabel, value: 'తెలీదు' },
    ]
  }

  return [
    { label: yesLabel, value: 'అవును' },
    { label: noLabel, value: 'కాదు' },
    { label: dontKnowLabel, value: 'తెలీదు' },
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
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const pendingAnswer = useRef<{ audio: Blob | null; typed: string | null } | null>(null)

  useEffect(() => {
    const unsubSpeaking = subscribeSpeaking(setSpeaking)
    const unsubLang = subscribeLanguage(setLang)
    return () => {
      unsubSpeaking()
      unsubLang()
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

  function getQuestionText(q?: Question, targetLang: AppLanguage = lang): string {
    if (!q) return ''
    if (targetLang === 'en') return q.prompt_en || q.prompt_te
    if (targetLang === 'hi') return q.prompt_hi || q.prompt_en || q.prompt_te
    return q.prompt_te
  }

  // Speak question automatically when question changes if voice assistant is ON
  useEffect(() => {
    if (current && isVoiceAssistantEnabled()) {
      const text = getQuestionText(current, lang)
      speakText(text, lang)
    }
  }, [current, index, lang])

  function toggleAudio() {
    if (speaking) {
      stopSpeaking()
    } else if (current) {
      const text = getQuestionText(current, lang)
      speakText(text, lang)
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
      alert(lang === 'en' ? 'Please allow microphone access' : 'మైక్రోఫోన్ అనుమతి ఇవ్వండి')
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
      <StepLayout
        title={t('quiz_title', lang)}
        subtitle={{
          en: 'Comprehension verification questions',
          te: 'అవగాహన ప్రశ్నలు',
          hi: 'समझ सत्यापन प्रश्न',
        }}
      >
        <ErrorBanner error={loadError} onRetry={loadQuiz} />
      </StepLayout>
    )
  }

  const options = current ? getQuickOptions(current.field_id, terms, lang) : []
  const questionTitle = getQuestionText(current, lang)

  return (
    <StepLayout
      title={`${t('quiz_title', lang)} ${index + 1} of ${questions.length}`}
      subtitle={{
        en: 'Answer verbally into the mic or select a touch option below',
        te: 'అవగాహన ప్రశ్న — నోటితో సమాధానం చెప్పండి',
        hi: 'मौखिक रूप से उत्तर दें या नीचे एक विकल्प चुनें',
      }}
      maxWidthClass="max-w-6xl"
    >
      {current ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Question Card & Spoken Audio Control */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-3xl border-2 border-emerald-200/80 bg-white p-6 sm:p-7 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-100 pb-3 mb-4">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-bold">
                  {index + 1} / {questions.length}
                </span>
                <span className="font-mono text-slate-500 uppercase tracking-wider">
                  {current.field_id.replace(/_/g, ' ')}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {questionTitle}
              </h2>

              {/* Spoken Question Audio Button */}
              <button
                type="button"
                onClick={toggleAudio}
                className={`mt-6 w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 px-4 text-sm font-bold shadow-md transition-all active:scale-95 ${
                  speaking
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
              >
                {speaking ? (
                  <>
                    <div className="flex items-center gap-1 text-white h-3.5">
                      <span className="sound-bar h-2"></span>
                      <span className="sound-bar h-3.5"></span>
                      <span className="sound-bar h-1.5"></span>
                    </div>
                    <span>{t('stop_audio', lang)}</span>
                  </>
                ) : (
                  <>
                    <span>🔊</span>
                    <span>
                      {lang === 'en'
                        ? 'Hear Question Spoken Aloud'
                        : lang === 'hi'
                        ? 'प्रश्न को बोलकर सुनें'
                        : 'ప్రశ్నను మాటల్లో వినండి'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Audio Mic, Quick-touch Options & Type Input */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Option 1: Speak into microphone */}
            <button
              disabled={submitting}
              onClick={recording ? stopRecording : startRecording}
              className={`w-full rounded-2xl py-5 px-6 text-base font-black text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
                recording
                  ? 'bg-rose-600 ring-4 ring-rose-300 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {submitting ? (
                <span>{lang === 'en' ? '⏳ Grading Answer...' : '⏳ సమాధానం ధృవీకరిస్తున్నాం...'}</span>
              ) : recording ? (
                <span>⏹️ {t('stop_recording_btn', lang)}</span>
              ) : (
                <span>{t('speak_mic_btn', lang)}</span>
              )}
            </button>

            {/* Option 2: Tap option buttons fallback */}
            {options.length > 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>{t('or_tap_option', lang)}</span>
                  <span className="text-xs font-normal text-slate-400">1-Touch Answer</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={submitting}
                      onClick={() => onAnswer(null, opt.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white p-3.5 text-left text-base font-bold text-slate-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50/50 disabled:opacity-50 active:scale-[0.99] transition flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      <span className="text-slate-300 text-sm">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Option 3: Type manually */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                {t('or_type_answer', lang)}
              </div>
              <TypedAnswer
                disabled={submitting}
                lang={lang}
                onSubmit={(text) => onAnswer(null, text)}
              />
            </div>

            {error ? <ErrorBanner error={error} onRetry={retryPending} /> : null}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-base font-medium">
            {lang === 'en' ? 'Loading Questions...' : 'ప్రశ్నలు సిద్ధమవుతున్నాయి...'}
          </p>
        </div>
      )}
    </StepLayout>
  )
}

function TypedAnswer({
  onSubmit,
  disabled,
  lang,
}: {
  onSubmit: (text: string) => void
  disabled?: boolean
  lang: AppLanguage
}) {
  const [value, setValue] = useState('')
  const placeholder = lang === 'en' ? "Type answer (e.g., 690 or Don't know)..." : "రాయండి (ఉదా: 690 లేదా తెలీదు)..."
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none disabled:opacity-50 shadow-inner"
        placeholder={placeholder}
      />
      <button
        disabled={disabled || !value.trim()}
        onClick={() => {
          if (value.trim()) {
            onSubmit(value.trim())
            setValue('')
          }
        }}
        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 active:scale-95 transition shadow"
      >
        Submit
      </button>
    </div>
  )
}

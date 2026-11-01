import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getExplanation, getTerms, type LoanTerms, type ExplanationSentence } from '../lib/api'
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

export default function Explain() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const onlyFieldIds = searchParams.get('only')?.split(',').filter(Boolean) ?? null
  const isReExplain = onlyFieldIds !== null && onlyFieldIds.length > 0

  const [terms, setTerms] = useState<LoanTerms>({})
  const [sentences, setSentences] = useState<ExplanationSentence[]>([])
  const [index, setIndex] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    const unsubSpeaking = subscribeSpeaking(setSpeaking)
    const unsubLang = subscribeLanguage(setLang)
    return () => {
      unsubSpeaking()
      unsubLang()
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

  // Helper to get sentence text according to active language
  function getCurrentText(item?: ExplanationSentence, targetLang: AppLanguage = lang): string {
    if (!item) return ''
    if (targetLang === 'en') {
      return item.text_en || item.text_te
    }
    if (targetLang === 'hi') {
      return item.text_hi || item.text_te
    }
    return item.text_te
  }

  // Auto-play when voice assistant enabled or item changes
  useEffect(() => {
    if (current && isVoiceAssistantEnabled()) {
      const text = getCurrentText(current, lang)
      speakText(text, lang)
    }
  }, [current, index, lang])

  function toggleAudio() {
    if (speaking) {
      stopSpeaking()
    } else if (current) {
      const text = getCurrentText(current, lang)
      speakText(text, lang)
    }
  }

  if (error) {
    return (
      <StepLayout title={t('explain_title', lang)} teluguTitle="రుణ వివరాల వివరణ">
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  const activeText = getCurrentText(current, lang)

  return (
    <StepLayout
      title={isReExplain ? 'Re-explaining Missed Terms' : t('explain_title', lang)}
      teluguTitle="రుణ వివరాలు — స్పష్టమైన మాటల్లో ప్రతి ఒక్క పదం వినండి"
      maxWidthClass="max-w-5xl"
    >
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-base font-medium text-slate-600">
            {lang === 'en'
              ? 'Generating trilingual explanation sentences...'
              : lang === 'hi'
              ? 'ऋण विवरण तैयार किया जा रहा है...'
              : 'తెలుగు మరియు ఇతర భాషల వివరణ సిద్ధమవుతోంది...'}
          </p>
        </div>
      ) : current ? (
        <div className="flex flex-col gap-6">
          {/* Main Card with 100% full width and responsive grid on wider displays */}
          <div className="rounded-3xl border-2 border-emerald-200/80 bg-white p-6 sm:p-8 shadow-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-emerald-900 border-b border-emerald-100/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1">
                  {t('item_counter', lang)} {index + 1} / {sentences.length}
                </span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 font-mono uppercase tracking-wide">
                  {current.field_id.replace('_', ' ')}
                </span>
              </div>

              {/* In-card Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLang('te')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                    lang === 'te' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                    lang === 'en' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('hi')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                    lang === 'hi' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Responsive 2-column or wide format */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-2">
                  {lang === 'en' ? 'Spoken Explanation' : lang === 'hi' ? 'मौखिक विवरण' : 'స్పష్టమైన వివరణ'}
                </div>
                <p className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-relaxed tracking-tight">
                  {activeText}
                </p>

                {/* Sub-translations for multi-lingual clarity */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
                  {lang !== 'te' && (
                    <div><span className="font-bold text-slate-700">తెలుగు:</span> {current.text_te}</div>
                  )}
                  {lang !== 'en' && current.text_en && (
                    <div><span className="font-bold text-slate-700">English:</span> {current.text_en}</div>
                  )}
                  {lang !== 'hi' && current.text_hi && (
                    <div><span className="font-bold text-slate-700">हिंदी:</span> {current.text_hi}</div>
                  )}
                </div>
              </div>

              {/* Audio Listen Button Box */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 px-5 text-base font-bold shadow-lg transition-all active:scale-95 ${
                    speaking
                      ? 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-4 ring-emerald-100'
                  }`}
                >
                  {speaking ? (
                    <>
                      <div className="flex items-center gap-1 text-white h-4">
                        <span className="sound-bar h-3"></span>
                        <span className="sound-bar h-5"></span>
                        <span className="sound-bar h-2"></span>
                        <span className="sound-bar h-4"></span>
                      </div>
                      <span>{t('stop_audio', lang)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🔊</span>
                      <span>
                        {lang === 'en'
                          ? 'Speak All Words & Numbers'
                          : lang === 'hi'
                          ? 'पूरा वाक्य सुनें'
                          : 'అన్ని పదాలు & నంబర్లు వినండి'}
                      </span>
                    </>
                  )}
                </button>
                <div className="text-[11px] text-center text-slate-400">
                  {speaking ? '🔊 Audio playing clearly word-by-word...' : 'Press to hear full sentence aloud'}
                </div>
              </div>
            </div>

            {/* Source card line quote verification */}
            {sourceField && (
              <div className="mt-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    📜 {t('source_on_card', lang)}
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Hallucination Protected
                  </span>
                </div>
                <div className="mt-1.5 text-base font-semibold text-amber-950 font-mono">
                  "{sourceField.source_text}"
                </div>
                <div className="mt-1 text-xs text-amber-800">
                  Verified Raw Fact: <strong className="text-amber-950 font-mono">{String(sourceField.value)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons: Responsive full width */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={index === 0}
              onClick={() => {
                stopSpeaking()
                setIndex((i) => i - 1)
              }}
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-6 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 active:scale-95 shadow-sm"
            >
              {t('back_btn', lang)}
            </button>

            {index < sentences.length - 1 ? (
              <button
                onClick={() => {
                  stopSpeaking()
                  setIndex((i) => i + 1)
                }}
                className="flex-1 rounded-2xl bg-slate-900 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-95"
              >
                {t('next_btn', lang)}
              </button>
            ) : isReExplain ? (
              <button
                onClick={() => {
                  stopSpeaking()
                  sessionId && navigate(`/result/${sessionId}`)
                }}
                className="flex-1 rounded-2xl bg-slate-900 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-95"
              >
                {t('view_cert_btn', lang)}
              </button>
            ) : (
              <button
                onClick={() => {
                  stopSpeaking()
                  sessionId && navigate(`/quiz/${sessionId}`)
                }}
                className="flex-1 rounded-2xl bg-emerald-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-95"
              >
                {t('start_quiz_btn', lang)}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-500 py-8 text-center">No explanation sentences to show.</p>
      )}
    </StepLayout>
  )
}

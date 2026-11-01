import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getExplanation, getTerms, type LoanTerms, type ExplanationSentence } from '../lib/api'
import {
  speakText,
  stopSpeaking,
  subscribeSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'
import { subscribeVoiceCommands } from '../lib/voiceCommander'

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

  // Hands-free voice commands in Explain
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'next') {
        stopSpeaking()
        if (index < sentences.length - 1) {
          setIndex((i) => i + 1)
        } else {
          navigate(isReExplain ? `/quiz/${sessionId}?only=${onlyFieldIds!.join(',')}` : `/quiz/${sessionId}`)
        }
      } else if (action === 'back') {
        stopSpeaking()
        if (index > 0) {
          setIndex((i) => i - 1)
        } else {
          navigate(-1)
        }
      } else if (action === 'repeat') {
        if (current) {
          speakText(getCurrentText(current, lang), lang)
        }
      }
    })
    return () => unsubCmd()
  }, [current, index, sentences.length, isReExplain, onlyFieldIds, sessionId, lang, navigate])

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
      <StepLayout
        title={t('explain_title', lang)}
        subtitle={{
          en: 'Explanation of loan terms',
          te: 'రుణ వివరాల వివరణ',
          hi: 'ऋण विवरण',
        }}
      >
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  const activeText = getCurrentText(current, lang)

  return (
    <StepLayout
      title={isReExplain ? (lang === 'en' ? 'Re-explaining Missed Terms' : 'పునఃపరిశీలన') : t('explain_title', lang)}
      subtitle={{
        en: 'Clear spoken explanation of each financial commitment',
        te: 'రుణ వివరాలు — స్పష్టమైన మాటల్లో ప్రతి ఒక్క పదం వినండి',
        hi: 'प्रत्येक वित्तीय शर्त का स्पष्ट विवरण',
      }}
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
              : 'వివరణ సిద్ధమవుతోంది...'}
          </p>
        </div>
      ) : current ? (
        <div className="flex flex-col gap-6">
          {/* Main Card with 100% full width and responsive grid on wider displays */}
          <div className="rounded-3xl border-2 border-emerald-200/80 bg-white p-6 sm:p-8 md:p-10 shadow-md">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-bold text-emerald-900 border-b border-emerald-100/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-3.5 py-1 text-xs sm:text-sm font-bold">
                  {t('item_counter', lang)} {index + 1} / {sentences.length}
                </span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-3.5 py-1 text-xs font-mono uppercase tracking-wide">
                  {current.field_id.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Responsive sentence and compact audio button */}
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex-1">
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-800 mb-2">
                  {lang === 'en' ? 'Spoken Explanation' : lang === 'hi' ? 'मौखिक विवरण' : 'స్పష్టమైన వివరణ'}
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-relaxed tracking-tight">
                  {activeText}
                </p>
              </div>

              {/* Compact Audio Button */}
              <div className="shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex items-center gap-2 rounded-2xl py-3 px-5 text-sm sm:text-base font-bold shadow-md transition-all active:scale-95 ${
                    speaking
                      ? 'bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-200'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 ring-4 ring-emerald-100'
                  }`}
                  title={speaking ? 'Stop Audio' : 'Listen'}
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
                      <span className="text-lg">🔊</span>
                      <span>{lang === 'en' ? 'Listen' : lang === 'hi' ? 'सुनें' : 'వినండి'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Source card line quote verification */}
            {sourceField && (
              <div className="mt-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50/80 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    📜 {t('source_on_card', lang)}
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded">
                    Hallucination Protected
                  </span>
                </div>
                <div className="mt-2 text-base sm:text-lg font-bold text-amber-950 font-mono">
                  "{sourceField.source_text}"
                </div>
                <div className="mt-1 text-xs sm:text-sm text-amber-900 font-medium">
                  {lang === 'en' ? 'Verified Raw Fact:' : 'ధృవీకరించబడిన విలువ:'}{' '}
                  <strong className="text-amber-950 font-mono text-base">{String(sourceField.value)}</strong>
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
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-4 px-6 text-sm sm:text-base font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 active:scale-95 shadow-sm"
            >
              {t('back_btn', lang)}
            </button>

            {index < sentences.length - 1 ? (
              <button
                onClick={() => {
                  stopSpeaking()
                  setIndex((i) => i + 1)
                }}
                className="flex-1 rounded-2xl bg-slate-900 py-4 px-6 text-sm sm:text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-95"
              >
                {t('next_btn', lang)}
              </button>
            ) : isReExplain ? (
              <button
                onClick={() => {
                  stopSpeaking()
                  sessionId && navigate(`/result/${sessionId}`)
                }}
                className="flex-1 rounded-2xl bg-slate-900 py-4 px-6 text-sm sm:text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-95"
              >
                {t('view_cert_btn', lang)}
              </button>
            ) : (
              <button
                onClick={() => {
                  stopSpeaking()
                  sessionId && navigate(`/quiz/${sessionId}`)
                }}
                className="flex-1 rounded-2xl bg-emerald-700 py-4 px-6 text-sm sm:text-base font-bold text-white shadow-lg hover:bg-emerald-800 active:scale-95"
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

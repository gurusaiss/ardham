import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { getCertificate, type GradeResult } from '../lib/api'
import {
  isVoiceAssistantEnabled,
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'

export default function Result() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const stateResults = (location.state as { results: GradeResult[] } | null)?.results ?? null

  const [results, setResults] = useState<GradeResult[] | null>(stateResults)
  const [error, setError] = useState<unknown>(null)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

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
      if (lang === 'en') {
        const msg = wrong.length === 0
          ? `Congratulations! Comprehension score is ${score} percent. All terms successfully verified.`
          : `Comprehension score is ${score} percent. ${wrong.length} term(s) require re-explanation.`
        speakText(msg, 'en')
      } else if (lang === 'hi') {
        const msg = wrong.length === 0
          ? `बधाई हो! समझ स्कोर ${score} प्रतिशत है। सभी शर्तें सफलतापूर्वक सत्यापित हो गईं।`
          : `समझ स्कोर ${score} प्रतिशत है। ${wrong.length} शर्तों को दोबारा समझने की आवश्यकता है।`
        speakText(msg, 'hi')
      } else {
        if (wrong.length === 0) {
          speakText(`అభినందనలు! రుణ అవగాహన స్కోర్ ${score} శాతం. అన్ని నిబంధనలు విజయవంతంగా ధృవీకరించబడ్డాయి.`, 'te')
        } else {
          speakText(`రుణ అవగాహన స్కోర్ ${score} శాతం. ${wrong.length} అంశాలలో స్పష్టత అవసరం.`, 'te')
        }
      }
    }
  }, [results, lang])

  if (error) {
    return (
      <StepLayout
        title={t('result_title', lang)}
        subtitle={{
          en: 'Comprehension scoring summary',
          te: 'అవగాహన ఫలితం',
          hi: 'समझ स्कोर परिणाम',
        }}
      >
        <ErrorBanner error={error} onRetry={load} />
      </StepLayout>
    )
  }

  if (results === null) {
    return (
      <StepLayout
        title={t('result_title', lang)}
        subtitle={{
          en: 'Comprehension scoring summary',
          te: 'అవగాహన ఫలితం',
          hi: 'समझ स्कोर परिणाम',
        }}
      >
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-500">Loading result...</p>
        </div>
      </StepLayout>
    )
  }

  return (
    <StepLayout
      title={t('result_title', lang)}
      subtitle={{
        en: 'Borrower comprehension verification score',
        te: 'రుణ నిబంధనల అవగాహన పరీక్ష ఫలితం',
        hi: 'ऋण समझ परीक्षा परिणाम',
      }}
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border-2 border-emerald-200/80 bg-white p-8 text-center shadow-sm">
          <div className={`text-6xl font-black ${score >= 70 ? 'text-emerald-700' : 'text-amber-600'}`}>
            {score}%
          </div>
          <div className="mt-2 text-base font-bold text-slate-800">
            {t('score_label', lang)}
          </div>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            {wrong.length === 0
              ? (lang === 'en'
                  ? '✓ Borrower demonstrated clear oral understanding of all key financial commitments.'
                  : '✓ రుణగ్రహీత అన్ని నిబంధనలను స్పష్టంగా అర్థం చేసుకున్నారు')
              : (lang === 'en'
                  ? 'Some terms were not fully understood. You can re-explain them below before generating the certificate.'
                  : 'కొన్ని అంశాలలో స్పష్టత లోపించింది. సర్టిఫికెట్ జారీ చేయడానికి ముందే వాటిని మళ్లీ వివరించవచ్చు.')}
          </p>
        </div>

        {wrong.length > 0 && (
          <div className="rounded-3xl border border-amber-300 bg-amber-50/80 p-6 shadow-sm">
            <p className="text-base font-bold text-amber-900 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                {lang === 'en'
                  ? `${wrong.length} term(s) missed during the comprehension loop:`
                  : `${wrong.length} సమాధానాలలో స్పష్టత లోపించింది:`}
              </span>
            </p>
            <ul className="mt-3 list-inside list-disc text-sm text-amber-800 font-medium space-y-1">
              {wrong.map((r) => (
                <li key={r.field_id} className="capitalize">
                  {r.field_id.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                stopSpeaking()
                sessionId &&
                  navigate(`/explain/${sessionId}?only=${wrong.map((r) => r.field_id).join(',')}`)
              }}
              className="mt-4 w-full rounded-2xl bg-amber-600 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-amber-700 active:scale-95 transition"
            >
              {t('re_explain_btn', lang)}
            </button>
          </div>
        )}

        <button
          onClick={() => {
            stopSpeaking()
            sessionId && navigate(`/certificate/${sessionId}`)
          }}
          className="w-full rounded-2xl bg-slate-900 py-4 px-6 text-base font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.98] transition"
        >
          {t('view_cert_btn', lang)}
        </button>
      </div>
    </StepLayout>
  )
}

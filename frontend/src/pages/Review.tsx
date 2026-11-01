import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import LoanSimulator from '../components/LoanSimulator'
import { confirmTerms, getAnalysis, type FairnessAnalysis, type LoanTerms } from '../lib/api'
import {
  isVoiceAssistantEnabled,
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'

export default function Review() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as {
    terms: LoanTerms
    consistencyWarnings?: string[]
    fairnessAnalysis?: FairnessAnalysis
  } | null

  const [terms] = useState<LoanTerms>(state?.terms ?? {})
  const consistencyWarnings = state?.consistencyWarnings ?? []
  const [fairness, setFairness] = useState<FairnessAnalysis | null>(state?.fairnessAnalysis ?? null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  useEffect(() => {
    if (!fairness && sessionId) {
      getAnalysis(sessionId).then(setFairness).catch(() => {})
    }
  }, [sessionId, fairness])

  useEffect(() => {
    if (fairness && isVoiceAssistantEnabled()) {
      if (lang === 'en') {
        const topWarn = fairness.warnings_en[0] ? ' Please review predatory alerts.' : ''
        speakText(
          `Loan review loaded. Net cash in hand is ₹${fairness.net_in_hand.toLocaleString('en-IN')}. Total repayment is ₹${fairness.total_payable.toLocaleString('en-IN')}.${topWarn}`,
          'en'
        )
      } else if (lang === 'hi') {
        speakText(
          `ऋण समीक्षा लोड हो गई है। हाथ में मिलने वाली राशि ₹${fairness.net_in_hand.toLocaleString('en-IN')} है। कुल भुगतान ₹${fairness.total_payable.toLocaleString('en-IN')} है।`,
          'hi'
        )
      } else {
        const topWarning = fairness.warnings_te[0] || ''
        speakText(
          `రుణ వివరాలు సేకరించబడ్డాయి. నికరంగా చేతికి అందే మొత్తం ₹${fairness.net_in_hand.toLocaleString('en-IN')}. ${topWarning}`,
          'te'
        )
      }
    }
    return () => stopSpeaking()
  }, [fairness, lang])

  const lowConfidence = Object.entries(terms).filter(([, f]) => f.confidence < 0.7)

  async function onConfirm() {
    if (!sessionId) return
    setConfirming(true)
    setError(null)
    try {
      await confirmTerms(sessionId, terms)
      navigate(`/explain/${sessionId}`)
    } catch (e) {
      setError(e)
    } finally {
      setConfirming(false)
    }
  }

  function speakWarnings() {
    if (!fairness) return
    if (lang === 'en') {
      const text = fairness.warnings_en.length > 0
        ? fairness.warnings_en.join('. ')
        : 'This loan meets fair lending guidelines. No hidden penalty traps detected.'
      speakText(text, 'en')
    } else if (lang === 'hi') {
      const text = fairness.warnings_en.length > 0
        ? `चेतावनी: हाथ में आने वाली राशि ₹${fairness.net_in_hand} है। अतिरिक्त ब्याज और शुल्क ₹${fairness.total_extra_cost} हैं।`
        : 'यह ऋण निष्पक्ष दिशानिर्देशों के अनुरूप है। कोई छिपा हुआ शुल्क नहीं मिला।'
      speakText(text, 'hi')
    } else {
      if (fairness.warnings_te.length > 0) {
        speakText(fairness.warnings_te.join('. '), 'te')
      } else {
        speakText('ఈ రుణంలో ఎలాంటి దాచిన ఛార్జీలు లేదా అదనపు ఫీజులు కనిపించలేదు. ఇది న్యాయమైన రుణం.', 'te')
      }
    }
  }

  const warnings = lang === 'en' ? (fairness?.warnings_en ?? []) : (fairness?.warnings_te ?? [])
  const fairnessBadge = lang === 'en' ? (fairness?.fairness_label ?? 'Fair') : (fairness?.fairness_label_te ?? 'న్యాయమైన రుణం')
  const savingsText = lang === 'en' ? fairness?.moneylender_comparison.savings_en : fairness?.moneylender_comparison.savings_te

  return (
    <StepLayout
      title={t('review_title', lang)}
      subtitle={{
        en: 'Net cash in hand, interest breakdown & hidden fee audit',
        te: 'రుణ వివరాలు, నికరంగా చేతికి అందే నగదు & దాచిన ఛార్జీల విశ్లేషణ',
        hi: 'हाथ में मिलने वाली राशि, ब्याज और शुल्क विश्लेषण',
      }}
      maxWidthClass="max-w-7xl"
    >
      {/* Consistency Warnings from Guard */}
      {consistencyWarnings.length > 0 && (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm">
          <p className="font-bold flex items-center gap-1.5 text-rose-900">
            <span>⚠️ Guard Consistency Alert ({consistencyWarnings.length}):</span>
          </p>
          <ul className="mt-2 list-inside list-disc text-xs space-y-1">
            {consistencyWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Responsive Grid: Left Column = Analysis & Simulator, Right Column = Terms & Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Analysis & Simulator */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Predatory Trap & Fairness Analysis Card */}
          {fairness && (
            <div className="rounded-3xl border-2 border-emerald-500 bg-white p-6 shadow-md space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('fairness_score', lang)}
                  </span>
                  <div className="text-3xl font-black text-slate-900 flex items-center gap-3 mt-1">
                    <span>{fairness.fairness_score}/100</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        fairness.fairness_score >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : fairness.fairness_score >= 65
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {fairnessBadge}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={speakWarnings}
                  className="rounded-2xl bg-emerald-50 border border-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition flex items-center gap-2 shadow-sm"
                >
                  <span>{t('listen_analysis_btn', lang)}</span>
                </button>
              </div>

              {/* Visual Money Flow Card */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t('money_flow_title', lang)}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-emerald-50/90 p-4 border border-emerald-200 shadow-sm">
                    <div className="text-xs font-bold text-emerald-900">{t('net_in_hand', lang)}</div>
                    <div className="text-lg sm:text-2xl font-black text-emerald-950 mt-1">
                      ₹{fairness.net_in_hand.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold mt-0.5">Disbursed</div>
                  </div>

                  <div className="rounded-2xl bg-amber-50/90 p-4 border border-amber-200 shadow-sm">
                    <div className="text-xs font-bold text-amber-900">{t('extra_cost', lang)}</div>
                    <div className="text-lg sm:text-2xl font-black text-amber-950 mt-1">
                      ₹{fairness.total_extra_cost.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-amber-800 font-semibold mt-0.5">Interest + Fees</div>
                  </div>

                  <div className="rounded-2xl bg-slate-50/90 p-4 border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-800">{t('total_repayment', lang)}</div>
                    <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                      ₹{fairness.total_payable.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-600 font-semibold mt-0.5">Total Repaid</div>
                  </div>
                </div>

                {/* Proportional visual bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>{t('principal_ratio', lang)}: {Math.round((fairness.net_in_hand / (fairness.total_payable || 1)) * 100)}%</span>
                    <span>{t('fees_ratio', lang)}: {Math.round((fairness.total_extra_cost / (fairness.total_payable || 1)) * 100)}%</span>
                  </div>
                  <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    <div
                      style={{ width: `${(fairness.net_in_hand / (fairness.total_payable || 1)) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(fairness.total_extra_cost / (fairness.total_payable || 1)) * 100}%` }}
                      className="bg-amber-500 transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hidden APR Gap / Predatory Alerts */}
              {warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <span>🚨 {lang === 'en' ? 'Hidden Terms & Traps Detected:' : 'దాచిన షరతులు & హెచ్చరికలు:'}</span>
                  </div>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-950 leading-relaxed font-semibold">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Informal Moneylender Savings Comparison */}
              {fairness.moneylender_comparison.borrower_savings > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                    <span>💰 {lang === 'en' ? 'Informal Moneylender Comparison:' : 'వడ్డీ వ్యాపారి కంటే ఎంత ఆదా?'}</span>
                  </p>
                  <p className="mt-1.5 font-bold text-emerald-800 text-sm">
                    {savingsText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Interactive What-If Loan Simulator */}
          <LoanSimulator
            loanAmount={Number(terms.loan_amount?.value || 30000)}
            instalmentAmount={Number(terms.instalment_amount?.value || 690)}
            penalty={Number(terms.penalty?.value || 20)}
            loanType={String(terms.lender?.source_text || '')}
          />
        </div>

        {/* Right Column (5 cols): Extracted Terms & Confirmation */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'en' ? 'Extracted Loan Terms' : lang === 'hi' ? 'प्राप्त ऋण शर्तें' : 'సేకరించిన వివరాలు'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {Object.keys(terms).length} Fields
              </span>
            </div>

            {lowConfidence.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 border border-amber-200">
                ⚠️ {lowConfidence.length} field(s) have lower confidence — please verify against the card.
              </div>
            )}

            {/* Extracted Fields Table */}
            <ul className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
              {Object.entries(terms).map(([fieldId, field]) => (
                <li key={fieldId} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm hover:border-emerald-200 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold capitalize text-slate-600">
                      {fieldId.replace(/_/g, ' ')}
                    </span>
                    {field.confidence < 0.7 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        Check
                      </span>
                    )}
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{String(field.value)}</div>
                  <div className="mt-1 text-xs text-slate-500 font-mono truncate">"{field.source_text}"</div>
                </li>
              ))}
            </ul>

            {error ? (
              <div className="mt-2">
                <ErrorBanner error={error} onRetry={onConfirm} />
              </div>
            ) : null}

            <button
              disabled={confirming || Object.keys(terms).length === 0}
              onClick={onConfirm}
              className="mt-2 w-full rounded-2xl bg-emerald-700 py-4 px-6 text-base font-bold text-white shadow-lg hover:bg-emerald-800 disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>{confirming ? 'Confirming...' : t('confirm_terms_btn', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </StepLayout>
  )
}

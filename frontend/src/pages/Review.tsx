import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { confirmTerms, getAnalysis, type FairnessAnalysis, type LoanTerms } from '../lib/api'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking } from '../lib/speech'

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

  useEffect(() => {
    if (!fairness && sessionId) {
      getAnalysis(sessionId).then(setFairness).catch(() => {})
    }
  }, [sessionId, fairness])

  useEffect(() => {
    if (fairness && isVoiceAssistantEnabled()) {
      const topWarning = fairness.warnings_te[0] || ''
      speakTelugu(
        `రుణ వివరాలు సేకరించబడ్డాయి. నికరంగా చేతికి అందే మొత్తం ₹${fairness.net_in_hand.toLocaleString('en-IN')}. ${topWarning}`
      )
    }
    return () => stopSpeaking()
  }, [fairness])

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
    if (fairness.warnings_te.length > 0) {
      speakTelugu(fairness.warnings_te.join('. '))
    } else {
      speakTelugu('ఈ రుణంలో ఎలాంటి దాచిన ఛార్జీలు లేదా అదనపు ఫీజులు కనిపించలేదు. ఇది న్యాయమైన రుణం.')
    }
  }

  return (
    <StepLayout title="Loan Review & Fairness Analysis" teluguTitle="రుణ వివరాలు & మోసపూరిత వడ్డీ విశ్లేషణ">
      {/* Consistency Warnings from Guard */}
      {consistencyWarnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️ Guard Consistency Alert ({consistencyWarnings.length}):</span>
          </p>
          <ul className="mt-2 list-inside list-disc text-xs space-y-1">
            {consistencyWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Predatory Trap & Fairness Analysis Card */}
      {fairness && (
        <div className="mb-5 rounded-2xl border-2 border-emerald-500 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fair Lending Score
              </span>
              <div className="text-2xl font-black text-slate-900">
                {fairness.fairness_score}/100{' '}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  fairness.fairness_score >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : fairness.fairness_score >= 65
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {fairness.fairness_label_te}
                </span>
              </div>
            </div>

            <button
              onClick={speakWarnings}
              className="rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition flex items-center gap-1"
            >
              <span>🔊 విశ్లేషణ వినండి</span>
            </button>
          </div>

          {/* Visual Money Flow Card */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              డబ్బు ప్రయాణం (Visual Money Flow)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-200">
                <div className="text-[10px] font-semibold text-emerald-800">చేతికి వచ్చేది</div>
                <div className="text-base font-bold text-emerald-950">
                  ₹{fairness.net_in_hand.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-emerald-700">Net in Hand</div>
              </div>

              <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200">
                <div className="text-[10px] font-semibold text-amber-800">అదనపు ఖర్చు</div>
                <div className="text-base font-bold text-amber-950">
                  ₹{fairness.total_extra_cost.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-amber-700">Interest + Fees</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-700">మొత్తం చెల్లింపు</div>
                <div className="text-base font-bold text-slate-900">
                  ₹{fairness.total_payable.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-500">Total Repaid</div>
              </div>
            </div>

            {/* Proportional visual bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>అసలు (Principal: {Math.round((fairness.net_in_hand / (fairness.total_payable || 1)) * 100)}%)</span>
                <span>వడ్డీ & ఫీజులు (Extra: {Math.round((fairness.total_extra_cost / (fairness.total_payable || 1)) * 100)}%)</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${(fairness.net_in_hand / (fairness.total_payable || 1)) * 100}%` }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ width: `${(fairness.total_extra_cost / (fairness.total_payable || 1)) * 100}%` }}
                  className="bg-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Hidden APR Gap / Predatory Alerts */}
          {fairness.warnings_te.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3 space-y-1.5">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>🚨 దాచిన షరతులు & హెచ్చరికలు (Hidden Traps Detected):</span>
              </div>
              {fairness.warnings_te.map((w, i) => (
                <p key={i} className="text-xs text-amber-950 leading-relaxed font-medium">
                  • {w}
                </p>
              ))}
            </div>
          )}

          {/* Informal Moneylender Savings Comparison */}
          {fairness.moneylender_comparison.borrower_savings > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950">
              <p className="font-bold flex items-center gap-1 text-emerald-900">
                <span>💰 వడ్డీ వ్యాపారి కంటే ఎంత ఆదా? (Moneylender Savings):</span>
              </p>
              <p className="mt-1 font-medium text-emerald-800">
                {fairness.moneylender_comparison.savings_te}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {fairness.moneylender_comparison.savings_en}
              </p>
            </div>
          )}
        </div>
      )}

      {lowConfidence.length > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          ⚠️ {lowConfidence.length} field(s) had low confidence — please verify against the card.
        </div>
      )}

      {/* Extracted Fields Table */}
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        సేకరించిన లోన్ వివరాలు (Extracted Terms)
      </div>
      <ul className="flex flex-col gap-2">
        {Object.entries(terms).map(([fieldId, field]) => (
          <li key={fieldId} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold capitalize text-slate-600">
                {fieldId.replace(/_/g, ' ')}
              </span>
              {field.confidence < 0.7 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  check
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{String(field.value)}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-mono">source: "{field.source_text}"</div>
          </li>
        ))}
      </ul>

      {error ? (
        <div className="mt-4">
          <ErrorBanner error={error} onRetry={onConfirm} />
        </div>
      ) : null}

      <button
        disabled={confirming || Object.keys(terms).length === 0}
        onClick={onConfirm}
        className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition"
      >
        {confirming ? 'Confirming...' : 'వివరాలు సరిగ్గా ఉన్నాయి — కొనసాగించండి (Confirm Terms) →'}
      </button>
    </StepLayout>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from '../components/OfflineIndicator'
import GlobalAudioBar from '../components/GlobalAudioBar'
import VoiceAssistantModal from '../components/VoiceAssistantModal'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking, resetVoiceModal } from '../lib/speech'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'

export default function Home() {
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())

  useEffect(() => {
    return subscribeAuth(setUser)
  }, [])

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      speakTelugu('అర్ధం కి స్వాగతం. లోన్ వెరిఫికేషన్ ప్రారంభించడానికి స్టార్ట్ సెషన్ బటన్ నొక్కండి.')
    }
    return () => stopSpeaking()
  }, [])

  function resetAndOpenModal() {
    resetVoiceModal()
    setShowVoiceModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-100/70 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/40 py-4 sm:py-8 px-2 sm:px-4 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white sm:shadow-xl sm:border sm:border-slate-200/80 p-5 sm:p-8 flex-1 flex flex-col justify-between animate-fade-in">
        {/* Top User Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <Link
            to="/auth"
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-emerald-700 transition"
          >
            <span>👤</span>
            <span>{user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : '🔑 Sign In / Demo Login'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
            <OfflineIndicator />
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-extrabold text-emerald-800 mb-3 shadow-sm">
            <span>✨ Powered by Gemma 4 Edge AI</span>
            <span>•</span>
            <span>100% Offline Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            అర్థం <span className="text-2xl sm:text-3xl font-medium text-slate-500 font-sans">Ardham</span>
          </h1>

          <p className="mt-3 text-base sm:text-lg font-semibold text-slate-700 leading-snug">
            గ్రామీణ మరియు దృష్టి లోపం ఉన్న రుణగ్రహీతల కోసం ప్రత్యేక వెరిఫికేషన్
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Offline Loan Comprehension & Regulatory Verification in Pure Telugu
          </p>
        </div>

        {/* Loan Categories Quick Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
          <Link
            to="/scan/microfinance-group-loan"
            className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 p-3.5 text-left hover:bg-emerald-100/70 hover:scale-[1.02] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">👩‍🌾</span>
              <p className="font-extrabold text-sm text-emerald-950 mt-1">Microfinance</p>
              <p className="text-[11px] text-emerald-800 font-medium leading-tight mt-0.5">
                స్వయం సహాయక సంఘాలు (JLG Group Loan)
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 mt-2">⚡ Quick Scan →</span>
          </Link>

          <Link
            to="/scan/gold-loan"
            className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-3.5 text-left hover:bg-amber-100/70 hover:scale-[1.02] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">💍</span>
              <p className="font-extrabold text-sm text-amber-950 mt-1">Gold Loan</p>
              <p className="text-[11px] text-amber-800 font-medium leading-tight mt-0.5">
                బంగారు ఆభరణాల తాకట్టు రుణం
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 mt-2">⚡ Quick Scan →</span>
          </Link>

          <Link
            to="/scan/individual-personal-loan"
            className="rounded-2xl border-2 border-blue-300 bg-blue-50/50 p-3.5 text-left hover:bg-blue-100/70 hover:scale-[1.02] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">💼</span>
              <p className="font-extrabold text-sm text-blue-950 mt-1">Personal Loan</p>
              <p className="text-[11px] text-blue-800 font-medium leading-tight mt-0.5">
                వ్యక్తిగత రుణం (Monthly EMI)
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 mt-2">⚡ Quick Scan →</span>
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="mt-4 space-y-2.5">
          <Link
            to="/choose-loan"
            className="w-full block rounded-2xl bg-slate-900 py-4 text-center text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
          >
            కొత్త సెషన్ ప్రారంభించండి (Start Full Verification) →
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/auth"
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              {user ? '👤 Account Profile' : '🔑 Sign In / Demo Login'}
            </Link>
            <button
              onClick={resetAndOpenModal}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              🌐 భాష & వాయిస్ సెటప్
            </button>
          </div>
        </div>

        {/* Regulatory & Safety Footer Card */}
        <div className="mt-5 rounded-2xl bg-emerald-50/70 p-3.5 text-left border border-emerald-200/80 text-xs text-emerald-950">
          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
            <span>🏛️ RBI Key Fact Statement (KFS) Audit Ready</span>
          </p>
          <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
            Complies with RBI Digital Lending Guidelines (2022) & Microfinance Fair Practices Code.
            Deterministic Hallucination Guard prevents AI financial errors.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 text-center">
          Ardham assists the field officer. All sample data is fictional. Not legal or financial advice.
        </p>
      </div>

      <VoiceAssistantModal
        isOpen={showVoiceModal ? true : undefined}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

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
    // If voice assistant is already enabled from earlier session, announce page welcome
    if (isVoiceAssistantEnabled()) {
      speakTelugu('అర్ధం కి స్వాగతం. లోన్ వెరిఫికేషన్ ప్రారంభించడానికి స్టార్ట్ సెషన్ బటన్ నొక్కండి.')
    }
    return () => {
      stopSpeaking()
    }
  }, [])

  function resetAndOpenModal() {
    resetVoiceModal()
    setShowVoiceModal(true)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-6 text-center">
      {/* User Login Bar */}
      <div className="w-full mb-4 flex items-center justify-between text-xs text-slate-500 border-b pb-2">
        <Link
          to="/auth"
          className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-emerald-700"
        >
          <span>👤</span>
          <span>{user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : '🔑 Sign In / 1-Click Demo'}</span>
        </Link>
        <div className="flex items-center gap-2">
          <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
          <OfflineIndicator />
        </div>
      </div>

      <div className="relative inline-block mt-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">అర్థం</h1>
        <span className="absolute -top-2 -right-6 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          Gemma AI
        </span>
      </div>
      <p className="mt-1 text-lg font-medium text-slate-600">Ardham</p>

      <p className="mt-3 text-sm text-slate-700 font-medium">
        గ్రామీణ మరియు దృష్టి లోపం ఉన్న రుణగ్రహీతల కోసం ప్రత్యేక వెరిఫికేషన్
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Make sure the borrower understands their loan before signing.
      </p>

      <div className="mt-8 w-full space-y-3">
        <Link
          to="/choose-loan"
          className="w-full block rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
        >
          Start a new session (కొత్త సెషన్ ప్రారంభించండి)
        </Link>

        <Link
          to="/scan/microfinance-group-loan"
          className="w-full block rounded-2xl border-2 border-emerald-600 bg-emerald-50/80 py-3 text-sm font-bold text-emerald-900 shadow-sm hover:bg-emerald-100 active:scale-[0.98] transition"
        >
          ⚡ 1-Click Demo: Microfinance Loan Scan
        </Link>

        <div className="flex gap-2">
          <Link
            to="/auth"
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {user ? '👤 Account Profile' : '🔑 Sign In / Demo Login'}
          </Link>
          <button
            onClick={resetAndOpenModal}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            🌐 భాష & వాయిస్ సెటప్ (Language & Voice)
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-emerald-50 p-3.5 text-left border border-emerald-200 text-xs text-emerald-950">
        <p className="font-bold flex items-center gap-1.5">
          <span>🏛️ RBI KFS & Oral Consent Compliance</span>
        </p>
        <p className="mt-1 text-emerald-800 leading-relaxed">
          Complies with RBI Digital Lending Guidelines & Microfinance Fair Practices Code: verified oral comprehension before thumbprint/signing.
        </p>
      </div>

      <p className="mt-6 text-[11px] text-slate-400">
        All sample data is fictional. Not legal or financial advice.
      </p>

      <VoiceAssistantModal
        isOpen={showVoiceModal ? true : undefined}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

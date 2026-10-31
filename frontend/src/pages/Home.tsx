import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from '../components/OfflineIndicator'
import GlobalAudioBar from '../components/GlobalAudioBar'
import VoiceAssistantModal from '../components/VoiceAssistantModal'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking } from '../lib/speech'

export default function Home() {
  const [showVoiceModal, setShowVoiceModal] = useState(false)

  useEffect(() => {
    // If voice assistant is already enabled from earlier session, announce page welcome
    if (isVoiceAssistantEnabled()) {
      speakTelugu('అర్ధం కి స్వాగతం. లోన్ వెరిఫికేషన్ ప్రారంభించడానికి స్టార్ట్ సెషన్ బటన్ నొక్కండి.')
    }
    return () => {
      stopSpeaking()
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex items-center gap-2">
        <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
        <OfflineIndicator />
      </div>

      <div className="relative inline-block">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">అర్థం</h1>
        <span className="absolute -top-2 -right-6 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          Gemma AI
        </span>
      </div>
      <p className="mt-1 text-lg font-medium text-slate-600">Ardham</p>

      <p className="mt-3 text-sm text-slate-600 font-medium">
        గ్రామీణ మరియు దృష్టి లోపం ఉన్న రుణగ్రహీతల కోసం ప్రత్యేక వెరిఫికేషన్
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Make sure the borrower understands their loan before signing.
      </p>

      <div className="mt-8 w-full space-y-3">
        <Link
          to="/choose-loan"
          className="w-full block rounded-xl bg-slate-900 py-4 text-lg font-medium text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
        >
          Start a new session
        </Link>

        <button
          onClick={() => setShowVoiceModal(true)}
          className="w-full block rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition"
        >
          🎙️ వాయిస్ అసిస్టెంట్ సెట్టింగ్స్ మార్చండి (Voice Settings)
        </button>
      </div>

      <div className="mt-6 rounded-lg bg-emerald-50 p-3 text-left border border-emerald-200 text-xs text-emerald-900">
        <p className="font-semibold flex items-center gap-1.5">
          <span>🏛️ RBI KFS Compliance Seal</span>
        </p>
        <p className="mt-1 text-emerald-800">
          Complies with RBI Digital Lending & Microfinance Fair Practices Code: verified oral comprehension before signing.
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        All sample data is fictional. Not legal or financial advice.
      </p>

      <VoiceAssistantModal
        isOpen={showVoiceModal ? true : undefined}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

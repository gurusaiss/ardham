import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type AppLanguage,
  getLanguage,
  setLanguage,
  subscribeLanguage,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
  stopSpeaking,
} from '../lib/speech'
import { getCurrentUser, subscribeAuth, signOut, signInDemo, type User } from '../lib/auth'

interface Props {
  isOpen: boolean
  onClose: () => void
  onOpenVideoGuide?: () => void
}

export default function SettingsModal({ isOpen, onClose, onOpenVideoGuide }: Props) {
  const navigate = useNavigate()
  const [lang, setLangState] = useState<AppLanguage>(getLanguage())
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceAssistantEnabled())
  const [user, setUser] = useState<User | null>(getCurrentUser())

  useEffect(() => {
    const unsubLang = subscribeLanguage(setLangState)
    const unsubAuth = subscribeAuth(setUser)
    return () => {
      unsubLang()
      unsubAuth()
    }
  }, [])

  if (!isOpen) return null

  function handleLanguageChange(newLang: AppLanguage) {
    stopSpeaking()
    setLanguage(newLang)
  }

  function handleVoiceToggle(enabled: boolean) {
    setVoiceEnabled(enabled)
    setVoiceAssistantEnabled(enabled)
    if (!enabled) {
      stopSpeaking()
    }
  }

  function handleSignOut() {
    signOut()
    navigate('/')
    onClose()
  }

  function handleSwitchDemo(role: 'officer' | 'borrower') {
    signInDemo(role)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">
              ⚙️
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {lang === 'en' ? 'Platform Settings & Controls' : lang === 'hi' ? 'सेटिंग्स और नियंत्रण' : 'సెట్టింగ్స్ & నియంత్రణలు'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'en' ? 'Language, Voice, Account & Navigation' : 'భాష, వాయిస్, ఖాతా & నావిగేషన్'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 1. Language Selection Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              🌐 {lang === 'en' ? 'Application Language' : lang === 'hi' ? 'भाषा चयन' : 'భాష ఎంపిక'}
            </span>
            <span className="text-xs text-emerald-700 font-bold">
              {lang === 'en' ? 'Active: English' : lang === 'hi' ? 'सक्रिय: हिंदी' : 'యాక్టివ్: తెలుగు'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleLanguageChange('te')}
              className={`rounded-2xl p-3 text-center border-2 transition active:scale-95 ${
                lang === 'te'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="text-base sm:text-lg">🪔</div>
              <div className="text-xs sm:text-sm font-bold mt-1">తెలుగు</div>
              <div className="text-[11px] text-slate-400">Telugu</div>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`rounded-2xl p-3 text-center border-2 transition active:scale-95 ${
                lang === 'en'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="text-base sm:text-lg">🌐</div>
              <div className="text-xs sm:text-sm font-bold mt-1">English</div>
              <div className="text-[11px] text-slate-400">Standard</div>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`rounded-2xl p-3 text-center border-2 transition active:scale-95 ${
                lang === 'hi'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="text-base sm:text-lg">🇮🇳</div>
              <div className="text-xs sm:text-sm font-bold mt-1">हिंदी</div>
              <div className="text-[11px] text-slate-400">Hindi</div>
            </button>
          </div>
        </div>

        {/* 2. Voice Assistant Mode */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            🎙️ {lang === 'en' ? 'Voice Readout Mode' : lang === 'hi' ? 'वॉइस असिस्टेंट मोड' : 'వాయిస్ అసిస్టెంట్ మోడ్'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleVoiceToggle(true)}
              className={`rounded-2xl p-3.5 text-left border-2 transition flex items-center justify-between ${
                voiceEnabled
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="text-sm font-bold">🎙️ {lang === 'en' ? 'Voice ON' : 'వాయిస్ ఆన్'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'en' ? 'Auto-speaks all terms' : 'ప్రతి పదాన్ని చదువుతుంది'}
                </p>
              </div>
              {voiceEnabled && <span className="text-emerald-700 text-sm font-bold">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleVoiceToggle(false)}
              className={`rounded-2xl p-3.5 text-left border-2 transition flex items-center justify-between ${
                !voiceEnabled
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="text-sm font-bold">🔇 {lang === 'en' ? 'Silent Mode' : 'సైలెంట్ మోడ్'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'en' ? 'Manual audio only' : 'నొక్కినప్పుడు మాత్రమే'}
                </p>
              </div>
              {!voiceEnabled && <span className="text-emerald-700 text-sm font-bold">✓</span>}
            </button>
          </div>
        </div>

        {/* 3. Account Profile & Sign Out */}
        <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              👤 {lang === 'en' ? 'Active User Profile' : 'యూజర్ ప్రొఫైల్'}
            </span>
            {user && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 capitalize">
                {user.role}
              </span>
            )}
          </div>

          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <p className="font-extrabold text-slate-900 text-base">{user.name}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {user.organization} • {user.phone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-95 transition"
                >
                  🚪 {lang === 'en' ? 'Sign Out' : 'లాగౌట్'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">{lang === 'en' ? 'Not signed in' : 'లాగిన్ అవ్వలేదు'}</span>
              <button
                type="button"
                onClick={() => {
                  navigate('/auth')
                  onClose()
                }}
                className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                {lang === 'en' ? 'Sign In / Register' : 'సైన్ ఇన్'}
              </button>
            </div>
          )}

          {/* Quick Demo Switcher */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">{lang === 'en' ? 'Quick Demo Switch:' : 'డెమో ఖాతా మార్చండి:'}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSwitchDemo('officer')}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-100"
              >
                👔 Officer
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDemo('borrower')}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-100"
              >
                👩‍🌾 Borrower
              </button>
            </div>
          </div>
        </div>

        {/* 4. AI Video Walkthrough Feature */}
        {onOpenVideoGuide && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span>🎬</span>
                <span>{lang === 'en' ? 'AI Video & Voice Walkthrough' : 'AI వీడియో & వాయిస్ డెమో'}</span>
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {lang === 'en'
                  ? 'Watch how Gemma 4 scans loan cards, audits fees, and verifies comprehension.'
                  : 'జెమ్మా 4 లోన్ కార్డును ఎలా స్కాన్ చేసి వివరిస్తుందో వీడియోలో చూడండి.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenVideoGuide()
              }}
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 active:scale-95 transition"
            >
              ▶️ {lang === 'en' ? 'Watch AI Demo' : 'వీడియో చూడండి'}
            </button>
          </div>
        )}

        {/* 5. Navigation Shortcuts to All Sections */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            🧭 {lang === 'en' ? 'Direct Workflow Navigation' : 'నేరుగా పేజీలకు వెళ్లండి'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                navigate('/')
                onClose()
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              🏠 Home
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/choose-loan')
                onClose()
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              📋 Categories
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/scan/microfinance-group-loan')
                onClose()
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              📷 Scan Card
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/auth')
                onClose()
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              🔑 Account
            </button>
          </div>
        </div>

        {/* Modal Action Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition"
        >
          {lang === 'en' ? 'Done / Close Settings' : 'ముగించు (Close)'}
        </button>
      </div>
    </div>
  )
}

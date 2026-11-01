import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from './OfflineIndicator'
import GlobalAudioBar from './GlobalAudioBar'
import StepProgress from './StepProgress'
import VoiceAssistantModal from './VoiceAssistantModal'
import { stopSpeaking, getLanguage, setLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'

export default function StepLayout({
  title,
  teluguTitle,
  children,
  maxWidthClass = 'max-w-6xl',
}: {
  title: string
  teluguTitle?: string
  children: ReactNode
  maxWidthClass?: string
}) {
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())
  const [lang, setLangState] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeAuth(setUser)
  }, [])

  useEffect(() => {
    return subscribeLanguage(setLangState)
  }, [])

  // Global key listener: Escape stops speech instantly
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        stopSpeaking()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function switchLang(newLang: AppLanguage) {
    stopSpeaking()
    setLanguage(newLang)
  }

  return (
    <div className="min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/40 py-2 sm:py-6 px-2 sm:px-6 lg:px-8 flex flex-col justify-between transition-colors">
      <div className={`mx-auto w-full ${maxWidthClass} rounded-3xl bg-white shadow-lg sm:shadow-xl border border-slate-200/80 p-4 sm:p-7 md:p-8 flex-1 flex flex-col animate-fade-in`}>
        {/* Top Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 font-black text-slate-900 hover:text-emerald-700 transition"
              title="Ardham Home"
            >
              <span className="text-xl sm:text-2xl text-emerald-800">అర్థం</span>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Gemma 4
              </span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/auth"
              className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100/80 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              <span>👤 {user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : 'Sign In'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Real-time Language Switcher Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => switchLang('te')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'te'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="తెలుగు (Telugu)"
              >
                🪔 తెలుగు
              </button>
              <button
                type="button"
                onClick={() => switchLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'en'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="English"
              >
                🌐 English
              </button>
              <button
                type="button"
                onClick={() => switchLang('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'hi'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिंदी (Hindi)"
              >
                🇮🇳 हिंदी
              </button>
            </div>

            <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
            <OfflineIndicator />
          </div>
        </div>

        {/* Multi-step progress bar */}
        <StepProgress />

        {/* Page Title & Subtitle */}
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          {teluguTitle && <p className="text-sm sm:text-base text-emerald-800 font-semibold">{teluguTitle}</p>}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span>🏛️ RBI Key Fact Statement (KFS) & Fair Lending Compliance</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Offline On-Device AI • Multimodal Gemma 4 E4B • Hallucination Filter Guard
          </div>
        </footer>
      </div>

      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="min-h-screen bg-slate-50/80 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/30 py-3 sm:py-8 px-3 sm:px-6 lg:px-8 flex flex-col justify-between transition-colors">
      <div className={`mx-auto w-full ${maxWidthClass} rounded-3xl bg-white shadow-xl border border-slate-200/90 p-5 sm:p-8 md:p-10 flex-1 flex flex-col animate-fade-in`}>
        {/* Top Header Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 font-black text-slate-900 hover:text-emerald-700 transition"
              title="Ardham Home"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">అర్థం</span>
              <span className="text-sm font-bold text-slate-500 hidden sm:inline">Ardham</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 bg-slate-100/90 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              <span>👤 {user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : (lang === 'en' ? 'Sign In' : lang === 'hi' ? 'साइन इन' : 'సైన్ ఇన్')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Real-time Language Switcher Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchLang('te')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
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
                className={`px-3 py-1.5 rounded-lg transition-all ${
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
                className={`px-3 py-1.5 rounded-lg transition-all ${
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
          </div>
        </div>

        {/* Multi-step progress bar */}
        <StepProgress />

        {/* Page Title & Subtitle with smooth typography */}
        <header className="mb-6 flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {teluguTitle && (
            <p className="text-sm sm:text-base text-emerald-800 font-bold leading-normal">
              {teluguTitle}
            </p>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer: Clean and minimal compliance notice without redundant badges */}
        <footer className="mt-8 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>🏛️ RBI Key Fact Statement (KFS) & Fair Lending Verification</span>
          </div>
          <div className="text-xs text-slate-400">
            {lang === 'en'
              ? 'Multi-dialect Oral Verification Engine'
              : lang === 'hi'
              ? 'मौखिक समझ एवं निष्पक्ष ऋण सत्यापन'
              : 'గ్రామీణ రుణ అవగాహన & సమ్మతి ధృవీకరణ వేదిక'}
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

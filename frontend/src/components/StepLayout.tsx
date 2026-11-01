import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GlobalAudioBar from './GlobalAudioBar'
import StepProgress from './StepProgress'
import VoiceAssistantModal from './VoiceAssistantModal'
import SettingsModal from './SettingsModal'
import VideoGuideModal from './VideoGuideModal'
import { stopSpeaking, getLanguage, setLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'

export type SubtitleProp = { te: string; en: string; hi?: string } | string

export default function StepLayout({
  title,
  subtitle,
  teluguTitle,
  children,
  maxWidthClass = 'max-w-6xl',
}: {
  title: string
  subtitle?: SubtitleProp
  teluguTitle?: string
  children: ReactNode
  maxWidthClass?: string
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
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

  // Determine subtitle text based on active language
  let activeSubtitle = ''
  if (subtitle) {
    if (typeof subtitle === 'string') {
      activeSubtitle = subtitle
    } else {
      activeSubtitle = lang === 'en' ? subtitle.en : lang === 'hi' ? (subtitle.hi || subtitle.en) : subtitle.te
    }
  } else if (teluguTitle) {
    // Legacy fallback: only show in Telugu mode
    if (lang === 'te') {
      activeSubtitle = teluguTitle
    }
  }

  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-slate-50/80 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/30 py-3 sm:py-8 px-3 sm:px-6 lg:px-8 flex flex-col justify-between transition-colors">
      <div className={`mx-auto w-full ${maxWidthClass} rounded-3xl bg-white shadow-xl border border-slate-200/90 p-5 sm:p-8 md:p-10 flex-1 flex flex-col animate-fade-in`}>
        {/* Top Header Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4">
          {/* Top Left: Brand and Back Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isHome && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition active:scale-95"
                title={lang === 'en' ? 'Go to previous step' : lang === 'hi' ? 'पिछले चरण पर जाएं' : 'మునుపటి పేజీకి వెళ్లండి'}
              >
                <span>←</span>
                <span>{lang === 'en' ? 'Go Back' : lang === 'hi' ? 'पीछे जाएं' : 'వెనుకకు'}</span>
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-2 font-black text-slate-900 hover:text-emerald-700 transition"
              title="Ardham Home"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
                {lang === 'en' ? 'Ardham' : lang === 'hi' ? 'अर्थम' : 'అర్థం'}
              </span>
              {lang !== 'en' && <span className="text-base font-bold text-slate-600 hidden sm:inline">Ardham</span>}
            </Link>
          </div>

          {/* Top Right: Buttons (Video Demo, Language, Audio, Settings, Account Profile) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            {/* 1. Watch AI Demo Video Button */}
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95"
              title={lang === 'en' ? 'Watch Multimodal Gemma 4 AI Video Guide' : 'AI వీడియో గైడ్ చూడండి'}
            >
              <span>🎬</span>
              <span className="hidden sm:inline">
                {lang === 'en' ? 'AI Video Demo' : lang === 'hi' ? 'एआई वीडियो डेमो' : 'AI వీడియో డెమో'}
              </span>
            </button>

            {/* 2. Compact Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
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
                తెలుగు
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
                English
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
                हिंदी
              </button>
            </div>

            {/* 3. Global Voice Audio Controls */}
            <GlobalAudioBar onOpenSettings={() => setShowSettingsModal(true)} />

            {/* 4. Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95"
              title={lang === 'en' ? 'Platform Settings, Profile & Navigation' : 'ప్లాట్‌ఫామ్ సెట్టింగ్స్'}
            >
              <span>⚙️</span>
              <span className="hidden md:inline">{lang === 'en' ? 'Settings' : 'సెట్టింగ్స్'}</span>
            </button>

            {/* 5. Account Profile Button */}
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 px-3.5 py-1.5 rounded-xl shadow-sm transition active:scale-95"
              title="Account Profile / Role"
            >
              <span>👤</span>
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {user ? `${user.name} (${user.role === 'officer' ? (lang === 'en' ? 'Officer' : lang === 'hi' ? 'अधिकारी' : 'అధికారి') : (lang === 'en' ? 'Borrower' : lang === 'hi' ? 'उधारकर्ता' : 'రుణగ్రహీత')})` : (lang === 'en' ? 'Sign In' : lang === 'hi' ? 'साइन इन' : 'సైన్ ఇన్')}
              </span>
            </Link>
          </div>
        </div>

        {/* Multi-step progress bar */}
        <StepProgress />

        {/* Page Title & Subtitle with smooth typography */}
        <header className="mb-6 flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {activeSubtitle && (
            <p className="text-sm sm:text-base text-emerald-800 font-bold leading-normal">
              {activeSubtitle}
            </p>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
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

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenVideoGuide={() => {
          setShowSettingsModal(false)
          setShowVideoModal(true)
        }}
      />

      {/* Multimodal Video Guide Modal */}
      <VideoGuideModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  )
}

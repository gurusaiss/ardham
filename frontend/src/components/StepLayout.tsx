import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GlobalAudioBar from './GlobalAudioBar'
import StepProgress from './StepProgress'
import VoiceAssistantModal from './VoiceAssistantModal'
import SettingsModal from './SettingsModal'
import VideoGuideModal from './VideoGuideModal'
import VoiceAvatarMode from './VoiceAvatarMode'
import VoiceAgentWidget from './VoiceAgentWidget'
import { stopSpeaking, getLanguage, setLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { subscribeVoiceCommands } from '../lib/voiceCommander'
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
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())
  const [lang, setLangState] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeAuth(setUser)
  }, [])

  useEffect(() => {
    return subscribeLanguage(setLangState)
  }, [])

  // Hands-free voice command routing across all steps
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'back' && location.pathname !== '/') {
        navigate(-1)
      } else if (action === 'avatar') {
        setShowAvatarModal(true)
      } else if (action === 'screen') {
        setShowAvatarModal(false)
      }
    })
    return () => unsubCmd()
  }, [location.pathname, navigate])

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

  function cycleLanguage() {
    stopSpeaking()
    const nextLang: AppLanguage = lang === 'te' ? 'en' : lang === 'en' ? 'hi' : 'te'
    setLanguage(nextLang)
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
        <div className="mb-5 flex items-center justify-between gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4">
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

          {/* Top Right: Clean Minimal Icon Controls (Audio Speaker, Language, Settings, Profile) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 1. Small Audio Speaker Icon Button */}
            <GlobalAudioBar />

            {/* 2. Small Language Icon Button */}
            <button
              type="button"
              onClick={cycleLanguage}
              className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition active:scale-95"
              title={
                lang === 'te'
                  ? 'ప్రస్తుత భాష: తెలుగు (క్లిక్ చేసి ఇంగ్లీష్ లేదా హిందీకి మార్చండి)'
                  : lang === 'hi'
                  ? 'वर्तमान भाषा: हिंदी (बदलने के लिए क्लिक करें)'
                  : 'Current Language: English (Click to toggle)'
              }
            >
              <span className="text-base">🌐</span>
              <span className="uppercase text-[11px] font-extrabold text-emerald-800 tracking-wider">
                {lang}
              </span>
            </button>

            {/* 3. Settings Icon Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition active:scale-95"
              title={lang === 'en' ? 'Platform Settings, Profile & Navigation' : 'ప్లాట్‌ఫామ్ సెట్టింగ్స్'}
              aria-label="Open settings"
            >
              <span className="text-base select-none">⚙️</span>
            </button>

            {/* 4. Account Profile Button */}
            <Link
              to="/auth"
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition active:scale-95"
              title="Account Profile / Role"
            >
              <span className="text-base">👤</span>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {user ? user.name.split(' ')[0] : (lang === 'en' ? 'Sign In' : lang === 'hi' ? 'साइन इन' : 'సైన్ ఇన్')}
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
            <span>🏛️ {lang === 'en' ? 'Official Bank Rules & Fair Lending Verification' : lang === 'hi' ? 'आधिकारिक बैंक नियम एवं निष्पक्ष ऋण सत्यापन' : 'అధికారిక బ్యాంక్ నిబంధనలు & న్యాయమైన రుణ ధృవీకరణ'}</span>
          </div>
          <div className="text-xs text-slate-400">
            {lang === 'en'
              ? 'Voice Verification & Safety Engine'
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
        onOpenAvatar={() => setShowAvatarModal(true)}
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenVideoGuide={() => {
          setShowSettingsModal(false)
          setShowVideoModal(true)
        }}
        onOpenAvatar={() => {
          setShowSettingsModal(false)
          setShowAvatarModal(true)
        }}
      />

      {/* Multimodal Video Guide Modal */}
      <VideoGuideModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />

      {/* Floating Hands-Free Voice Agent Status Widget */}
      <VoiceAgentWidget onOpenAvatar={() => setShowAvatarModal(true)} />

      {/* Autonomous AI Avatar Mode (100% Hands-Free for Blind Users) */}
      <VoiceAvatarMode
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  )
}

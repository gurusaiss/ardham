import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from './OfflineIndicator'
import GlobalAudioBar from './GlobalAudioBar'
import StepProgress from './StepProgress'
import VoiceAssistantModal from './VoiceAssistantModal'
import { stopSpeaking } from '../lib/speech'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'

export default function StepLayout({
  title,
  teluguTitle,
  children,
}: {
  title: string
  teluguTitle?: string
  children: ReactNode
}) {
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())

  useEffect(() => {
    return subscribeAuth(setUser)
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

  return (
    <div className="min-h-screen bg-slate-100/70 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/40 py-3 sm:py-8 px-2 sm:px-4 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white sm:shadow-xl sm:border sm:border-slate-200/80 p-4 sm:p-7 flex-1 flex flex-col animate-fade-in">
        {/* Top Header Bar */}
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1 font-bold text-slate-900 hover:text-emerald-700 transition"
              title="Home"
            >
              <span className="text-base">అర్థం</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                Gemma 4
              </span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/auth"
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700"
            >
              <span>👤 {user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : 'Sign In'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
            <OfflineIndicator />
          </div>
        </div>

        {/* Multi-step progress bar */}
        <StepProgress />

        {/* Page Title & Subtitle */}
        <header className="mb-5 flex flex-col gap-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          {teluguTitle && <p className="text-xs sm:text-sm text-emerald-800 font-bold">{teluguTitle}</p>}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-100 pt-3 text-[11px] text-slate-400 text-center flex items-center justify-between">
          <span>🏛️ RBI Key Fact Statement Compliance</span>
          <span>Sample data fictional • Edge AI Gemma 4</span>
        </footer>
      </div>

      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from './OfflineIndicator'
import GlobalAudioBar from './GlobalAudioBar'
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      {/* Top User Bar */}
      <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500 border-b pb-2">
        <Link
          to="/auth"
          className="flex items-center gap-1.5 hover:text-emerald-700 font-medium"
        >
          <span>👤</span>
          <span>{user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : 'Sign In / Demo Login'}</span>
        </Link>
        <Link to="/auth" className="text-slate-400 hover:text-slate-600 underline">
          {user ? 'Switch' : 'Login'}
        </Link>
      </div>

      <header className="mb-5 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {teluguTitle && <p className="text-xs text-slate-500 font-medium">{teluguTitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
          <OfflineIndicator />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-8 border-t pt-3 text-xs text-slate-400">
        Ardham assists the field officer. It is not legal or financial advice. All sample
        data shown is fictional.
      </footer>

      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

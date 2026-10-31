import { useState, useEffect, type ReactNode } from 'react'
import OfflineIndicator from './OfflineIndicator'
import GlobalAudioBar from './GlobalAudioBar'
import VoiceAssistantModal from './VoiceAssistantModal'
import { stopSpeaking } from '../lib/speech'

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {teluguTitle && <p className="text-sm text-slate-500">{teluguTitle}</p>}
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

import { useState, useEffect } from 'react'
import {
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
} from '../lib/speech'

interface Props {
  onOpenSettings?: () => void
}

export default function GlobalAudioBar({ onOpenSettings }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(isVoiceAssistantEnabled())

  useEffect(() => {
    const unsub = subscribeSpeaking((s) => setSpeaking(s))
    return unsub
  }, [])

  function toggleVoice() {
    const next = !enabled
    setEnabled(next)
    setVoiceAssistantEnabled(next)
    if (!next) {
      stopSpeaking()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {speaking ? (
        <button
          onClick={() => stopSpeaking()}
          className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow animate-pulse hover:bg-red-700 active:scale-95 transition"
          title="ఆడియో వెంటనే ఆపడానికి ఇక్కడ నొక్కండి (Press to Stop Audio)"
          aria-label="Stop audio readout"
        >
          <span className="h-2 w-2 rounded-full bg-white"></span>
          <span>⏹️ ఆడియో ఆపు (Stop)</span>
        </button>
      ) : (
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition ${
            enabled
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
          title="వాయిస్ అసిస్టెంట్ మోడ్ మార్చండి"
        >
          <span>{enabled ? '🎙️ వాయిస్: ఆన్' : '🔇 వాయిస్: ఆఫ్'}</span>
        </button>
      )}

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="rounded-full p-1 text-slate-400 hover:text-slate-600"
          title="వాయిస్ సెట్టింగ్స్"
          aria-label="Voice settings"
        >
          ⚙️
        </button>
      )}
    </div>
  )
}

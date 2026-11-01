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
          className="flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition"
          title="ఆడియో వెంటనే ఆపడానికి ఇక్కడ నొక్కండి (Press to Stop Audio)"
          aria-label="Stop audio readout"
        >
          <div className="flex items-center gap-0.5 text-white h-3">
            <span className="sound-bar h-2"></span>
            <span className="sound-bar h-3"></span>
            <span className="sound-bar h-1"></span>
            <span className="sound-bar h-2.5"></span>
          </div>
          <span>⏹️ ఆడియో ఆపు</span>
        </button>
      ) : (
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition ${
            enabled
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="వాయిస్ అసిస్టెంట్ మోడ్ మార్చండి"
        >
          <span>{enabled ? '🎙️ వాయిస్: ఆన్' : '🔇 సైలెంట్'}</span>
        </button>
      )}

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="భాష & వాయిస్ సెట్టింగ్స్"
          aria-label="Voice settings"
        >
          ⚙️
        </button>
      )}
    </div>
  )
}

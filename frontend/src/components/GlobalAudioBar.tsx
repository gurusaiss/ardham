import { useState, useEffect } from 'react'
import {
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
} from '../lib/speech'

export default function GlobalAudioBar() {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(isVoiceAssistantEnabled())

  useEffect(() => {
    const unsubSpeaking = subscribeSpeaking((s) => setSpeaking(s))
    return () => unsubSpeaking()
  }, [])

  function toggleVoice() {
    if (speaking) {
      stopSpeaking()
      return
    }
    const next = !enabled
    setEnabled(next)
    setVoiceAssistantEnabled(next)
    if (!next) {
      stopSpeaking()
    }
  }

  return (
    <button
      type="button"
      onClick={toggleVoice}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 shadow-sm ${
        speaking
          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
          : enabled
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600'
      }`}
      title={
        speaking
          ? 'Stop Speaking (ఆడియో ఆపండి)'
          : enabled
          ? 'Voice Assistant ON — Click to Mute (వాయిస్ ఆన్)'
          : 'Voice Assistant Muted — Click to Enable (వాయిస్ ఆఫ్)'
      }
      aria-label="Audio speaker assistant toggle"
    >
      <span className="text-base select-none">
        {speaking ? '⏹️' : enabled ? '🔊' : '🔇'}
      </span>
    </button>
  )
}

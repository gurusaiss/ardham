import { useState, useEffect } from 'react'
import {
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
  getSpeechRate,
  setSpeechRate,
} from '../lib/speech'

interface Props {
  onOpenSettings?: () => void
}

export default function GlobalAudioBar({ onOpenSettings }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(isVoiceAssistantEnabled())
  const [rate, setRate] = useState(getSpeechRate())

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

  function cycleSpeed() {
    let next = 1.0
    if (rate === 0.9 || rate === 1.0) next = 1.2
    else if (rate >= 1.2) next = 0.8
    else next = 1.0
    setRate(next)
    setSpeechRate(next)
  }

  const speedLabel = rate <= 0.85 ? '🐢 0.8x' : rate >= 1.15 ? '🚀 1.2x' : '⚡ 1.0x'

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {speaking ? (
        <button
          onClick={() => stopSpeaking()}
          className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition"
          title="ఆడియో వెంటనే ఆపడానికి ఇక్కడ నొక్కండి (Press to Stop Audio)"
          aria-label="Stop audio readout"
        >
          <div className="flex items-center gap-0.5 text-white h-3">
            <span className="sound-bar h-2"></span>
            <span className="sound-bar h-3"></span>
            <span className="sound-bar h-1"></span>
            <span className="sound-bar h-2.5"></span>
          </div>
          <span>⏹️ ఆపు</span>
        </button>
      ) : (
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold border transition ${
            enabled
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="వాయిస్ అసిస్టెంట్ మోడ్ మార్చండి"
        >
          <span>{enabled ? '🎙️ వాయిస్' : '🔇 సైలెంట్'}</span>
        </button>
      )}

      {/* 1-click speech speed toggle */}
      <button
        onClick={cycleSpeed}
        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
        title="వాయిస్ వేగం మార్చండి (Slow / Normal / Fast for Elderly)"
      >
        {speedLabel}
      </button>

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="భాష & వాయిస్ సెట్టింగ్స్"
          aria-label="Voice settings"
        >
          ⚙️
        </button>
      )}
    </div>
  )
}

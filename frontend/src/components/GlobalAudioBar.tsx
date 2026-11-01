import { useState, useEffect } from 'react'
import {
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'

interface Props {
  onOpenSettings?: () => void
}

export default function GlobalAudioBar({ onOpenSettings }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(isVoiceAssistantEnabled())
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    const unsubSpeaking = subscribeSpeaking((s) => setSpeaking(s))
    const unsubLang = subscribeLanguage(setLang)
    return () => {
      unsubSpeaking()
      unsubLang()
    }
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
          type="button"
          onClick={() => stopSpeaking()}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition"
          title="ఆడియో వెంటనే ఆపడానికి ఇక్కడ నొక్కండి (Stop Audio)"
          aria-label="Stop audio readout"
        >
          <div className="flex items-center gap-1 text-white h-3">
            <span className="sound-bar h-2"></span>
            <span className="sound-bar h-3.5"></span>
            <span className="sound-bar h-1.5"></span>
            <span className="sound-bar h-2.5"></span>
          </div>
          <span>⏹️ {lang === 'en' ? 'Stop' : lang === 'hi' ? 'रोकें' : 'ఆపు'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
            enabled
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title={lang === 'te' ? 'వాయిస్ అసిస్టెంట్ ఆన్ లేదా ఆఫ్ చేయండి' : 'Toggle Voice Assistant ON/OFF'}
        >
          <span>
            {enabled
              ? lang === 'en'
                ? '🎙️ Voice ON'
                : lang === 'hi'
                ? '🎙️ वॉइस ON'
                : '🎙️ వాయిస్ ON'
              : lang === 'en'
              ? '🔇 Silent'
              : lang === 'hi'
              ? '🔇 मूक'
              : '🔇 సైలెంట్'}
          </span>
        </button>
      )}

      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-xl p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          title={lang === 'te' ? 'భాష & వాయిస్ సెట్టింగ్స్' : 'Language & Voice Settings'}
          aria-label="Voice settings"
        >
          ⚙️
        </button>
      )}
    </div>
  )
}

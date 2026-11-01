import { useState, useEffect } from 'react'
import {
  stopSpeaking,
  subscribeSpeaking,
  isVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
  getSpeechRate,
  setSpeechRate,
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
  const [rate, setRate] = useState(getSpeechRate())
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

  function cycleSpeed() {
    let next = 1.0
    if (rate <= 0.85) next = 1.0
    else if (rate >= 1.15) next = 0.8
    else next = 1.2
    setRate(next)
    setSpeechRate(next)
  }

  const speedPrefix = lang === 'te' ? 'వేగం' : lang === 'hi' ? 'गति' : 'Speed'
  const speedLabel = rate <= 0.85 ? `🐢 ${speedPrefix}: 0.8x` : rate >= 1.15 ? `🚀 ${speedPrefix}: 1.2x` : `⚡ ${speedPrefix}: 1.0x`
  const speedTooltip = lang === 'te' 
    ? 'వాయిస్ చదివే వేగం మార్చండి: 0.8x (నెమ్మదిగా), 1.0x (సాధారణం), 1.2x (వేగంగా)' 
    : lang === 'hi'
    ? 'आवाज़ की गति बदलें: 0.8x (धीमी), 1.0x (सामान्य), 1.2x (तेज़)'
    : 'Change voice reading speed: 0.8x (Slow for elderly), 1.0x (Normal), 1.2x (Fast)'

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
          <span>{enabled ? (lang === 'en' ? '🎙️ Voice ON' : lang === 'hi' ? '🎙️ वॉइस ON' : '🎙️ వాయిస్ ON') : (lang === 'en' ? '🔇 Silent' : lang === 'hi' ? '🔇 मूक' : '🔇 సైలెంట్')}</span>
        </button>
      )}

      {/* Clear Speech Speed Button with understandable label */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-sm"
        title={speedTooltip}
      >
        {speedLabel}
      </button>

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

import { useState, useEffect } from 'react'
import {
  isVoiceAssistantEnabled,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
  subscribeSpeaking,
} from '../lib/speech'
import {
  subscribeTranscript,
  startVoiceCommander,
  stopVoiceCommander,
} from '../lib/voiceCommander'

interface Props {
  onOpenAvatar: () => void
}

export default function VoiceAgentWidget({ onOpenAvatar }: Props) {
  const [enabled, setEnabled] = useState(isVoiceAssistantEnabled())
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const unsubLang = subscribeLanguage(setLang)
    const unsubSpeaking = subscribeSpeaking(setSpeaking)
    const unsubTranscript = subscribeTranscript((text) => setTranscript(text))

    if (enabled) {
      startVoiceCommander()
    } else {
      stopVoiceCommander()
    }

    return () => {
      unsubLang()
      unsubSpeaking()
      unsubTranscript()
    }
  }, [enabled])

  // Periodic check for enabled state
  useEffect(() => {
    const interval = setInterval(() => {
      const current = isVoiceAssistantEnabled()
      if (current !== enabled) {
        setEnabled(current)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [enabled])

  if (!enabled) return null

  return (
    <aside aria-label="AI Voice Agent controls" className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 animate-fade-in select-none">
      {/* Transcript Popover if speaking/transcript detected */}
      {transcript && !collapsed && (
        <div className="max-w-xs rounded-2xl bg-slate-900/95 border border-emerald-500/50 p-3 shadow-2xl text-xs text-white backdrop-blur-md animate-slide-up">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{lang === 'en' ? 'Voice Recognized:' : 'వాయిస్ గుర్తించబడింది:'}</span>
          </div>
          <p className="font-semibold text-slate-100 italic">"{transcript}"</p>
        </div>
      )}

      {/* Main Floating Voice Widget Pill */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/80 p-2 sm:p-2.5 shadow-2xl backdrop-blur-md text-white">
        {/* Pulsing Mic Indicator */}
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            speaking
              ? 'bg-emerald-500 text-slate-950 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
          title={speaking ? 'AI Speaking' : 'Listening for Voice Commands'}
        >
          <span className="text-sm font-bold">{speaking ? '🔊' : '🎙️'}</span>
        </div>

        {!collapsed && (
          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
              <span>{lang === 'en' ? 'Hands-Free AI Agent' : 'చేతులతో తాకని AI ఏజెంట్'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                Active
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {lang === 'en' ? 'Say: "Next", "Back", "Repeat"' : 'చెప్పండి: "Next", "Back", "Repeat"'}
            </span>
          </div>
        )}

        {/* Button to Open Fullscreen AI Avatar */}
        <button
          type="button"
          onClick={onOpenAvatar}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-1.5 shadow-md active:scale-95 transition"
          title={lang === 'en' ? 'Open Full-Screen AI Avatar (Voice Only)' : 'AI అవతార్ మోడ్ ఓపెన్ చేయండి'}
        >
          <span>👩‍💼</span>
          <span className="hidden sm:inline">{lang === 'en' ? 'AI Avatar' : 'అవతార్'}</span>
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
          title={collapsed ? 'Expand' : 'Minimize'}
        >
          {collapsed ? '◀' : '✕'}
        </button>
      </div>
    </aside>
  )
}

import { useEffect, useState, useRef } from 'react'
import {
  hasAnsweredVoiceModal,
  setVoiceAssistantEnabled,
  speakOnboardingPrompt,
  stopSpeaking,
} from '../lib/speech'

interface Props {
  isOpen?: boolean
  onClose?: () => void
}

export default function VoiceAssistantModal({ isOpen: forceOpen, onClose }: Props) {
  const [show, setShow] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (forceOpen !== undefined) {
      setShow(forceOpen)
      if (forceOpen) startPrompt()
      return
    }

    if (!hasAnsweredVoiceModal()) {
      setShow(true)
      // Slight delay so browser user interaction / audio context is ready
      const timer = setTimeout(() => {
        startPrompt()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [forceOpen])

  function startPrompt() {
    speakOnboardingPrompt(() => {
      // After speech finishes, try speech recognition for spoken "Yes" or "No"
      startVoiceListening()
    })
  }

  function startVoiceListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'te-IN' // Understand Telugu, but also handles English words

      recognition.onstart = () => setListening(true)
      recognition.onend = () => setListening(false)

      recognition.onresult = (event: any) => {
        const transcript = (event.results?.[0]?.[0]?.transcript || '').trim().toLowerCase()
        if (
          transcript.includes('yes') ||
          transcript.includes('యెస్') ||
          transcript.includes('అవును') ||
          transcript.includes('హా') ||
          transcript.includes('haan')
        ) {
          handleChoice(true)
        } else if (
          transcript.includes('no') ||
          transcript.includes('వద్దు') ||
          transcript.includes('నహీ') ||
          transcript.includes('లేదు')
        ) {
          handleChoice(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      // Speech recognition not supported or mic blocked
    }
  }

  function handleChoice(enabled: boolean) {
    stopSpeaking()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setVoiceAssistantEnabled(enabled)
    setShow(false)
    onClose?.()
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-emerald-500 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🎙️
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          వాయిస్ అసిస్టెంట్ కావాలా?
        </h2>
        <p className="mt-1 text-base font-medium text-emerald-700">
          Do you need Voice Assistance?
        </p>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          అంధులు, దృష్టి లోపం ఉన్నవారు లేదా చదవలేని వారు సులభంగా లోన్ వివరాలు వినడానికి వాయిస్ అసిస్టెంట్ సహాయపడుతుంది.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Full voice guidance for visually impaired borrowers & low-literacy users.
        </p>

        {listening && (
          <div className="my-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-amber-600"></span>
            వాయిస్ వింటున్నాం... "YES" లేదా "NO" అని చెప్పండి
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            autoFocus
            onClick={() => handleChoice(true)}
            className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>🎙️ YES — వాయిస్ అసిస్టెంట్ కావాలి (Voice ON)</span>
          </button>

          <button
            onClick={() => handleChoice(false)}
            className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>🔇 NO — వద్దు / సైలెంట్ మోడ్ (Normal / Silent)</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => stopSpeaking()}
            className="text-red-500 hover:underline font-medium"
          >
            ⏹️ ఆడియో ఆపు (Stop Sound)
          </button>
          <span>మీరు ఎప్పుడైనా సెట్టింగ్స్ లో మార్చుకోవచ్చు</span>
        </div>
      </div>
    </div>
  )
}

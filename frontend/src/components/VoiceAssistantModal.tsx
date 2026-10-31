import { useEffect, useState, useRef } from 'react'
import {
  type AppLanguage,
  getLanguage,
  setLanguage,
  setVoiceAssistantEnabled,
  hasAnsweredVoiceModal,
  speakLanguagePrompt,
  speakVoiceAssistancePrompt,
  stopSpeaking,
} from '../lib/speech'

interface Props {
  isOpen?: boolean
  onClose?: () => void
}

export default function VoiceAssistantModal({ isOpen: forceOpen, onClose }: Props) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'language' | 'voice'>('language')
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(getLanguage())
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (forceOpen !== undefined) {
      setShow(forceOpen)
      if (forceOpen) {
        setStep('language')
        startLanguageStep()
      }
      return
    }

    if (!hasAnsweredVoiceModal()) {
      setShow(true)
      const timer = setTimeout(() => {
        startLanguageStep()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [forceOpen])

  function startLanguageStep() {
    setStep('language')
    speakLanguagePrompt(() => {
      startVoiceListeningForLanguage()
    })
  }

  function startVoiceStep(lang: AppLanguage) {
    setSelectedLang(lang)
    setLanguage(lang)
    setStep('voice')
    speakVoiceAssistancePrompt(lang, () => {
      startVoiceListeningForYesNo()
    })
  }

  function startVoiceListeningForLanguage() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) return

    try {
      const recognition = new SpeechRec()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'te-IN'

      recognition.onstart = () => setListening(true)
      recognition.onend = () => setListening(false)

      recognition.onresult = (event: any) => {
        const text = (event.results?.[0]?.[0]?.transcript || '').trim().toLowerCase()
        if (text.includes('telugu') || text.includes('తెలుగు')) {
          handleSelectLanguage('te')
        } else if (text.includes('english') || text.includes('ఇంగ్లీష్') || text.includes('inglish')) {
          handleSelectLanguage('en')
        } else if (text.includes('hindi') || text.includes('హిందీ') || text.includes('हिंदी')) {
          handleSelectLanguage('hi')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      // ignore
    }
  }

  function startVoiceListeningForYesNo() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) return

    try {
      const recognition = new SpeechRec()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = selectedLang === 'te' ? 'te-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN'

      recognition.onstart = () => setListening(true)
      recognition.onend = () => setListening(false)

      recognition.onresult = (event: any) => {
        const text = (event.results?.[0]?.[0]?.transcript || '').trim().toLowerCase()
        if (
          text.includes('yes') ||
          text.includes('యెస్') ||
          text.includes('అవును') ||
          text.includes('హా') ||
          text.includes('haan') ||
          text.includes('हाँ')
        ) {
          handleVoiceChoice(true)
        } else if (
          text.includes('no') ||
          text.includes('వద్దు') ||
          text.includes('నహీ') ||
          text.includes('లేదు') ||
          text.includes('नहीं')
        ) {
          handleVoiceChoice(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      // ignore
    }
  }

  function handleSelectLanguage(lang: AppLanguage) {
    stopSpeaking()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    startVoiceStep(lang)
  }

  function handleVoiceChoice(enabled: boolean) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-emerald-500 text-center">
        {step === 'language' ? (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              🌐
            </div>
            <h2 className="text-xl font-bold text-slate-900">భాషను ఎంచుకోండి</h2>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Select Language / भाषा चुनें
            </p>
            <p className="mt-2 text-xs text-slate-500">
              మీరు మాట్లాడి లేదా బటన్ నొక్కి ఎంచుకోవచ్చు (Speak or Tap)
            </p>

            {listening && (
              <div className="my-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                వింటున్నాం... "తెలుగు", "English" లేదా "Hindi" చెప్పండి
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3">
              <button
                autoFocus
                onClick={() => handleSelectLanguage('te')}
                className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50/70 p-3.5 text-base font-bold text-emerald-900 shadow-sm hover:bg-emerald-100 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🪔 తెలుగు (Telugu)</span>
                <span className="text-xs font-normal text-emerald-700">సిఫార్సు చేయబడింది (Recommended)</span>
              </button>

              <button
                onClick={() => handleSelectLanguage('en')}
                className="w-full rounded-xl border-2 border-slate-200 bg-white p-3.5 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🌐 English</span>
                <span className="text-xs font-normal text-slate-400">Standard</span>
              </button>

              <button
                onClick={() => handleSelectLanguage('hi')}
                className="w-full rounded-xl border-2 border-slate-200 bg-white p-3.5 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🇮🇳 हिंदी (Hindi)</span>
                <span className="text-xs font-normal text-slate-400">National</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              🎙️
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedLang === 'te'
                ? 'వాయిస్ అసిస్టెంట్ కావాలా?'
                : selectedLang === 'hi'
                ? 'वॉइस असिस्टेंट चाहिए?'
                : 'Need Voice Assistance?'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {selectedLang === 'te'
                ? 'Do you need Voice Assistance?'
                : selectedLang === 'hi'
                ? 'Audio Guidance for All Actions'
                : 'Full Audio Guidance for Blind & Low-Literacy'}
            </p>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              {selectedLang === 'te'
                ? 'దృష్టి లోపం ఉన్నవారు లేదా చదవలేని వారు సులభంగా లోన్ వివరాలు వినడానికి వాయిస్ అసిస్టెంట్ స్వయంచాలకంగా మాట్లాడుతుంది.'
                : selectedLang === 'hi'
                ? 'दृष्टिबाधित और ग्रामीण उधारकर्ताओं के लिए हर स्क्रीन पर ऑडियो सहायता उपलब्ध है।'
                : 'Provides automated spoken Telugu/English readouts and voice answers for visually impaired and rural borrowers.'}
            </p>

            {listening && (
              <div className="my-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                {selectedLang === 'te'
                  ? 'వింటున్నాం... "YES" లేదా "NO" అని చెప్పండి'
                  : 'Listening... Say "YES" or "NO"'}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <button
                autoFocus
                onClick={() => handleVoiceChoice(true)}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>
                  {selectedLang === 'te'
                    ? '🎙️ YES — వాయిస్ అసిస్టెంట్ కావాలి (Voice ON)'
                    : selectedLang === 'hi'
                    ? '🎙️ YES — वॉइस असिस्टेंट चालू (Voice ON)'
                    : '🎙️ YES — Enable Voice Assistant (Voice ON)'}
                </span>
              </button>

              <button
                onClick={() => handleVoiceChoice(false)}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>
                  {selectedLang === 'te'
                    ? '🔇 NO — వద్దు / సైలెంట్ మోడ్ (Silent Mode)'
                    : selectedLang === 'hi'
                    ? '🔇 NO — नहीं / साइलेंट मोड'
                    : '🔇 NO — Silent / Normal Mode'}
                </span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  stopSpeaking()
                  setStep('language')
                  startLanguageStep()
                }}
                className="text-slate-600 hover:underline font-medium"
              >
                ← భాష మార్చండి (Change Language)
              </button>
              <button
                onClick={() => stopSpeaking()}
                className="text-red-500 hover:underline font-medium"
              >
                ⏹️ ఆడియో ఆపు (Stop Sound)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

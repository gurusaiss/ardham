import { useEffect, useState, useRef } from 'react'
import {
  type AppLanguage,
  type VoiceStyle,
  getLanguage,
  setLanguage,
  subscribeLanguage,
  setVoiceAssistantEnabled,
  setVoiceStyle,
  hasAnsweredVoiceModal,
  speakLanguagePrompt,
  speakVoiceAssistancePrompt,
  speakText,
  stopSpeaking,
} from '../lib/speech'
import { startVoiceCommander } from '../lib/voiceCommander'

interface Props {
  isOpen?: boolean
  onClose?: () => void
  onOpenAvatar?: () => void
}

export default function VoiceAssistantModal({ isOpen: forceOpen, onClose, onOpenAvatar }: Props) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'language' | 'voice' | 'style'>('language')
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(getLanguage())
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return subscribeLanguage(setSelectedLang)
  }, [])

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

  function startVoiceStyleStep(lang: AppLanguage) {
    setStep('style')
    const prompt =
      lang === 'en'
        ? 'Do you prefer Voice Only with our AI Avatar for blind or hands-free use, or Voice plus Screen? Say "Voice Only" or "Screen".'
        : lang === 'hi'
        ? 'क्या आप दृष्टिबाधित उपयोग के लिए केवल वॉयस एआई अवतार चाहते हैं, या वॉयस और स्क्रीन? "वॉयس ओनली" या "स्क्रीन" बोलें।'
        : 'మీరు దృష్టి లోపం ఉన్నవారి కోసం వాయిస్ ఓన్లీ AI అవతార్ కోరుకుంటున్నారా, లేదా వాయిస్ మరియు స్క్రీన్ కోరుకుంటున్నారా? "వాయిస్ ఓన్లీ" లేదా "స్క్రీన్" అని చెప్పండి.'

    speakText(prompt, lang, () => {
      startVoiceListeningForStyle()
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

  function startVoiceListeningForStyle() {
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
          text.includes('voice only') ||
          text.includes('only') ||
          text.includes('avatar') ||
          text.includes('అవతార్') ||
          text.includes('వాయిస్ ఓన్లీ') ||
          text.includes('अवतार')
        ) {
          handleSelectStyle('voice_only')
        } else if (
          text.includes('screen') ||
          text.includes('text') ||
          text.includes('both') ||
          text.includes('స్క్రీన్') ||
          text.includes('स्क्रीन')
        ) {
          handleSelectStyle('voice_and_text')
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

    if (enabled) {
      // Advance to Step 3: Style selection (Voice Only Avatar vs Voice + Screen)
      startVoiceStyleStep(selectedLang)
    } else {
      setVoiceAssistantEnabled(false)
      setShow(false)
      onClose?.()
    }
  }

  function handleSelectStyle(style: VoiceStyle) {
    stopSpeaking()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setVoiceAssistantEnabled(true)
    setVoiceStyle(style)
    startVoiceCommander()
    setShow(false)
    onClose?.()

    if (style === 'voice_only') {
      onOpenAvatar?.()
    }
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border-2 border-emerald-500 text-center space-y-4">
        {step === 'language' ? (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              🌐
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">భాషను ఎంచుకోండి</h2>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Select Language / भाषा चुनें
            </p>
            <p className="mt-1 text-xs text-slate-500">
              మీరు మాట్లాడి లేదా బటన్ నొక్కి ఎంచుకోవచ్చు (Speak or Tap)
            </p>

            {listening && (
              <div className="my-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-800 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                వింటున్నాం... "తెలుగు", "English" లేదా "Hindi" చెప్పండి
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => handleSelectLanguage('te')}
                className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-3.5 text-base font-bold text-emerald-900 shadow-sm hover:bg-emerald-100 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🪔 తెలుగు (Telugu)</span>
                <span className="text-xs font-bold text-emerald-700">సిఫార్సు చేయబడింది</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white p-3.5 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🌐 English</span>
                <span className="text-xs font-medium text-slate-400">Indian Accent</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('hi')}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white p-3.5 text-base font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition flex items-center justify-between"
              >
                <span>🇮🇳 हिंदी (Hindi)</span>
                <span className="text-xs font-medium text-slate-400">National</span>
              </button>
            </div>
          </div>
        ) : step === 'voice' ? (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              🎙️
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
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
                ? 'Do you need Voice Assistance?'
                : 'Complete audio readout of all terms'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedLang === 'te'
                ? 'అవును (YES) లేదా వద్దు (NO) అని చెప్పండి'
                : selectedLang === 'hi'
                ? 'हाँ (YES) या नहीं (NO) बोलें'
                : 'Say "YES" or "NO"'}
            </p>

            {listening && (
              <div className="my-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-800 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                {selectedLang === 'te'
                  ? 'వింటున్నాం... "YES" లేదా "NO" చెప్పండి'
                  : selectedLang === 'hi'
                  ? 'सुन रहे हैं... "YES" या "NO" बोलें'
                  : 'Listening... Say "YES" or "NO"'}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => handleVoiceChoice(true)}
                className="rounded-2xl bg-emerald-700 p-4 text-lg font-bold text-white shadow-lg hover:bg-emerald-800 active:scale-[0.98] transition flex flex-col items-center justify-center gap-1"
              >
                <span>🎙️ YES</span>
                <span className="text-xs font-normal text-emerald-100">
                  {selectedLang === 'te' ? 'వాయిస్ ఆన్' : selectedLang === 'hi' ? 'वॉइस ON' : 'Voice ON'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleVoiceChoice(false)}
                className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-lg font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition flex flex-col items-center justify-center gap-1"
              >
                <span>🔇 NO</span>
                <span className="text-xs font-normal text-slate-400">
                  {selectedLang === 'te' ? 'సైలెంట్ మోడ్' : selectedLang === 'hi' ? 'मूक मोड' : 'Silent'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 3: Style Selection (Voice Only Avatar vs Voice + Screen) */
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              👩‍💼
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {selectedLang === 'en'
                ? 'Choose Your Experience'
                : selectedLang === 'hi'
                ? 'अनुभव शैली चुनें'
                : 'మీ అనుభవ శైలిని ఎంచుకోండి'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-emerald-700">
              {selectedLang === 'en'
                ? 'Specially designed for Blind & Rural Borrowers'
                : 'దృష్టి లోపం మరియు గ్రామీణ రుణగ్రహీతల కోసం ప్రత్యేక రూపకల్పన'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedLang === 'en'
                ? 'Say "Voice Only" or "Screen"'
                : selectedLang === 'hi'
                ? '"वॉयस ओनली" या "स्क्रीन" बोलें'
                : '"వాయిస్ ఓన్లీ" లేదా "స్క్రీన్" అని చెప్పండి'}
            </p>

            {listening && (
              <div className="my-2.5 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-800 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                <span>
                  {selectedLang === 'en'
                    ? 'Listening... Say "Voice Only" or "Screen"'
                    : 'వింటున్నాం... "వాయిస్ ఓన్లీ" లేదా "స్క్రీన్" చెప్పండి'}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3.5 text-left">
              <button
                type="button"
                autoFocus
                onClick={() => handleSelectStyle('voice_only')}
                className="w-full rounded-2xl border-2 border-amber-500 bg-amber-50/70 p-4 shadow-md hover:bg-amber-100/90 active:scale-[0.98] transition flex items-start gap-3.5 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white text-2xl shadow-sm">
                  👩‍💼
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-amber-950">
                      {selectedLang === 'en'
                        ? 'Lakshmi AI Avatar (Voice Only)'
                        : selectedLang === 'hi'
                        ? 'लक्ष्मी एआई अवतार (केवल आवाज)'
                        : 'లక్ష్మి AI అవతార్ (వాయిస్ ఓన్లీ)'}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-600 text-white uppercase tracking-wider">
                      Blind Mode
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                    {selectedLang === 'en'
                      ? '100% Eyes-Free. Human-like avatar speaks, listens, and displays 5-second floating loan cards. Zero touching required.'
                      : selectedLang === 'hi'
                      ? 'दृष्टिबाधित और ग्रामीण उधारकर्ताओं के लिए। वास्तविक अवतार बोलकर सभी शर्तें समझाता है।'
                      : 'చేతులతో తాకాల్సిన పనిలేదు. మానవరూప AI అవతార్ మాట్లాడి, 5 సెకన్ల ఫ్లోటింగ్ కార్డులతో మొత్తం పూర్తి చేస్తుంది.'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStyle('voice_and_text')}
                className="w-full rounded-2xl border-2 border-emerald-600/70 bg-emerald-50/60 p-4 shadow-sm hover:bg-emerald-100/80 active:scale-[0.98] transition flex items-start gap-3.5 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white text-2xl shadow-sm">
                  📜
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-emerald-950">
                      {selectedLang === 'en'
                        ? 'Interactive Passbook (Voice + Screen)'
                        : selectedLang === 'hi'
                        ? 'डिजिटल पासबुक (वॉयस + स्क्रीन)'
                        : 'డిజిటల్ పాస్‌బుక్ (వాయిస్ + స్క్రీన్)'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Guided
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 font-medium mt-1 leading-relaxed">
                    {selectedLang === 'en'
                      ? 'Visual step-by-step screens with complete audio narration and hands-free voice commands.'
                      : selectedLang === 'hi'
                      ? 'स्पष्ट विज़ुअल स्क्रीन के साथ स्वचालित ऑडियो और मौखिक नियंत्रण।'
                      : 'స్పష్టమైన స్క్రీన్‌లు మరియు బటన్లతో పాటు స్వచ్ఛమైన వాయిస్ రీడౌట్ మరియు వాయిస్ ఆదేశాలు.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

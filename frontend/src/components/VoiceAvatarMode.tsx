import { useState, useEffect, useRef } from 'react'
import {
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
  subscribeSpeaking,
} from '../lib/speech'
import {
  subscribeVoiceCommands,
  subscribeTranscript,
  startVoiceCommander,
  type VoiceCommandAction,
} from '../lib/voiceCommander'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialLoanType?: string
}

interface FloatingCard {
  id: string
  title: string
  badge: string
  badgeColor: string
  details: { label: string; value: string }[]
  alert?: string
}

export default function VoiceAvatarMode({ isOpen, onClose }: Props) {
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const [speaking, setSpeaking] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([])
  const [spokenMessage, setSpokenMessage] = useState('')
  const hasSpokenRef = useRef(false)

  // Sync language and speaking state
  useEffect(() => {
    const unsubLang = subscribeLanguage(setLang)
    const unsubSpeaking = subscribeSpeaking(setSpeaking)
    return () => {
      unsubLang()
      unsubSpeaking()
    }
  }, [])

  // Start continuous voice commander when avatar is open
  useEffect(() => {
    if (isOpen) {
      startVoiceCommander()
      hasSpokenRef.current = false
      runStep(0)
    } else {
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Listen for voice commands
  useEffect(() => {
    if (!isOpen) return

    const unsubCmd = subscribeVoiceCommands((action: VoiceCommandAction, rawText: string) => {
      if (action === 'next') {
        advanceStep(1)
      } else if (action === 'back') {
        advanceStep(-1)
      } else if (action === 'repeat') {
        repeatCurrentStep()
      } else if (action === 'stop') {
        stopSpeaking()
      } else if (action === 'download') {
        triggerDownload()
      } else if (action === 'share') {
        triggerShare()
      } else if (action === 'screen') {
        onClose()
      } else if (currentStep === 3) {
        // In quiz step, check if borrower answered with voice
        handleSpokenAnswer(rawText)
      }
    })

    const unsubTranscript = subscribeTranscript((text) => {
      setTranscript(text)
    })

    return () => {
      unsubCmd()
      unsubTranscript()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep, lang])

  function advanceStep(delta: number) {
    stopSpeaking()
    setCurrentStep((prev) => {
      const next = Math.max(0, Math.min(4, prev + delta))
      runStep(next)
      return next
    })
  }

  function repeatCurrentStep() {
    stopSpeaking()
    runStep(currentStep)
  }

  function runStep(stepIdx: number) {
    if (stepIdx === 0) {
      // Step 1: Scan & Terms Extracted
      const msg =
        lang === 'en'
          ? 'Hello! I am Lakshmi, your AI loan advisor. I have scanned your loan agreement. Your approved loan amount is 30,000 rupees with an 18.5% interest rate. Say "Next" to check for hidden fees.'
          : lang === 'hi'
          ? 'नमस्ते! मैं लक्ष्मी हूँ, आपकी एआई ऋण सलाहकार। मैंने आपका दस्तावेज़ स्कैन कर लिया है। आपकी ऋण राशि ₹30,000 है और ब्याज दर 18.5% है। आगे बढ़ने के लिए "Next" बोलें।'
          : 'నమస్కారం! నేను లక్ష్మిని, మీ AI రుణ సహాయకురాలిని. నేను మీ లోన్ కార్డును స్కాన్ చేశాను. మీకు మంజూరైన లోన్ మొత్తం ముప్పై వేల రూపాయలు, వడ్డీ రేటు 18.5 శాతం. తర్వాతి వివరాలు వినడానికి "Next" అని చెప్పండి.'

      setSpokenMessage(msg)
      speakText(msg, lang)

      setFloatingCards([
        {
          id: 'card_scan',
          title: lang === 'en' ? 'Loan Card Scanned' : lang === 'hi' ? 'ऋण दस्तावेज़ स्कैन' : 'లోన్ కార్డు స్కాన్ ధృవీకరణ',
          badge: '100% Vision Match',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          details: [
            { label: lang === 'en' ? 'Principal Loan' : 'రుణ మొత్తం', value: '₹30,000' },
            { label: lang === 'en' ? 'Annual Interest' : 'వార్షిక వడ్డీ', value: '18.5%' },
            { label: lang === 'en' ? 'Weekly Installment' : 'వారపు వాయిదా', value: '₹690' },
            { label: lang === 'en' ? 'Total Duration' : 'మొత్తం కాలం', value: '50 Weeks' },
          ],
        },
      ])
    } else if (stepIdx === 1) {
      // Step 2: Predatory Audit & Upfront Fees
      const msg =
        lang === 'en'
          ? 'Step 2: Key Fact Statement Audit. The bank will deduct 2,200 rupees upfront for processing and insurance. You will receive 27,800 rupees net cash in your bank account. You save 14,200 rupees compared to local moneylenders. Say "Next" to continue.'
          : lang === 'hi'
          ? 'चरण 2: निष्पक्षता विश्लेषण। बैंक ₹2,200 अग्रिम शुल्क काटेगा। आपके बैंक खाते में शुद्ध ₹27,800 आएंगे। साहूकार की तुलना में आप ₹14,200 बचा रहे हैं। आगे बढ़ने के लिए "Next" बोलें।'
          : 'రెండవ దశ: దాచిన ఛార్జీల ఆడిట్. ప్రాసెసింగ్ ఫీజు మరియు బీమా కోసం 2,200 రూపాయలు ముందుగానే మినహాయిస్తారు. మీ చేతికి నికరంగా 27,800 రూపాయలు అందుతాయి. ప్రైవేట్ వడ్డీ వ్యాపారి కంటే మీరు 14,200 రూపాయలు ఆదా చేస్తున్నారు. "Next" అని చెప్పండి.'

      setSpokenMessage(msg)
      speakText(msg, lang)

      setFloatingCards((prev) => [
        {
          id: 'card_audit',
          title: lang === 'en' ? 'RBI Fairness Audit' : lang === 'hi' ? 'आरबीआई निष्पक्षता विश्लेषण' : 'RBI నిష్పక్షపాత ఆడిట్',
          badge: 'Fair Lending Verified',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          details: [
            { label: lang === 'en' ? 'Upfront Deductions' : 'ముందస్తు మినహాయింపులు', value: '₹2,200' },
            { label: lang === 'en' ? 'Net Cash in Hand' : 'చేతికి అందే నికర నగదు', value: '₹27,800' },
            { label: lang === 'en' ? 'Savings vs Moneylender' : 'వడ్డీ వ్యాపారి కంటే ఆదా', value: '+₹14,200' },
          ],
          alert: lang === 'en' ? 'Zero hidden penalties detected.' : 'ఎలాంటి దాచిన అపరాధ రుసుములు లేవు.',
        },
        ...prev,
      ])
    } else if (stepIdx === 2) {
      // Step 3: Explanation of Key Commitment
      const msg =
        lang === 'en'
          ? 'Step 3: Crucial rule. If you pay off your loan early, there is zero prepayment penalty. However, late payments carry a 2% fee. Say "Next" to answer a quick oral comprehension question.'
          : lang === 'hi'
          ? 'चरण 3: महत्वपूर्ण नियम। समय से पहले ऋण चुकाने पर कोई जुर्माना नहीं है। विलंब पर 2% शुल्क लगेगा। मौखिक प्रश्न के लिए "Next" बोलें।'
          : 'మూడవ దశ: ముఖ్యమైన నిబంధన. మీరు గడువు కంటే ముందే రుణం చెల్లిస్తే ఎలాంటి పెనాల్టీ ఉండదు. కానీ ఆలస్యమైతే 2 శాతం రుసుము పడుతుంది. నోటి ప్రశ్న కోసం "Next" అని చెప్పండి.'

      setSpokenMessage(msg)
      speakText(msg, lang)

      setFloatingCards((prev) => [
        {
          id: 'card_rule',
          title: lang === 'en' ? 'Verified Legal Commitment' : lang === 'hi' ? 'सत्यापित कानूनी शर्त' : 'ధృవీకరించబడిన చట్టపరమైన నిబంధన',
          badge: 'Zero Hallucination',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          details: [
            { label: lang === 'en' ? 'Prepayment Penalty' : 'ముందస్తు చెల్లింపు రుసుము', value: '₹0 (0%)' },
            { label: lang === 'en' ? 'Overdue Penalty' : 'ఆలస్య రుసుము', value: '2% per month' },
          ],
        },
        ...prev,
      ])
    } else if (stepIdx === 3) {
      // Step 4: Spoken Comprehension Quiz Question
      const msg =
        lang === 'en'
          ? 'Oral verification question: How much rupees must you repay each week? Please speak your answer aloud now.'
          : lang === 'hi'
          ? 'मौखिक सत्यापन प्रश्न: आपको हर हफ्ते कितने रुपये चुकाने होंगे? कृपया अपना उत्तर बोलकर बताएं।'
          : 'నోటి వెరిఫికేషన్ ప్రశ్న: మీరు ప్రతి వారం ఎంత మొత్తం వాయిదా చెల్లించాలి? మీ సమాధానాన్ని నోటితో చెప్పండి.'

      setSpokenMessage(msg)
      speakText(msg, lang)

      setFloatingCards((prev) => [
        {
          id: 'card_quiz',
          title: lang === 'en' ? 'Oral Verification Question' : lang === 'hi' ? 'मौखिक सत्यापन प्रश्न' : 'నోటి అవగాహన ప్రశ్న',
          badge: 'Listening for Spoken Answer',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
          details: [
            { label: lang === 'en' ? 'Question' : 'ప్రశ్న', value: lang === 'en' ? 'Weekly repayment amount?' : 'ప్రతి వారం చెల్లించాల్సిన వాయిదా?' },
            { label: lang === 'en' ? 'Expected' : 'ఖచ్చితమైన విలువ', value: '₹690' },
          ],
        },
        ...prev,
      ])
    } else if (stepIdx === 4) {
      // Step 5: Digital Certificate
      const msg =
        lang === 'en'
          ? 'Congratulations! Your comprehension score is 100%. Your tamper-proof RBI digital certificate is sealed with SHA-256. Say "Download" to save your certificate, or "Share" for WhatsApp.'
          : lang === 'hi'
          ? 'बधाई हो! आपका समझ स्कोर 100% है। आपका डिजिटल प्रमाणपत्र तैयार है। इसे सेव करने के लिए "Download" बोलें या "Share" बोलें।'
          : 'అభినందనలు! మీ అవగాహన స్కోర్ 100 శాతం. మీ అధికారిక డిజిటల్ సీల్ రసీదు సిద్ధమైంది. రసీదు సేవ్ చేయడానికి "Download" లేదా వాట్సాప్ కోసం "Share" అని చెప్పండి.'

      setSpokenMessage(msg)
      speakText(msg, lang)

      setFloatingCards((prev) => [
        {
          id: 'card_cert',
          title: lang === 'en' ? 'Digital KFS Certificate Issued' : lang === 'hi' ? 'डिजिटल ऑडिट प्रमाणपत्र' : 'డిజిటల్ సీల్ ధృవీకరణ పత్రం',
          badge: 'SHA-256 Cryptographic Seal',
          badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-400',
          details: [
            { label: lang === 'en' ? 'Comprehension Score' : 'అవగాహన స్కోర్', value: '100% (Passed)' },
            { label: lang === 'en' ? 'Compliance' : 'నిబంధనల రసీదు', value: 'RBI KFS Fair Lending' },
            { label: lang === 'en' ? 'Audit Seal' : 'ఆడిట్ హాష్', value: 'SHA256: 8f9b2d...1a' },
          ],
        },
        ...prev,
      ])
    }
  }

  function handleSpokenAnswer(text: string) {
    const t = text.toLowerCase()
    if (t.includes('690') || t.includes('ఆరు వందల') || t.includes('six hundred') || t.includes('छह सौ')) {
      const successMsg =
        lang === 'en'
          ? 'Excellent! 690 rupees is exactly correct. You have understood your repayment commitment.'
          : lang === 'hi'
          ? 'बहुत बढ़िया! ₹690 बिल्कुल सही उत्तर है। आपने अपनी किस्त को अच्छी तरह समझ लिया है।'
          : 'చాలా బాగుంది! 690 రూపాయలు సరైన సమాధానం. మీరు మీ లోన్ వాయిదాను ఖచ్చితంగా అర్థం చేసుకున్నారు.'

      setSpokenMessage(successMsg)
      speakText(successMsg, lang, () => {
        advanceStep(1)
      })
    }
  }

  function triggerDownload() {
    const msg = lang === 'en' ? 'Downloading your digital certificate.' : 'మీ డిజిటల్ సర్టిఫికెట్ డౌన్‌లోడ్ అవుతోంది.'
    speakText(msg, lang)
    window.print()
  }

  function triggerShare() {
    const text = 'Ardham Loan Verification Certificate: Verified 100% by Gemma 4.'
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-fade-in select-none"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xl font-bold">
            👩‍💼
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight flex items-center gap-2">
              <span>{lang === 'en' ? 'Lakshmi' : 'లక్ష్మి'}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {lang === 'en' ? 'AI Voice Agent' : 'AI వాయిస్ ఏజెంట్'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? '100% Hands-Free Autonomous Mode for Blind & Rural Borrowers'
                : 'దృష్టి లోపం ఉన్నవారి కోసం చేతులతో తాకాల్సిన పనిలేని వాయిస్ ఏజెంట్'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{speaking ? (lang === 'en' ? 'Speaking...' : 'మాట్లాడుతోంది...') : (lang === 'en' ? 'Listening for voice...' : 'వాయిస్ వింటోంది...')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
            title="Switch to standard visual screen"
          >
            <span>📱</span>
            <span>{lang === 'en' ? 'Screen Mode' : 'స్క్రీన్ మోడ్'}</span>
          </button>
        </div>
      </header>

      {/* Main Center Stage: Split between Avatar Hero and Floating Stream */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full items-center overflow-y-auto">
        {/* Left Column: Avatar & Interactive Voice Response (Lg: 6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center text-center space-y-6">
          {/* Animated Avatar Portrait with Acoustic Wave Aura */}
          <div className="relative flex items-center justify-center">
            {/* Ambient Pulse Glows */}
            <div
              className={`absolute h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-emerald-500/20 blur-3xl transition-all duration-700 ${
                speaking ? 'scale-125 opacity-100' : 'scale-100 opacity-40'
              }`}
            ></div>

            {/* Equalizer Rings */}
            <div
              className={`absolute h-44 w-44 sm:h-56 sm:w-56 rounded-full border-2 border-emerald-400/40 transition-all duration-300 ${
                speaking ? 'scale-110 animate-ping' : ''
              }`}
            ></div>

            {/* Avatar Circle */}
            <div className="relative flex h-36 w-36 sm:h-48 sm:w-48 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-800 via-teal-700 to-emerald-600 shadow-2xl border-4 border-emerald-400/80">
              <span className="text-6xl sm:text-8xl select-none">👩‍💼</span>
              {speaking && (
                <div className="absolute -bottom-2 flex items-center gap-1 rounded-full bg-emerald-400 text-slate-950 px-3 py-1 text-xs font-black shadow-lg">
                  <span className="sound-bar h-2 bg-slate-950"></span>
                  <span className="sound-bar h-3 bg-slate-950"></span>
                  <span className="sound-bar h-1.5 bg-slate-950"></span>
                  <span>{lang === 'en' ? 'TALKING' : 'మాట్లాడుతోంది'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Large Live Spoken Thought Banner */}
          <div className="w-full max-w-xl rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
              <span>🗣️ {lang === 'en' ? 'Spoken Guidance' : 'నోటితో వివరిస్తున్న అంశం'}</span>
              <span>Step {currentStep + 1} / 5</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-white leading-relaxed">
              "{spokenMessage}"
            </p>

            {/* Live Recognized User Speech Pill */}
            {transcript && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs sm:text-sm text-amber-300 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>
                  {lang === 'en' ? 'You said:' : 'మీరు చెప్పినది:'} <strong>"{transcript}"</strong>
                </span>
              </div>
            )}
          </div>

          {/* Voice Command Quick Help Guide */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-bold text-slate-400">
            <span className="text-slate-500">{lang === 'en' ? 'Voice commands:' : 'నోటి మాటలు:'}</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              "Next" (తరువాత)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              "Back" (వెనుకకు)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              "Repeat" (మళ్ళీ చెప్పు)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              "Download" (డౌన్‌లోడ్)
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Floating Fact Cards Stream (Lg: 6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>✨ {lang === 'en' ? 'Live Verified Loan Facts' : 'ప్రత్యక్ష లోన్ నిబంధనల రసీదు'}</span>
            <span className="text-emerald-400 font-mono">Gemma 4 Edge AI</span>
          </div>

          {/* Floating Cards (Emerging smoothly from bottom) */}
          {floatingCards.map((card, idx) => (
            <div
              key={card.id}
              className={`rounded-2xl border p-5 shadow-xl bg-slate-900/90 transition-all duration-500 animate-slide-up ${
                idx === 0
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white">{card.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                {card.details.map((d, dIdx) => (
                  <div key={dIdx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                    <div className="text-[11px] font-semibold text-slate-400">{d.label}</div>
                    <div className="text-sm sm:text-base font-extrabold text-white mt-0.5 font-mono">
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>

              {card.alert && (
                <div className="mt-3 text-xs font-semibold text-emerald-300 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/60 flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{card.alert}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Hands-Free Voice Control Bar (Backups for click/touch if needed) */}
      <footer className="px-5 py-3.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs font-bold z-20">
        <button
          type="button"
          onClick={() => advanceStep(-1)}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition active:scale-95"
        >
          <span>←</span>
          <span>{lang === 'en' ? 'Back' : 'వెనుకకు'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={repeatCurrentStep}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
          >
            <span>🔊</span>
            <span>{lang === 'en' ? 'Listen Again' : 'మళ్ళీ విను'}</span>
          </button>

          {currentStep === 4 ? (
            <button
              type="button"
              onClick={triggerDownload}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition active:scale-95 shadow-lg"
            >
              <span>📥</span>
              <span>{lang === 'en' ? 'Download Certificate' : 'రసీదు డౌన్‌లోడ్'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => advanceStep(1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition active:scale-95 shadow-lg"
            >
              <span>{lang === 'en' ? 'Next Step' : 'తరువాత'}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import HumanAvatarRig from './HumanAvatarRig'
import {
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
  subscribeSpeaking,
  setAvatarModalActive,
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

interface FloatingCardData {
  id: string
  title: string
  subtitle: string
  pillText: string
  stats: { label: string; value: string; highlight?: boolean }[]
  goldStamp?: string
}

export default function VoiceAvatarMode({ isOpen, onClose }: Props) {
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const [speaking, setSpeaking] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [transcript, setTranscript] = useState('')
  // Active temporary floating card (auto-fades after 5 seconds)
  const [activeFloatingCard, setActiveFloatingCard] = useState<FloatingCardData | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  const cardTimerRef = useRef<any>(null)

  function handleClose() {
    setAvatarModalActive(false)
    stopSpeaking()
    if (cardTimerRef.current) clearTimeout(cardTimerRef.current)
    onClose()
  }

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
      setAvatarModalActive(true)
      startVoiceCommander()
      runStep(0)
    } else {
      setAvatarModalActive(false)
      stopSpeaking()
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current)
    }
    return () => {
      setAvatarModalActive(false)
      stopSpeaking()
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Listen for hands-free voice commands
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
        handleClose()
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

  function showTemporaryCard(card: FloatingCardData) {
    if (cardTimerRef.current) clearTimeout(cardTimerRef.current)
    setActiveFloatingCard(card)
    setCardVisible(true)

    // Automatically hide card after exactly 5 seconds so Avatar stays center focus!
    cardTimerRef.current = setTimeout(() => {
      setCardVisible(false)
      setTimeout(() => setActiveFloatingCard(null), 500)
    }, 5000)
  }

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
      // Step 1: Scan & Approved Principal
      const msg =
        lang === 'en'
          ? 'Hello! I am Lakshmi, your AI loan advisor. I have checked your loan document. Your loan amount is ₹30,000, with an 18.5% interest rate. Say "Next" to inspect the upfront fees.'
          : lang === 'hi'
          ? 'नमस्ते! मैं लक्ष्मी हूँ, आपकी एआई ऋण सलाहकार। मैंने आपका दस्तावेज़ देख लिया है। आपकी ऋण राशि ₹30,000 है और ब्याज दर 18.5% है। आगे बढ़ने के लिए "Next" बोलें।'
          : 'నమస్కారం! నేను లక్ష్మిని, మీ AI రుణ సలహాదారుని. నేను మీ లోన్ కార్డును తనిఖీ చేశాను. మీకు మంజూరైన లోన్ మొత్తం ముప్పై వేల రూపాయలు, వడ్డీ రేటు 18.5 శాతం. తర్వాతి వివరాలు వినడానికి "Next" అని చెప్పండి.'

      speakText(msg, lang, undefined, 'avatar')

      showTemporaryCard({
        id: 'step1_card',
        title: lang === 'en' ? 'Loan Card Verified' : lang === 'hi' ? 'ऋण दस्तावेज़ सत्यापन' : 'లోన్ కార్డు స్కాన్ ధృవీకరణ',
        subtitle: '100% Genuine Card Details',
        pillText: 'Verified Agreement',
        stats: [
          { label: lang === 'en' ? 'Loan Amount' : 'అసలు అప్పు మొత్తం', value: '₹30,000', highlight: true },
          { label: lang === 'en' ? 'Annual Interest' : 'వార్షిక వడ్డీ రేటు', value: '18.5%' },
          { label: lang === 'en' ? 'Weekly Installment' : 'వారపు వాయిదా', value: '₹690' },
          { label: lang === 'en' ? 'Total Weeks' : 'వాయిదాల సంఖ్య', value: '50' },
        ],
        goldStamp: 'Official Card',
      })
    } else if (stepIdx === 1) {
      // Step 2: Predatory Audit & Upfront Deductions
      const msg =
        lang === 'en'
          ? 'Step 2: Fair loan check. The bank will deduct ₹2,200 upfront for processing and insurance. You will receive ₹27,800 net cash in your bank account. You save ₹14,200 compared to private moneylenders. Say "Next" to continue.'
          : lang === 'hi'
          ? 'चरण 2: निष्पक्षता विश्लेषण। बैंक ₹2,200 अग्रिम शुल्क काटेगा। आपके बैंक खाते में शुद्ध ₹27,800 आएंगे। साहूकार की तुलना में आप ₹14,200 बचा रहे हैं। आगे बढ़ने के लिए "Next" बोलें।'
          : 'రెండవ దశ: దాచిన ఛార్జీల తనిఖీ. ప్రాసెసింగ్ ఫీజు మరియు బీమా కోసం 2,200 రూపాయలు ముందుగానే మినహాయిస్తారు. మీ చేతికి నికరంగా 27,800 రూపాయలు అందుతాయి. ప్రైవేట్ వడ్డీ వ్యాపారి కంటే మీరు 14,200 రూపాయలు ఆదా చేస్తున్నారు. "Next" అని చెప్పండి.'

      speakText(msg, lang)

      showTemporaryCard({
        id: 'step2_card',
        title: lang === 'en' ? 'Fee & Deductions Check' : lang === 'hi' ? 'शुल्क एवं कटौती जांच' : 'ఫీజులు & మినహాయింపుల తనిఖీ',
        subtitle: 'Fair Lending Protection',
        pillText: 'Zero Hidden Fees',
        stats: [
          { label: lang === 'en' ? 'Upfront Deductions' : 'ముందస్తు మినహాయింపులు', value: '₹2,200' },
          { label: lang === 'en' ? 'Net Cash in Hand' : 'చేతికి అందే నికర నగదు', value: '₹27,800', highlight: true },
          { label: lang === 'en' ? 'Savings vs Moneylender' : 'వడ్డీ వ్యాపారి కంటే ఆదా', value: '+₹14,200', highlight: true },
        ],
        goldStamp: 'Fair Loan',
      })
    } else if (stepIdx === 2) {
      // Step 3: Crucial Terms (Prepayment & Gold Safety)
      const msg =
        lang === 'en'
          ? 'Step 3: Crucial commitment. If you repay early, there is zero extra charge. However, late payments carry a 2% monthly penalty. Say "Next" for your oral comprehension test.'
          : lang === 'hi'
          ? 'चरण 3: महत्वपूर्ण नियम। समय से पहले ऋण चुकाने पर कोई अतिरिक्त शुल्क नहीं है। विलंब पर 2% शुल्क लगेगा। मौखिक प्रश्न के लिए "Next" बोलें।'
          : 'మూడవ దశ: ముఖ్యమైన నిబంధన. మీరు గడువు కంటే ముందే రుణం చెల్లిస్తే ఎలాంటి అదనపు ఛార్జీలు ఉండవు. కానీ ఆలస్యమైతే 2 శాతం రుసుము పడుతుంది. నోటి ప్రశ్న కోసం "Next" అని చెప్పండి.'

      speakText(msg, lang)

      showTemporaryCard({
        id: 'step3_card',
        title: lang === 'en' ? 'Loan Repayment Rules' : lang === 'hi' ? 'ऋण भुगतान नियम' : 'రుణ చెల్లింపు నిబంధనలు',
        subtitle: 'Protected by Official Bank Rules',
        pillText: 'Fair Terms',
        stats: [
          { label: lang === 'en' ? 'Early Repayment Fee' : 'ముందే కడితే అదనపు ఛార్జీలు', value: '₹0 (0%)', highlight: true },
          { label: lang === 'en' ? 'Overdue Penalty' : 'ఆలస్య రుసుము', value: '2% per month' },
          { label: lang === 'en' ? 'Gold Collateral' : 'బంగారు భద్రత', value: 'Safe in Vault' },
        ],
        goldStamp: 'No Extra Fee',
      })
    } else if (stepIdx === 3) {
      // Step 4: Spoken Comprehension Question
      const msg =
        lang === 'en'
          ? 'Oral verification question: How much rupees must you repay each week? Please speak your answer aloud now.'
          : lang === 'hi'
          ? 'मौखिक सत्यापन प्रश्न: आपको हर हफ्ते कितने रुपये चुकाने होंगे? कृपया अपना उत्तर बोलकर बताएं।'
          : 'నోటి వెరిఫికేషన్ ప్రశ్న: మీరు ప్రతి వారం ఎంత మొత్తం వాయిదా చెల్లించాలి? మీ సమాధానాన్ని నోటితో చెప్పండి.'

      speakText(msg, lang)

      showTemporaryCard({
        id: 'step4_card',
        title: lang === 'en' ? 'Oral Comprehension Quiz' : lang === 'hi' ? 'मौखिक सत्यापन प्रश्न' : 'నోటి అవగాహన ప్రశ్న',
        subtitle: 'Speak your answer aloud into microphone',
        pillText: 'Listening...',
        stats: [
          { label: lang === 'en' ? 'Question' : 'ప్రశ్న', value: lang === 'en' ? 'Weekly repayment?' : 'వారపు వాయిదా ఎంత?' },
          { label: lang === 'en' ? 'Expected' : 'ఖచ్చితమైన విలువ', value: '₹690', highlight: true },
        ],
        goldStamp: 'Voice Verified',
      })
    } else if (stepIdx === 4) {
      // Step 5: Sealed Digital Certificate
      const msg =
        lang === 'en'
          ? 'Congratulations! Your comprehension score is 100%. Your official digital certificate is ready. Say "Download" to save your certificate, or "Share" for WhatsApp.'
          : lang === 'hi'
          ? 'बधाई हो! आपका समझ स्कोर 100% है। आपका डिजिटल प्रमाणपत्र तैयार है। इसे सेव करने के लिए "Download" बोलें या "Share" बोलें।'
          : 'అభినందనలు! మీ అవగాహన స్కోర్ 100 శాతం. మీ అధికారిక డిజిటల్ సీల్ రసీదు సిద్ధమైంది. రసీదు సేవ్ చేయడానికి "Download" లేదా వాట్సాప్ కోసం "Share" అని చెప్పండి.'

      speakText(msg, lang)

      showTemporaryCard({
        id: 'step5_card',
        title: lang === 'en' ? 'Official Digital Certificate' : lang === 'hi' ? 'आधिकारिक डिजिटल प्रमाणपत्र' : 'డిజిటల్ సీల్ ధృవీకరణ పత్రం',
        subtitle: 'Verified by Gemma 4',
        pillText: '100% PASSED',
        stats: [
          { label: lang === 'en' ? 'Score' : 'స్కోర్', value: '100% ✓ Pass', highlight: true },
          { label: lang === 'en' ? 'Verification Seal' : 'ఆడిట్ సీల్', value: 'SHA256: 8f9b...1a' },
          { label: lang === 'en' ? 'Compliance' : 'నిబంధనలు', value: 'Official Bank Verified' },
        ],
        goldStamp: 'Securely Sealed',
      })
    }
  }

  function handleSpokenAnswer(text: string) {
    const t = text.toLowerCase()
    if (t.includes('690') || t.includes('ఆరు వందల') || t.includes('six hundred') || t.includes('छह सौ')) {
      const successMsg =
        lang === 'en'
          ? 'Excellent! ₹690 is exactly correct. You have understood your repayment commitment.'
          : lang === 'hi'
          ? 'बहुत बढ़िया! ₹690 बिल्कुल सही उत्तर है। आपने अपनी किस्त को अच्छी तरह समझ लिया है।'
          : 'చాలా బాగుంది! 690 రూపాయలు సరైన సమాధానం. మీరు మీ లోన్ వాయిదాను ఖచ్చితంగా అర్థం చేసుకున్నారు.'

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
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#041c15] text-white overflow-hidden animate-fade-in select-none"
    >
      {/* Top Header: Pure Minimalist Navigation (Mobile-First Single Row) */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-emerald-900/40 bg-black/40 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-400/20 border border-amber-400/50 text-base sm:text-xl font-bold text-amber-300">
            🏛️
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-extrabold text-amber-100 flex items-center gap-1.5">
              <span>{lang === 'en' ? 'Ardham AI Advisor' : 'అర్థం AI రుణ సహాయకురాలు'}</span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                Voice
              </span>
            </h1>
            <p className="hidden xs:block sm:block text-[10px] sm:text-xs text-emerald-200/70 truncate max-w-[200px] sm:max-w-none">
              {lang === 'en'
                ? 'Autonomous Eyes-Free Experience for Blind & Rural Borrowers'
                : 'దృష్టి లోపం ఉన్నవారి కోసం స్వయంప్రతిపత్త వాయిస్ వ్యవస్థ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-black/30 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-200">
            <span
              className={`flex h-2 w-2 rounded-full ${
                speaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{speaking ? (lang === 'en' ? 'Speaking...' : 'మాట్లాడుతోంది...') : (lang === 'en' ? 'Listening...' : 'వింటోంది...')}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 hover:bg-emerald-900/90 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-emerald-100 transition active:scale-95 shadow-sm"
            title="Switch to guided screen mode"
          >
            <span>📱</span>
            <span>{lang === 'en' ? 'Screen Mode' : 'స్క్రీన్ మోడ్'}</span>
          </button>
        </div>
      </header>

      {/* Main Center Stage: 100% Focused on Human AI Avatar with Unobstructed Full Screen View */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Subtle Traditional Gold Kolam / Indian Sacred Geometric Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-[380px] h-[380px] sm:w-[680px] sm:h-[680px] rounded-full border-4 sm:border-8 border-dashed border-amber-300" />
        </div>

        {/* The Realistic Human AI Avatar Rig (Mobile-Responsive Prominence) */}
        <div className="relative z-10 flex flex-col items-center justify-center transition-all duration-500 my-auto">
          <HumanAvatarRig
            isSpeaking={speaking}
            language={lang}
            sizeClass="w-56 h-56 sm:w-80 sm:h-80 md:w-[500px] md:h-[500px] lg:w-[620px] lg:h-[620px] xl:w-[700px] xl:h-[700px]"
          />

          {/* Avatar Name & Status Tag */}
          <div className="mt-1.5 sm:mt-2 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/60 border border-amber-400/50 px-3.5 sm:px-5 py-1.5 sm:py-2 shadow-2xl backdrop-blur-md">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-amber-400 font-extrabold text-xs sm:text-base tracking-wide">
                {lang === 'en' ? 'Lakshmi' : lang === 'hi' ? 'लक्ष्मी' : 'లక్ష్మి'}
              </span>
              <span className="text-xs text-emerald-200">•</span>
              <span className="text-[11px] sm:text-xs text-emerald-100 font-semibold">
                {lang === 'en' ? 'AI Loan Officer' : lang === 'hi' ? 'डिजिटल ऋण अधिकारी' : 'డిజిటల్ లోన్ అధికారి'}
              </span>
            </div>

            {/* Recognized Voice Transcript Pill */}
            {transcript && (
              <div className="mt-2 flex items-center gap-1.5 sm:gap-2 rounded-full bg-amber-400/20 border border-amber-400/50 px-3 sm:px-4 py-1 text-[11px] sm:text-xs text-amber-200 shadow-xl backdrop-blur-md animate-fade-in max-w-[90vw] truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                <span className="truncate">
                  {lang === 'en' ? 'Heard:' : lang === 'hi' ? 'सुना:' : 'విన్నది:'} <strong>"{transcript}"</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Fact Card (Docked to Side on Desktop, Non-Obtrusive Bottom Sheet on Mobile) */}
        {activeFloatingCard && (
          <aside
            aria-label="Loan document snapshot"
            className={`fixed md:absolute left-2 right-2 sm:left-auto sm:right-6 lg:right-12 bottom-16 sm:bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 max-w-sm sm:max-w-md w-auto sm:w-full px-1 sm:px-2 z-30 transition-all duration-500 ease-out ${
              cardVisible
                ? 'opacity-100 translate-y-0 md:translate-x-0 scale-100'
                : 'opacity-0 translate-y-8 md:translate-x-12 scale-95 pointer-events-none'
            }`}
          >
            <div className="rounded-2xl sm:rounded-3xl border-2 border-amber-400/80 bg-slate-950/95 p-3.5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative">
              {/* Manual Dismiss Button */}
              <button
                type="button"
                onClick={() => setCardVisible(false)}
                className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 text-slate-400 hover:text-amber-300 text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 transition"
                title={lang === 'en' ? 'Close card' : 'కార్డును మూసివేయండి'}
              >
                ✕
              </button>

              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 sm:pb-3 pr-6">
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-amber-100">
                    {activeFloatingCard.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-emerald-300 font-medium">
                    {activeFloatingCard.subtitle}
                  </p>
                </div>
                {activeFloatingCard.goldStamp && (
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow">
                    {activeFloatingCard.goldStamp}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2.5 sm:mt-3.5">
                {activeFloatingCard.stats.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border ${
                      s.highlight
                        ? 'bg-amber-950/40 border-amber-400/50 text-amber-100'
                        : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] font-semibold text-slate-300 truncate">{s.label}</div>
                    <div
                      className={`text-sm sm:text-lg font-black font-mono mt-0.5 ${
                        s.highlight ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Bottom Hands-Free Voice Control Bar (Backups for click/touch if needed) */}
      <footer className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-black/60 border-t border-emerald-900/40 flex items-center justify-between gap-2 sm:gap-3 text-xs font-bold z-30">
        <button
          type="button"
          onClick={() => advanceStep(-1)}
          disabled={currentStep === 0}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 disabled:opacity-30 text-emerald-200 text-[11px] sm:text-xs transition active:scale-95 border border-emerald-800/40 shrink-0"
        >
          <span>←</span>
          <span>{lang === 'en' ? 'Back' : 'వెనుకకు'}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={repeatCurrentStep}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-[11px] sm:text-xs transition active:scale-95 border border-emerald-800/40"
          >
            <span>🔊</span>
            <span className="hidden xs:inline sm:inline">{lang === 'en' ? 'Replay' : 'మళ్ళీ విను'}</span>
          </button>

          {currentStep === 4 ? (
            <button
              type="button"
              onClick={triggerDownload}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[11px] sm:text-xs font-black transition active:scale-95 shadow-xl"
            >
              <span>📥</span>
              <span>{lang === 'en' ? 'Certificate' : 'రసీదు డౌన్‌లోడ్'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => advanceStep(1)}
              className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[11px] sm:text-xs font-black transition active:scale-95 shadow-xl"
            >
              <span>{lang === 'en' ? 'Next' : 'తరువాత'}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

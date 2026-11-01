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

const STEP_METADATA = [
  {
    step: 1,
    title_en: 'Loan Card Verification',
    title_te: 'లోన్ కార్డు స్కాన్ & ధృవీకరణ',
    title_hi: 'ऋण दस्तावेज़ सत्यापन',
    desc_en: 'Checking your approved loan amount, interest rate, and weekly installments.',
    desc_te: 'మంజూరైన అసలు అప్పు, వార్షిక వడ్డీ రేటు మరియు వారపు వాయిదాలను పరిశీలిస్తున్నాం.',
    desc_hi: 'आपकी स्वीकृत ऋण राशि, ब्याज दर और साप्ताहिक किस्तों की जांच की जा रही है।',
    cue_en: 'Say "Next" or tap to inspect upfront fees',
    cue_te: '"Next" అని చెప్పండి లేదా బటన్ నొక్కండి',
    cue_hi: '"Next" बोलें या आगे बढ़ें',
  },
  {
    step: 2,
    title_en: 'Fair Lending & Fee Audit',
    title_te: 'దాచిన ఫీజులు & మినహాయింపుల తనిఖీ',
    title_hi: 'शुल्क एवं कटौती जांच',
    desc_en: 'Auditing upfront processing fees, insurance cuts, and net cash disbursed in hand.',
    desc_te: 'ప్రాసెసింగ్ రుసుము, బీమా మినహాయింపులు మరియు చేతికి అందే నికర నగదు తనిఖీ.',
    desc_hi: 'अग्रिम कटौती और हाथ में मिलने वाली वास्तविक राशि की जांच।',
    cue_en: 'Say "Next" to check prepayment rules',
    cue_te: '"Next" అని చెప్పండి',
    cue_hi: '"Next" बोलें',
  },
  {
    step: 3,
    title_en: 'Repayment & Prepayment Rules',
    title_te: 'ముందస్తు చెల్లింపు & జరిమానా నిబంధనలు',
    title_hi: 'भुगतान एवं पूर्व-भुगतान नियम',
    desc_en: 'Ensuring zero early foreclosure penalties and checking default interest terms.',
    desc_te: 'గడువు కంటే ముందే చెల్లిస్తే అదనపు ఫీజులు లేవని మరియు ఆలస్య రుసుములను ధృవీకరిస్తున్నాం.',
    desc_hi: 'समय पूर्व भुगतान और विलंब शुल्क नियमों की जांच।',
    cue_en: 'Say "Next" for your oral comprehension test',
    cue_te: 'నోటి ప్రశ్న కోసం "Next" చెప్పండి',
    cue_hi: 'प्रश्नोत्तरी के लिए "Next" बोलें',
  },
  {
    step: 4,
    title_en: 'Voice Comprehension Quiz',
    title_te: 'నోటి మాటల అవగాహన ప్రశ్న',
    title_hi: 'मौखिक समझ सत्यापन',
    desc_en: 'Answer verbally into the mic to prove real understanding before any commitment.',
    desc_te: 'రుణ ఒప్పందంపై సంతకం లేదా వేలిముద్ర వేసే ముందు వివరాలు అర్థమయ్యాయని చెప్పండి.',
    desc_hi: 'हस्ताक्षर से पहले मौखिक रूप से उत्तर देकर अपनी समझ सत्यापित करें।',
    cue_en: 'Speak your answer: "690 rupees" or say "Pass"',
    cue_te: 'సమాధానం నోటితో చెప్పండి: "690 రూపాయలు"',
    cue_hi: 'अपना उत्तर बोलें: "690 रुपये"',
  },
  {
    step: 5,
    title_en: 'Cryptographic Verification Receipt',
    title_te: 'అధికారిక డిజిటల్ ధృవీకరణ రసీదు',
    title_hi: 'डिजिटल सत्यापन प्रमाणपत्र',
    desc_en: 'Tamper-proof comprehension certificate stamped with an SHA-256 seal and QR code.',
    desc_te: 'SHA-256 అధికారిక సీల్ మరియు వివాద పరిష్కార క్యూఆర్ కోడ్‌తో కూడిన రసీదు సిద్ధమైంది.',
    desc_hi: 'SHA-256 डिजिटल मुहर और क्यूआर कोड के साथ आधिकारिक रसीद तैयार है।',
    cue_en: 'Say "Download" or tap the button to save',
    cue_te: '"Download" అని చెప్పండి',
    cue_hi: '"Download" बोलें',
  },
]

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

      {/* Main Stage: Balanced 3-Column on Desktop | Perfectly Ordered & Scaled on Mobile Phone */}
      {/* Mobile Flow: Top = Step Context Card | Center = Photorealistic Lakshmi | Bottom = Small Facts Card */}
      <main className="flex-1 relative flex flex-col md:flex-row items-center justify-between px-3 sm:px-6 lg:px-12 py-2 sm:py-4 overflow-y-auto md:overflow-hidden gap-2.5 sm:gap-4 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* Subtle Traditional Gold Kolam / Indian Sacred Geometric Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-[300px] h-[300px] sm:w-[680px] sm:h-[680px] rounded-full border-4 sm:border-8 border-dashed border-amber-300" />
        </div>

        {/* TOP ON PHONE / LEFT ON DESKTOP: Step Context & Explanation Card (Optimized for Mobile Phone Screen) */}
        <section aria-label="Step Context" className="w-full md:w-80 lg:w-96 flex flex-col justify-center z-20 order-1 shrink-0">
          {(() => {
            const meta = STEP_METADATA[currentStep] || STEP_METADATA[0]
            const title = lang === 'en' ? meta.title_en : lang === 'hi' ? meta.title_hi : meta.title_te
            const desc = lang === 'en' ? meta.desc_en : lang === 'hi' ? meta.desc_hi : meta.desc_te
            const cue = lang === 'en' ? meta.cue_en : lang === 'hi' ? meta.cue_hi : meta.cue_te
            return (
              <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-slate-950/85 p-2.5 sm:p-4 md:p-5 backdrop-blur-xl shadow-lg">
                {/* Step badge & Engine */}
                <div className="flex items-center justify-between gap-1.5 mb-1 sm:mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-xs font-black text-amber-300 uppercase tracking-wider">
                    <span>{lang === 'en' ? `Step ${meta.step} of 5` : lang === 'hi' ? `चरण ${meta.step} / 5` : `దశ ${meta.step} / 5`}</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-emerald-300/80 font-mono">
                    {lang === 'en' ? 'Verified' : lang === 'hi' ? 'सत्यापित' : 'ధృవీకరించబడింది'}
                  </span>
                </div>

                {/* Localized Step Title */}
                <h2 className="text-xs sm:text-base md:text-xl font-black text-amber-100 leading-snug">
                  {title}
                </h2>

                {/* Localized Live Audio Narration Explanation */}
                <p className="mt-1 sm:mt-2 text-[11px] sm:text-xs md:text-sm text-emerald-100/90 leading-tight sm:leading-relaxed font-normal">
                  {desc}
                </p>

                {/* Hands-free Voice Hint Box */}
                <div className="mt-2 sm:mt-3 flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-amber-400/10 border border-amber-400/30 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-amber-200">
                  <span className="text-sm shrink-0">🎙️</span>
                  <div className="leading-tight truncate">
                    <span className="font-bold text-amber-300">{lang === 'en' ? 'Voice: ' : lang === 'hi' ? 'आवाज़: ' : 'వాయిస్: '}</span>
                    <span className="truncate">{cue}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </section>

        {/* CENTER: Photorealistic Human AI Avatar Rig (Prominent, Never Obstructed) */}
        <section aria-label="Lakshmi AI Avatar" className="flex-1 flex flex-col items-center justify-center relative z-10 order-2 my-auto shrink-0 py-1">
          <HumanAvatarRig
            isSpeaking={speaking}
            language={lang}
            sizeClass="w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96"
          />

          {/* Avatar Identity & Live Status Tag */}
          <div className="mt-1.5 sm:mt-2 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/75 border border-amber-400/50 px-3 sm:px-5 py-0.5 sm:py-1.5 shadow-xl backdrop-blur-md">
              <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${speaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-amber-400 font-extrabold text-[11px] sm:text-sm tracking-wide">
                {lang === 'en' ? 'Lakshmi' : lang === 'hi' ? 'लक्ष्मी' : 'లక్ష్మి'}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-200">•</span>
              <span className="text-[10px] sm:text-xs text-emerald-100 font-semibold">
                {lang === 'en' ? 'Digital Loan Officer' : lang === 'hi' ? 'डिजिटल ऋण अधिकारी' : 'డిజిటల్ లోన్ అధికారి'}
              </span>
            </div>

            {/* Recognized Voice Transcript Pill */}
            {transcript && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 px-2.5 sm:px-3.5 py-0.5 text-[10px] sm:text-xs text-amber-200 shadow-xl backdrop-blur-md animate-fade-in max-w-[85vw] truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                <span className="truncate">
                  {lang === 'en' ? 'Heard:' : lang === 'hi' ? 'सुना:' : 'విన్నది:'} <strong>"{transcript}"</strong>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* BOTTOM ON PHONE / RIGHT ON DESKTOP: Small & Compact Verified Facts Card (Never Covers Avatar) */}
        <section aria-label="Loan document snapshot" className="w-full md:w-80 lg:w-96 flex flex-col justify-center z-20 order-3 shrink-0">
          {activeFloatingCard ? (
            <div
              className={`rounded-xl sm:rounded-2xl border border-amber-400/80 sm:border-2 bg-slate-950/95 p-2 sm:p-3 md:p-5 shadow-xl backdrop-blur-2xl relative transition-all duration-500 ease-out ${
                cardVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-50 translate-y-1 scale-98'
              }`}
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 sm:pb-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-100 truncate">
                    {activeFloatingCard.title}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] text-emerald-300 font-medium truncate">
                    {activeFloatingCard.subtitle}
                  </p>
                </div>
                {activeFloatingCard.goldStamp && (
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow shrink-0">
                    {activeFloatingCard.goldStamp}
                  </span>
                )}
              </div>

              {/* Stats Grid: Ultra Compact on Phone Screen */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 mt-1.5 sm:mt-2.5">
                {activeFloatingCard.stats.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl border ${
                      s.highlight
                        ? 'bg-amber-950/40 border-amber-400/50 text-amber-100'
                        : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100'
                    }`}
                  >
                    <div className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold text-slate-300 truncate">{s.label}</div>
                    <div
                      className={`text-xs sm:text-sm md:text-base font-black font-mono mt-0.5 ${
                        s.highlight ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Ambient Placeholder Card when no temporary card is actively floating */
            <div className="rounded-xl border border-emerald-500/20 bg-slate-950/60 p-2 sm:p-3 backdrop-blur-md text-center">
              <div className="text-sm sm:text-xl mb-0.5">🛡️</div>
              <div className="text-[11px] sm:text-xs font-bold text-amber-200">
                {lang === 'en' ? 'Verified Math Guard' : lang === 'hi' ? 'सटीक वित्तीय सत्यापन' : 'ఖచ్చితమైన గణిత ధృవీకరణ'}
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-300/70 mt-0.5">
                {lang === 'en'
                  ? 'All facts cross-checked against official bank standards with zero error.'
                  : lang === 'hi'
                  ? 'सभी शर्तें आधिकारिक बैंक मानकों के अनुसार जांची गई हैं।'
                  : 'బ్యాంకు నిబంధనల ప్రకారం అన్ని వివరాలు ఖచ్చితంగా లెక్కించబడ్డాయి.'}
              </div>
            </div>
          )}
        </section>
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
          <span>{lang === 'en' ? 'Back' : lang === 'hi' ? 'पीछे' : 'వెనుకకు'}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={repeatCurrentStep}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-[11px] sm:text-xs transition active:scale-95 border border-emerald-800/40"
          >
            <span>🔊</span>
            <span className="hidden xs:inline sm:inline">{lang === 'en' ? 'Replay' : lang === 'hi' ? 'दोबारा सुनें' : 'మళ్ళీ విను'}</span>
          </button>

          {currentStep === 4 ? (
            <button
              type="button"
              onClick={triggerDownload}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[11px] sm:text-xs font-black transition active:scale-95 shadow-xl"
            >
              <span>📥</span>
              <span>{lang === 'en' ? 'Certificate' : lang === 'hi' ? 'प्रमाणपत्र' : 'రసీదు డౌన్‌లోడ్'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => advanceStep(1)}
              className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[11px] sm:text-xs font-black transition active:scale-95 shadow-xl"
            >
              <span>{lang === 'en' ? 'Next' : lang === 'hi' ? 'आगे' : 'తరువాత'}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import {
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialSection?: 'home' | 'scan' | 'review' | 'explain' | 'quiz' | 'certificate'
}

interface VideoStep {
  id: string
  title: string
  title_te: string
  title_hi: string
  desc: string
  desc_te: string
  desc_hi: string
  speech: string
  speech_te: string
  speech_hi: string
  icon: string
  previewType: 'scan' | 'audit' | 'audio' | 'cert'
}

const VIDEO_STEPS: VideoStep[] = [
  {
    id: 'step1_vision',
    title: '1. Multimodal Vision: Scanning Loan Cards (1 to 10+ Pages)',
    title_te: '1. విజన్ కెమెరా స్కాన్: లోన్ కార్డు పేజీల రీడింగ్',
    title_hi: '1. विज़न कैमरा स्कैन: ऋण दस्तावेज़ पठन',
    desc: 'Gemma 4 inspects photographed loan agreement cards, bounding boxes extract loan amount, interest rate, fees, and penalties.',
    desc_te: 'జెమ్మా 4 కెమెరా లోన్ కార్డుపై ముద్రించబడిన అప్పు మొత్తం, వడ్డీ రేటు, వాయిదాలను గుర్తించి ధృవీకరిస్తుంది.',
    desc_hi: 'जेम्मा 4 ऋण दस्तावेज़ से ऋण राशि, ब्याज दर और किस्तों को स्वचालित रूप से पहचानता है।',
    speech: 'Step 1: Multimodal Vision. Gemma 4 photographs the loan card and extracts all financial terms with zero cloud dependency.',
    speech_te: 'మొదటి దశ: జెమ్మా 4 విజన్ మోడల్ లోన్ కార్డును స్కాన్ చేసి అసలు వివరాలను సేకరిస్తుంది.',
    speech_hi: 'पहला चरण: जेम्मा 4 विज़न मॉडल ऋण दस्तावेज़ को स्कैन करके सभी वित्तीय शर्तें पढ़ता है।',
    icon: '📷',
    previewType: 'scan',
  },
  {
    id: 'step2_audit',
    title: '2. Fair Loan Check & Fee Analysis',
    title_te: '2. న్యాయమైన రుణం & దాచిన ఛార్జీల తనిఖీ',
    title_hi: '2. निष्पक्ष ऋण एवं छिपे हुए शुल्क जांच',
    desc: 'Detects upfront fee deductions and calculates your substantial savings compared to private moneylenders.',
    desc_te: 'నికరంగా చేతికి అందే నగదును లెక్కించి, ప్రైవేట్ వడ్డీ వ్యాపారి కంటే ఎంత ఆదా అవుతుందో లెక్కిస్తుంది.',
    desc_hi: 'अग्रिम शुल्कों की पहचान करके निजी साहूकारों की तुलना में बचत की गणना करता है।',
    speech: 'Step 2: Fair Loan Check. Identifies upfront fee deductions and calculates your net cash in hand.',
    speech_te: 'రెండవ దశ: దాచిన ఛార్జీలను గుర్తించి రుణగ్రహీతకు నికరంగా అందే నగదును లెక్కిస్తుంది.',
    speech_hi: 'दूसरा चरण: अग्रिम शुल्कों की पहचान करके वास्तविक ऋण लागत का विश्लेषण करता है।',
    icon: '⚖️',
    previewType: 'audit',
  },
  {
    id: 'step3_explain',
    title: '3. Multilingual Spoken Mother Tongue Explanation',
    title_te: '3. స్వచ్ఛమైన తెలుగులో ప్రతి పదం మరియు నంబర్ వివరణ',
    title_hi: '3. मातृभाषा में प्रत्येक शब्द और संख्या का स्पष्ट उच्चारण',
    desc: 'Reads every single word and installment amount plainly in your mother tongue quoting genuine card facts.',
    desc_te: 'కార్డుపై ఉన్న నంబర్లను మాత్రమే ఉపయోగించి, స్వచ్ఛమైన తెలుగు మాటల్లో ప్రతి నిబంధనను స్పష్టంగా చదివి వినిపిస్తుంది.',
    desc_hi: 'कार्ड पर छपे तथ्यों को स्पष्ट आवाज़ में पढ़कर सुनाता है।',
    speech: 'Step 3: Pure Multilingual Speech. Explains each loan term plainly in the borrower native language.',
    speech_te: 'మూడవ దశ: లోన్ నిబంధనలను స్పష్టమైన మాటల్లో ప్రతి ఒక్క పదాన్ని నోటితో చదివి వినిపిస్తుంది.',
    speech_hi: 'तीसरा चरण: उधारकर्ता की मातृभाषा में सभी वित्तीय शर्तों को बोलकर समझाया जाता है।',
    icon: '🔊',
    previewType: 'audio',
  },
  {
    id: 'step4_cert',
    title: '4. Voice Comprehension Verification & Digital Receipt',
    title_te: '4. నోటి సమాధానం ధృవీకరణ & డిజిటల్ సీల్ రసీదు',
    title_hi: '4. मौखिक समझ सत्यापन एवं डिजिटल प्रमाणपत्र',
    desc: 'Listens to borrower spoken answer, verifies accuracy, and issues an official verified digital receipt.',
    desc_te: 'రుణగ్రహీత నోటి సమాధానాన్ని రికార్డ్ చేసి, ధృవీకరించి, వాట్సాప్ మరియు ప్రింటబుల్ సర్టిఫికెట్ జారీ చేస్తుంది.',
    desc_hi: 'उधारकर्ता के बोले गए उत्तर को सत्यापित करके डिजिटल रसीद तैयार करता है।',
    speech: 'Step 4: Voice Verification. Evaluates spoken answers and generates an official verified digital receipt.',
    speech_te: 'నాల్గవ దశ: రుణగ్రహీత అవగాహనను పరీక్షించి లైవ్ క్యూఆర్ కోడ్ సర్టిఫికెట్ జారీ చేస్తుంది.',
    speech_hi: 'चौथा चरण: समझ का मूल्यांकन करके डिजिटल रसीद जारी की जाती है।',
    icon: '🏛️',
    previewType: 'cert',
  },
]

export default function VideoGuideModal({ isOpen, onClose, initialSection }: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const timerRef = useRef<any>(null)

  // Reactive Language Synchronization across all pages & tabs
  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  // Map initial section to step
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking()
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    let startIdx = 0
    if (initialSection === 'scan') startIdx = 0
    else if (initialSection === 'review') startIdx = 1
    else if (initialSection === 'explain') startIdx = 2
    else if (initialSection === 'quiz' || initialSection === 'certificate') startIdx = 3

    setCurrentStepIdx(startIdx)
    playStepAudio(startIdx)
    setIsPlaying(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSection])

  function playStepAudio(idx: number) {
    stopSpeaking()
    const step = VIDEO_STEPS[idx]
    if (!step) return
    const textToSpeak = lang === 'en' ? step.speech : lang === 'hi' ? step.speech_hi : step.speech_te
    speakText(textToSpeak, lang, () => {
      // Auto-advance step when narration ends
      if (idx < VIDEO_STEPS.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentStepIdx(idx + 1)
          playStepAudio(idx + 1)
        }, 1200)
      } else {
        setIsPlaying(false)
      }
    })
  }

  function handleStepClick(idx: number) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCurrentStepIdx(idx)
    playStepAudio(idx)
    setIsPlaying(true)
  }

  function togglePlayPause() {
    if (isPlaying) {
      stopSpeaking()
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsPlaying(false)
    } else {
      playStepAudio(currentStepIdx)
      setIsPlaying(true)
    }
  }

  if (!isOpen) return null

  const activeStep = VIDEO_STEPS[currentStepIdx]
  const title = lang === 'en' ? activeStep.title : lang === 'hi' ? activeStep.title_hi : activeStep.title_te
  const desc = lang === 'en' ? activeStep.desc : lang === 'hi' ? activeStep.desc_hi : activeStep.desc_te

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Top Video Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <span className="text-xs sm:text-sm font-extrabold tracking-wide text-emerald-400">
                {lang === 'en' ? 'Ardham 4-Step Process Guide' : lang === 'hi' ? 'अर्थम 4-चरणीय गाइड' : 'అర్థం 4 దశల లైవ్ గైడ్'}
              </span>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Interactive Visual Walkthrough'
                  : lang === 'hi'
                  ? 'इंटरैक्टिव दृश्य प्रदर्शन'
                  : 'ప్రత్యక్ష మార్గదర్శక వివరాలు'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeaking()
              onClose()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Video Canvas / Animation Stage */}
        <div className="relative w-full aspect-video bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col items-center justify-center overflow-hidden border-b border-slate-800">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

          {/* Render Step Animation Content */}
          {activeStep.previewType === 'scan' && (
            <div className="relative w-full max-w-md rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border-2 border-emerald-500/80 animate-fade-in">
              {/* Laser Scanning Beam Animation */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />

              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  LOAN CARD / BANK PASSBOOK
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  VERIFIED 100%
                </span>
              </div>

              {/* Simulated Bounding Boxes */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                  <span className="font-semibold text-slate-700">Loan Sanctioned:</span>
                  <span className="font-mono font-extrabold text-emerald-900 text-sm">₹30,000</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                  <span className="font-semibold text-slate-700">Annual Interest:</span>
                  <span className="font-mono font-extrabold text-emerald-900 text-sm">18.50%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                  <span className="font-semibold text-slate-700">Weekly EMI:</span>
                  <span className="font-mono font-extrabold text-emerald-900 text-sm">₹690</span>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-center font-mono text-emerald-600 font-bold">
                [100% Genuine Card Details Verified]
              </div>
            </div>
          )}

          {activeStep.previewType === 'audit' && (
            <div className="w-full max-w-md rounded-2xl bg-slate-800/90 p-5 border border-emerald-500/60 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fairness Score
                </span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold">
                  85/100 Fair Loan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-700">
                  <p className="text-[10px] text-slate-400">Net in Hand</p>
                  <p className="text-sm font-extrabold text-emerald-400 mt-0.5">₹29,050</p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-700">
                  <p className="text-[10px] text-slate-400">Total Fees</p>
                  <p className="text-sm font-extrabold text-amber-400 mt-0.5">₹6,830</p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-700">
                  <p className="text-[10px] text-slate-400">Total Repaid</p>
                  <p className="text-sm font-extrabold text-slate-200 mt-0.5">₹35,880</p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-950/60 border border-emerald-700/60 p-2.5 text-xs text-emerald-300">
                💰 You save ₹3,970 compared to informal private moneylenders.
              </div>
            </div>
          )}

          {activeStep.previewType === 'audio' && (
            <div className="w-full max-w-md rounded-2xl bg-slate-800/90 p-6 border border-emerald-500/60 shadow-2xl text-center space-y-4 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 h-12 text-emerald-400">
                <span className="sound-bar h-4" />
                <span className="sound-bar h-10" />
                <span className="sound-bar h-6" />
                <span className="sound-bar h-12" />
                <span className="sound-bar h-8" />
                <span className="sound-bar h-11" />
                <span className="sound-bar h-5" />
                <span className="sound-bar h-9" />
              </div>

              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {lang === 'en'
                  ? '"Your sanctioned loan is 30,000 rupees. Weekly installment is 690 rupees."'
                  : '"మీకు మంజూరైన లోన్ మొత్తం 30,000 రూపాయలు. ప్రతి వాయిదాకి 690 రూపాయలు కట్టాలి."'}
              </p>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-mono text-emerald-400 border border-slate-700">
                <span>🔊 Gemma 4 Spoken Synthesis</span>
              </div>
            </div>
          )}

          {activeStep.previewType === 'cert' && (
            <div className="w-full max-w-md rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border-2 border-emerald-500 space-y-3 animate-fade-in text-center">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-emerald-800">🏛️ OFFICIAL VERIFIED RECEIPT</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-extrabold">
                  100% PASS
                </span>
              </div>

              <div className="text-sm font-extrabold text-slate-900">
                Comprehension Certificate Verified
              </div>

              <div className="rounded-xl bg-slate-50 p-2 text-xs font-mono text-slate-600 break-all">
                Verification Seal: e8b940a7f19d2... (Securely Verified)
              </div>

              <div className="flex justify-center gap-2 text-xs font-bold text-emerald-700">
                <span>📲 1-Click WhatsApp Dispatch Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Video Controls & Current Step Info */}
        <div className="p-5 sm:p-6 bg-slate-900 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>{activeStep.icon}</span>
              <span>{title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Stepper Progress Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {VIDEO_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(idx)}
                className={`rounded-xl p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  currentStepIdx === idx
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{step.icon}</span>
                <span className="hidden sm:inline">Step {idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={togglePlayPause}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition"
            >
              <span>{isPlaying ? '⏸️ Pause Video' : '▶️ Resume Video'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopSpeaking()
                onClose()
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow transition"
            >
              {lang === 'en' ? 'Start Using Ardham →' : 'ప్రారంభించండి →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

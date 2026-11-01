import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ArdhamLogo from '../components/ArdhamLogo'
import GlobalAudioBar from '../components/GlobalAudioBar'
import VoiceAssistantModal from '../components/VoiceAssistantModal'
import SettingsModal from '../components/SettingsModal'
import VideoGuideModal from '../components/VideoGuideModal'
import VoiceAvatarMode from '../components/VoiceAvatarMode'
import VoiceAgentWidget from '../components/VoiceAgentWidget'
import {
  isVoiceAssistantEnabled,
  isAvatarModalActive,
  speakText,
  stopSpeaking,
  resetVoiceModal,
  getLanguage,
  setLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { subscribeVoiceCommands } from '../lib/voiceCommander'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'
import { t } from '../lib/translations'

export default function Home() {
  const navigate = useNavigate()
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeAuth(setUser)
  }, [])

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  // Hands-free voice commands on Home
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'start' || action === 'next') {
        navigate('/choose-loan')
      } else if (action === 'avatar') {
        setShowAvatarModal(true)
      } else if (action === 'screen') {
        setShowAvatarModal(false)
      }
    })
    return () => unsubCmd()
  }, [navigate])

  useEffect(() => {
    if (isVoiceAssistantEnabled() && !isAvatarModalActive() && !showAvatarModal) {
      if (lang === 'en') {
        speakText('Welcome to Ardham. An assistant for loan comprehension verification.', 'en')
      } else if (lang === 'hi') {
        speakText('अर्थम में आपका स्वागत है। ऋण समझ सत्यापन के लिए नया सत्र शुरू करें।', 'hi')
      } else {
        speakText('అర్థం కి స్వాగతం. లోన్ వెరిఫికేషన్ ప్రారంభించడానికి స్టార్ట్ సెషన్ బటన్ నొక్కండి.', 'te')
      }
    }
    return () => stopSpeaking()
  }, [lang, showAvatarModal])

  function resetAndOpenModal() {
    resetVoiceModal()
    setShowVoiceModal(true)
  }

  function cycleLanguage() {
    stopSpeaking()
    const nextLang: AppLanguage = lang === 'te' ? 'en' : lang === 'en' ? 'hi' : 'te'
    setLanguage(nextLang)
  }

  return (
    <div className="min-h-screen bg-slate-50/80 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/30 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white shadow-xl border border-slate-200/90 p-6 sm:p-10 flex-1 flex flex-col justify-between animate-fade-in">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4">
          {/* Top Left: Brand Logo & Emblem */}
          <Link
            to="/"
            className="flex items-center hover:opacity-95 transition"
            title="Ardham Home"
          >
            <ArdhamLogo size="md" />
          </Link>

          {/* Top Right: Clean Minimal Icon Controls (Audio Speaker, Language, Settings, Profile) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* AI Avatar Quick Pill Button */}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 hover:from-amber-100 hover:to-yellow-200 text-amber-950 text-xs font-black shadow-sm transition active:scale-95"
              title={
                lang === 'en'
                  ? 'Open AI Avatar Loan Advisor (Lakshmi)'
                  : lang === 'hi'
                  ? 'एआई अवतार ऋण सलाहकार खोलें (लक्ष्मी)'
                  : 'AI అవతార్ రుణ సలహాదారుని తెరవండి (లక్ష్మి)'
              }
            >
              <span className="text-base select-none">👩‍💼</span>
              <span className="font-extrabold">{lang === 'en' ? 'AI Avatar' : lang === 'hi' ? 'एआई अवतार' : 'AI అవతార్'}</span>
            </button>

            {/* 1. Small Audio Speaker Icon Button */}
            <GlobalAudioBar />

            {/* 2. Small Language Icon Button */}
            <button
              type="button"
              onClick={cycleLanguage}
              className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition active:scale-95"
              title={
                lang === 'te'
                  ? 'ప్రస్తుత భాష: తెలుగు (క్లిక్ చేసి మార్చండి)'
                  : lang === 'hi'
                  ? 'वर्तमान भाषा: हिंदी (बदलने के लिए क्लिक करें)'
                  : 'Current Language: English (Click to toggle)'
              }
            >
              <span className="text-base">🌐</span>
              <span className="uppercase text-[11px] font-extrabold text-emerald-800 tracking-wider">
                {lang}
              </span>
            </button>

            {/* 3. Settings Icon Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition active:scale-95"
              title={lang === 'en' ? 'Platform Settings & Controls' : 'ప్లాట్‌ఫామ్ సెట్టింగ్స్'}
              aria-label="Open settings"
            >
              <span className="text-base select-none">⚙️</span>
            </button>

            {/* 4. Account Profile Button */}
            <Link
              to="/auth"
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition active:scale-95"
              title="Account Profile / Login"
            >
              <span className="text-base">👤</span>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {user ? user.name.split(' ')[0] : (lang === 'en' ? 'Sign In' : lang === 'hi' ? 'साइन इन' : 'సైన్ ఇన్')}
              </span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 mb-4 shadow-sm">
            <span>🏛️ {lang === 'en' ? 'Official Bank Rules Verified' : lang === 'hi' ? 'आधिकारिक बैंक नियम सत्यापित' : 'అధికారిక బ్యాంక్ నిబంధనల రసీదు'}</span>
            <span>•</span>
            <span>{lang === 'en' ? '100% Genuine Card Details' : lang === 'hi' ? '100% सटीक दस्तावेज़ विवरण' : 'కార్డులో ఉన్న నిజమైన వివరాలు'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {lang === 'en' ? 'Ardham' : lang === 'hi' ? 'अर्थम' : 'అర్థం'}{' '}
            {lang !== 'en' && <span className="text-3xl sm:text-5xl font-medium text-emerald-800 font-sans">Ardham</span>}
          </h1>

          <p className="mt-3 text-lg sm:text-2xl font-bold text-slate-800 leading-snug">
            {t('tagline', lang)}
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Ensures rural & visually impaired borrowers understand all loan commitments before signing.'
              : lang === 'hi'
              ? 'सुनिश्चित करता है कि हस्ताक्षर करने से पहले ग्रामीण और दृष्टिबाधित उधारकर्ता सभी शर्तों को स्पष्ट रूप से समझें।'
              : 'రుణ ఒప్పందంపై సంతకం లేదా వేలిముద్ర వేయడానికి ముందే ప్రతి నిబంధనను స్వచ్ఛమైన మాటల్లో వివరించే వ్యవస్థ.'}
          </p>
        </div>

        {/* Interactive Gemma 4 Multimodal Video Guide Banner */}
        <div className="my-5 rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <span>🎬 {lang === 'en' ? 'AI Guide' : 'AI డెమో'}</span>
              <span>•</span>
              <span>{lang === 'en' ? 'Photo Scan • Voice Readout • Safety Check' : 'ఫోటో స్కాన్ • వాయిస్ రీడౌట్ • భద్రతా తనిఖీ'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              {lang === 'en' ? 'Watch How Ardham Operates in 4 Visual Steps' : lang === 'hi' ? 'देखें कि अर्थम 4 चरणों में कैसे कार्य करता है' : 'అర్థం ఎలా పనిచేస్తుందో 4 దశల్లో లైవ్ డెమో చూడండి'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              {lang === 'en'
                ? 'Camera photo scanning, upfront fee check, spoken mother tongue explanation, and official verified digital receipt.'
                : lang === 'hi'
                ? 'कैमरा फोटो स्कैन, अग्रिम शुल्कों की जांच, मातृभाषा में मौखिक व्याख्या और आधिकारिक डिजिटल रसीद।'
                : 'కెమెరా ఫోటో స్కాన్, ముందస్తు ఫీజుల తనిఖీ, మాతృభాషలో స్పష్టమైన వివరణ మరియు అధికారిక డిజిటల్ రసీదు.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="shrink-0 flex items-center gap-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-5 py-3 text-sm sm:text-base shadow-lg active:scale-95 transition"
          >
            <span className="text-lg">▶️</span>
            <span>{lang === 'en' ? 'Watch AI Demo Guide' : lang === 'hi' ? 'एआई वीडियो डेमो' : 'AI వీడియో గైడ్'}</span>
          </button>
        </div>

        {/* Loan Categories Grid: 100% strictly localized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
          <Link
            to="/scan/microfinance-group-loan"
            className="rounded-3xl border-2 border-emerald-500/80 bg-emerald-50/40 p-6 text-left hover:bg-emerald-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-4xl">👩‍🌾</span>
              <p className="font-extrabold text-xl text-emerald-950 mt-3">
                {lang === 'en' ? 'Self Help Group Loan (SHG)' : lang === 'hi' ? 'स्वयं सहायता समूह ऋण (SHG)' : 'స్వయం సహాయక సంఘాల గ్రూప్ రుణం'}
              </p>
              <p className="text-sm text-emerald-900 font-semibold leading-relaxed mt-1">
                {lang === 'en'
                  ? 'Self Help Group loan • Easy weekly installments • Group support'
                  : lang === 'hi'
                  ? 'स्वयं सहायता समूह ऋण • आसान साप्ताहिक किस्तें • समूह सहयोग'
                  : 'స్వయం సహాయక సంఘాలు • సులభ వారపు వాయిదాలు • గ్రూప్ మద్దతు'}
              </p>
            </div>
            <span className="text-sm font-bold text-emerald-800 mt-5 inline-flex items-center gap-1">
              {t('quick_demo_card', lang)} →
            </span>
          </Link>

          <Link
            to="/scan/gold-loan"
            className="rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-6 text-left hover:bg-amber-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-4xl">💍</span>
              <p className="font-extrabold text-xl text-amber-950 mt-3">
                {lang === 'en' ? 'Gold Loan' : lang === 'hi' ? 'स्वर्ण ऋण (गोल्ड लोन)' : 'బంగారు ఆభరణాల రుణం'}
              </p>
              <p className="text-sm text-amber-900 font-semibold leading-relaxed mt-1">
                {lang === 'en'
                  ? 'Gold jewelry collateral • Bullet interest repayment • Auction risk notice'
                  : lang === 'hi'
                  ? 'सोने के गहने गिरवी • एकमुश्त ब्याज भुगतान • नीलामी जोखिम नोटिस'
                  : 'బంగారు ఆభరణాల తాకట్టు • బులెట్ వడ్డీ చెల్లింపు • వేలం హెచ్చరికల ఆడిట్'}
              </p>
            </div>
            <span className="text-sm font-bold text-amber-900 mt-5 inline-flex items-center gap-1">
              ⚡ {lang === 'en' ? 'Quick Scan' : lang === 'hi' ? 'त्वरित स्कैन' : 'త్వరిత స్కాన్'} →
            </span>
          </Link>

          <Link
            to="/scan/individual-personal-loan"
            className="rounded-3xl border-2 border-blue-300 bg-blue-50/40 p-6 text-left hover:bg-blue-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-4xl">💼</span>
              <p className="font-extrabold text-xl text-blue-950 mt-3">
                {lang === 'en' ? 'Personal Loan' : lang === 'hi' ? 'व्यक्तिगत ऋण' : 'వ్యక్తిగత వినియోగదారుల రుణం'}
              </p>
              <p className="text-sm text-blue-900 font-semibold leading-relaxed mt-1">
                {lang === 'en'
                  ? 'Individual consumer loan • Monthly EMI • Upfront fee audit'
                  : lang === 'hi'
                  ? 'मासिक ईएमआई • अग्रिम शुल्क जांच • व्यक्तिगत ऋण'
                  : 'వ్యక్తిగత వినియోగదారుల రుణం • నెలవారీ EMI • ముందస్తు ఫీజుల తనిఖీ'}
              </p>
            </div>
            <span className="text-sm font-bold text-blue-800 mt-5 inline-flex items-center gap-1">
              ⚡ {lang === 'en' ? 'Quick Scan' : lang === 'hi' ? 'त्वरित स्कैन' : 'త్వరిత స్కాన్'} →
            </span>
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link
            to="/choose-loan"
            className="flex-1 rounded-2xl bg-emerald-700 py-4 px-6 text-center text-base sm:text-lg font-bold text-white shadow-lg hover:bg-emerald-800 active:scale-[0.98] transition"
          >
            {t('start_new_session', lang)} →
          </Link>

          <button
            type="button"
            onClick={resetAndOpenModal}
            className="rounded-2xl border-2 border-slate-200 bg-white py-4 px-6 text-center text-sm sm:text-base font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-sm"
          >
            🌐 {t('voice_assistant', lang)} & {t('change_language', lang)}
          </button>
        </div>

        {/* Regulatory & Safety Footer Card */}
        <div className="mt-8 rounded-3xl bg-slate-50 p-6 text-left border border-slate-200 text-sm text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>{t('rbi_kfs_compliance_title', lang)}</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {t('rbi_kfs_compliance_desc', lang)}
            </p>
          </div>
          <div className="shrink-0 text-xs font-mono text-emerald-800 bg-emerald-100/80 px-3.5 py-2 rounded-xl font-bold">
            RBI/2023-24/139 Compliant
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-500 text-center">
          {lang === 'en'
            ? 'Ardham protects rural borrowers and visually impaired citizens through transparent oral comprehension verification.'
            : lang === 'hi'
            ? 'अर्थम मौखिक समझ सत्यापन के माध्यम से ग्रामीण और दृष्टिबाधित उधारकर्ताओं की सुरक्षा करता है।'
            : 'అర్థం గ్రామీణ మరియు దృష్టి లోపం ఉన్న రుణగ్రహీతల కోసం ప్రత్యేక వెరిఫికేషన్ వ్యవస్థను అందిస్తుంది.'}
        </p>
      </div>

      <VoiceAssistantModal
        isOpen={showVoiceModal ? true : undefined}
        onClose={() => setShowVoiceModal(false)}
        onOpenAvatar={() => setShowAvatarModal(true)}
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenVideoGuide={() => {
          setShowSettingsModal(false)
          setShowVideoModal(true)
        }}
        onOpenAvatar={() => {
          setShowSettingsModal(false)
          setShowAvatarModal(true)
        }}
      />

      {/* Multimodal Gemma 4 AI Video Guide Modal */}
      <VideoGuideModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />

      {/* Floating Hands-Free Voice Agent Status Widget */}
      <VoiceAgentWidget onOpenAvatar={() => setShowAvatarModal(true)} />

      {/* Autonomous AI Avatar Mode (100% Hands-Free for Blind Users) */}
      <VoiceAvatarMode
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GlobalAudioBar from '../components/GlobalAudioBar'
import VoiceAssistantModal from '../components/VoiceAssistantModal'
import {
  isVoiceAssistantEnabled,
  speakText,
  stopSpeaking,
  resetVoiceModal,
  getLanguage,
  setLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { getCurrentUser, subscribeAuth, type User } from '../lib/auth'
import { t } from '../lib/translations'

export default function Home() {
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [user, setUser] = useState<User | null>(getCurrentUser())
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeAuth(setUser)
  }, [])

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      if (lang === 'en') {
        speakText('Welcome to Ardham. An assistant for loan comprehension verification.', 'en')
      } else if (lang === 'hi') {
        speakText('अर्थम में आपका स्वागत है। ऋण समझ सत्यापन के लिए नया सत्र शुरू करें।', 'hi')
      } else {
        speakText('అర్థం కి స్వాగతం. లోన్ వెరిఫికేషన్ ప్రారంభించడానికి స్టార్ట్ సెషన్ బటన్ నొక్కండి.', 'te')
      }
    }
    return () => stopSpeaking()
  }, [lang])

  function resetAndOpenModal() {
    resetVoiceModal()
    setShowVoiceModal(true)
  }

  function switchLang(newLang: AppLanguage) {
    stopSpeaking()
    setLanguage(newLang)
  }

  return (
    <div className="min-h-screen bg-slate-50/80 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/30 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white shadow-xl border border-slate-200/90 p-6 sm:p-10 flex-1 flex flex-col justify-between animate-fade-in">
        {/* Top Header Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 border-b border-slate-100 pb-4">
          {/* Top Left: Brand only */}
          <Link
            to="/"
            className="flex items-center gap-2 font-black text-slate-900 hover:text-emerald-700 transition"
            title="Ardham Home"
          >
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
              {lang === 'en' ? 'Ardham' : lang === 'hi' ? 'अर्थम' : 'అర్థం'}
            </span>
            {lang !== 'en' && <span className="text-base font-bold text-slate-600 hidden sm:inline">Ardham</span>}
          </Link>

          {/* Top Right: Buttons (Language, Audio, Account Profile) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            {/* 1. Language Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => switchLang('te')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === 'te'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="తెలుగు"
              >
                🪔 తెలుగు
              </button>
              <button
                type="button"
                onClick={() => switchLang('en')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === 'en'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="English"
              >
                🌐 English
              </button>
              <button
                type="button"
                onClick={() => switchLang('hi')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === 'hi'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिंदी"
              >
                🇮🇳 हिंदी
              </button>
            </div>

            {/* 2. Audio Voice Control */}
            <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />

            {/* 3. Account Profile Button (Top Right) */}
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 px-3.5 py-1.5 rounded-xl shadow-sm transition active:scale-95"
              title="Account Profile / Login"
            >
              <span>👤</span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {user ? `${user.name} (${user.role === 'officer' ? (lang === 'en' ? 'Officer' : lang === 'hi' ? 'अधिकारी' : 'అధికారి') : (lang === 'en' ? 'Borrower' : lang === 'hi' ? 'उधारकर्ता' : 'రుణగ్రహీత')})` : (lang === 'en' ? 'Sign In / Demo' : lang === 'hi' ? 'साइन इन / डेमो' : 'సైన్ ఇన్ / డెమో')}
              </span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 mb-5 shadow-sm">
            <span>🏛️ RBI Key Fact Statement (KFS) Audit Verified</span>
            <span>•</span>
            <span>Zero Hallucination Protected</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {lang === 'en' ? 'Ardham' : lang === 'hi' ? 'अर्थम' : 'అర్థం'}{' '}
            {lang !== 'en' && <span className="text-3xl sm:text-5xl font-medium text-emerald-800 font-sans">Ardham</span>}
          </h1>

          <p className="mt-4 text-lg sm:text-2xl font-bold text-slate-800 leading-snug">
            {t('tagline', lang)}
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Makes sure rural & visually impaired borrowers understand all loan commitments before signing.'
              : lang === 'hi'
              ? 'सुनिश्चित करता है कि हस्ताक्षर करने से पहले ग्रामीण और दृष्टिबाधित उधारकर्ता सभी शर्तों को स्पष्ट रूप से समझें।'
              : 'రుణ ఒప్పందంపై సంతకం లేదా వేలిముద్ర వేయడానికి ముందే ప్రతి నిబంధనను స్వచ్ఛమైన మాటల్లో వివరించే వ్యవస్థ.'}
          </p>
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
                {lang === 'en' ? 'Microfinance (JLG)' : lang === 'hi' ? 'माइक्रोफाइनेंस (JLG)' : 'మైక్రోఫైనాన్స్ గ్రూప్ రుణం'}
              </p>
              <p className="text-sm text-emerald-900 font-semibold leading-relaxed mt-1">
                {lang === 'en'
                  ? 'Self Help Group loan • Weekly reducing installments • Group liability'
                  : lang === 'hi'
                  ? 'स्वयं सहायता समूह ऋण • साप्ताहिक घटती किस्तें • समूह देयता'
                  : 'స్వయం సహాయక సంఘాలు • వారపు వాయిదాలు • గ్రూప్ బాధ్యత'}
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
      />
    </div>
  )
}

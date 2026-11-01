import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OfflineIndicator from '../components/OfflineIndicator'
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
        speakText('Welcome to Ardham. An edge AI assistant for loan comprehension verification.', 'en')
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
    <div className="min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-slate-100 sm:via-slate-50 sm:to-emerald-50/40 py-3 sm:py-8 px-2 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white shadow-xl border border-slate-200/80 p-5 sm:p-8 md:p-10 flex-1 flex flex-col justify-between animate-fade-in">
        {/* Top User Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
            >
              <span>👤</span>
              <span>{user ? `${user.name} (${user.role === 'officer' ? 'Officer' : 'Borrower'})` : '🔑 Sign In / Demo Login'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Real-time Language Selector Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchLang('te')}
                className={`px-3 py-1 rounded-lg transition-all ${
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
                className={`px-3 py-1 rounded-lg transition-all ${
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
                className={`px-3 py-1 rounded-lg transition-all ${
                  lang === 'hi'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिंदी"
              >
                🇮🇳 हिंदी
              </button>
            </div>

            <GlobalAudioBar onOpenSettings={() => setShowVoiceModal(true)} />
            <OfflineIndicator />
          </div>
        </div>

        {/* Hero Section: Responsive Full Width */}
        <div className="my-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-extrabold text-emerald-800 mb-4 shadow-sm">
            <span>✨ Powered by Gemma 4 Edge AI</span>
            <span>•</span>
            <span>100% Offline Capable</span>
            <span>•</span>
            <span>Zero Hallucination Guard</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            అర్థం <span className="text-3xl sm:text-4xl font-medium text-emerald-700 font-sans">Ardham</span>
          </h1>

          <p className="mt-4 text-lg sm:text-xl font-bold text-slate-800 leading-snug">
            {t('tagline', lang)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Offline Loan Comprehension & Regulatory Key Fact Statement (KFS) Verification
          </p>
        </div>

        {/* Loan Categories Grid: 3 columns on tablet/desktop, 1 column on phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <Link
            to="/scan/microfinance-group-loan"
            className="rounded-3xl border-2 border-emerald-500/80 bg-emerald-50/40 p-5 text-left hover:bg-emerald-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-3xl">👩‍🌾</span>
              <p className="font-extrabold text-lg text-emerald-950 mt-2">Microfinance (JLG)</p>
              <p className="text-xs text-emerald-800 font-medium leading-relaxed mt-1">
                స్వయం సహాయక సంఘాలు • Weekly reducing installments • Group liability
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 mt-4 inline-flex items-center gap-1">
              {t('quick_demo_card', lang)} →
            </span>
          </Link>

          <Link
            to="/scan/gold-loan"
            className="rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-5 text-left hover:bg-amber-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-3xl">💍</span>
              <p className="font-extrabold text-lg text-amber-950 mt-2">Gold Loan</p>
              <p className="text-xs text-amber-800 font-medium leading-relaxed mt-1">
                బంగారు ఆభరణాల తాకట్టు • Bullet interest repayment • Auction risk warning
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 mt-4 inline-flex items-center gap-1">
              ⚡ Quick Scan →
            </span>
          </Link>

          <Link
            to="/scan/individual-personal-loan"
            className="rounded-3xl border-2 border-blue-300 bg-blue-50/40 p-5 text-left hover:bg-blue-100/70 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-3xl">💼</span>
              <p className="font-extrabold text-lg text-blue-950 mt-2">Personal Loan</p>
              <p className="text-xs text-blue-800 font-medium leading-relaxed mt-1">
                వ్యక్తిగత వినియోగదారుల రుణం • Monthly EMI • Upfront fee audit
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 mt-4 inline-flex items-center gap-1">
              ⚡ Quick Scan →
            </span>
          </Link>
        </div>

        {/* Action CTAs: Full-width responsive */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link
            to="/choose-loan"
            className="flex-1 rounded-2xl bg-emerald-600 py-4 px-6 text-center text-base font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition"
          >
            {t('start_new_session', lang)} →
          </Link>

          <button
            type="button"
            onClick={resetAndOpenModal}
            className="rounded-2xl border-2 border-slate-200 bg-white py-4 px-6 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-sm"
          >
            🌐 {t('voice_assistant', lang)} & {t('change_language', lang)}
          </button>
        </div>

        {/* Regulatory & Safety Footer Card */}
        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-left border border-slate-200 text-xs text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>{t('rbi_kfs_compliance_title', lang)}</span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {t('rbi_kfs_compliance_desc', lang)}
            </p>
          </div>
          <div className="shrink-0 text-[11px] font-mono text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl font-bold">
            RBI/2023-24/139 Compliant
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 text-center">
          Ardham operates on-device to protect rural borrower privacy. All test datasets are fictional.
        </p>
      </div>

      <VoiceAssistantModal
        isOpen={showVoiceModal ? true : undefined}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  )
}

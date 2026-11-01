import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { signIn, signUp, signInDemo, getCurrentUser } from '../lib/auth'
import { isVoiceAssistantEnabled, speakText, stopSpeaking, getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'

export default function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'demo' | 'signin' | 'signup'>('demo')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'officer' | 'borrower'>('officer')
  const [org, setOrg] = useState('')
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      if (lang === 'en') {
        speakText('User account and login page. Sign in or use one-click demo login.', 'en')
      } else if (lang === 'hi') {
        speakText('लॉगिन या पंजीकरण पेज में आपका स्वागत है।', 'hi')
      } else {
        speakText('లాగిన్ లేదా రిజిస్ట్రేషన్ పేజీకి స్వాగతం. లేదా 1-క్లిక్ డెమో తో లాగిన్ అవ్వండి.', 'te')
      }
    }
    return () => stopSpeaking()
  }, [lang])

  function handleDemoLogin(demoRole: 'officer' | 'borrower') {
    const user = signInDemo(demoRole)
    setCurrentUser(user)
    if (isVoiceAssistantEnabled()) {
      const msg = lang === 'en'
        ? `Signed in as ${user.name}. You may proceed with verification.`
        : `${user.name} గా లాగిన్ అయ్యారు. వెరిఫికేషన్ ప్రారంభించవచ్చు.`
      speakText(msg, lang)
    }
    navigate('/')
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    const user = signIn(phone, role)
    setCurrentUser(user)
    navigate('/')
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    const user = signUp(name, phone, role, org)
    setCurrentUser(user)
    navigate('/')
  }

  return (
    <StepLayout
      title={lang === 'en' ? 'User Account & Login' : lang === 'hi' ? 'खाता एवं लॉगिन' : 'యూజర్ ఖాతా & లాగిన్'}
      subtitle={{
        en: 'Field Officer & Borrower authentication',
        te: 'యూజర్ లాగిన్ & ప్రొఫైల్ వివరాలు',
        hi: 'उपयोगकर्ता खाता एवं लॉगिन',
      }}
      maxWidthClass="max-w-4xl"
    >
      {currentUser && (
        <div className="mb-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 text-center">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {lang === 'en' ? 'Active Signed-In Profile' : 'ప్రస్తుతం లాగిన్ అయిన ప్రొఫైల్'}
          </p>
          <p className="mt-1 text-lg font-black text-slate-900">{currentUser.name}</p>
          <p className="text-xs text-slate-600 font-medium">{currentUser.organization} • {currentUser.phone}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 transition"
            >
              {lang === 'en' ? 'Continue to Home →' : 'కొనసాగించండి (Home) →'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
        <button
          onClick={() => setTab('demo')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'demo' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          ⚡ 1-Click Fast Demo
        </button>
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'signin' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {lang === 'en' ? 'Sign In' : 'సైన్ ఇన్'}
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {lang === 'en' ? 'Sign Up' : 'రిజిస్టర్'}
        </button>
      </div>

      {tab === 'demo' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950">
            <p className="font-bold">⚡ Quick Access Roles:</p>
            <p className="mt-1 leading-relaxed">
              {lang === 'en'
                ? 'Select a role below to simulate loan verification instantly:'
                : 'వెరిఫికేషన్ ప్రారంభించడానికి కింద ఉన్న డెమో ఖాతాలలో ఒకదాన్ని ఎంచుకోండి:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleDemoLogin('officer')}
              className="rounded-2xl border-2 border-emerald-500 bg-white p-5 text-left shadow-sm hover:border-emerald-600 hover:shadow-md transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="text-3xl">👔</span>
                <div>
                  <p className="font-extrabold text-base text-slate-900">Ramesh Kumar</p>
                  <p className="text-xs text-emerald-800 font-bold">
                    {lang === 'en' ? 'Field Verification Officer' : 'ఫీల్డ్ వెరిఫికేషన్ ఆఫీసర్'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Spandana Sphoorty Financial • Kadapa Rural Branch
              </p>
              <span className="mt-4 inline-block text-xs font-bold text-emerald-700">
                {lang === 'en' ? 'Login as Officer →' : 'ఆఫీసర్ గా లాగిన్ అవ్వండి →'}
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('borrower')}
              className="rounded-2xl border-2 border-amber-400 bg-white p-5 text-left shadow-sm hover:border-amber-500 hover:shadow-md transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="text-3xl">👩‍🌾</span>
                <div>
                  <p className="font-extrabold text-base text-slate-900">Lakshmi Devi</p>
                  <p className="text-xs text-amber-800 font-bold">
                    {lang === 'en' ? 'Rural SHG Borrower' : 'గ్రామీణ రుణగ్రహీత (SHG)'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Bhavani Mahila Sangham • Village Self-Help Group
              </p>
              <span className="mt-4 inline-block text-xs font-bold text-amber-700">
                {lang === 'en' ? 'Login as Borrower →' : 'రుణగ్రహీత గా లాగిన్ అవ్వండి →'}
              </span>
            </button>
          </div>
        </div>
      ) : tab === 'signin' ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Phone Number' : 'ఫోన్ నంబర్'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Your Role' : 'మీ పాత్ర'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('officer')}
                className={`rounded-xl py-3 text-xs font-bold border transition ${
                  role === 'officer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👔 {lang === 'en' ? 'Field Officer' : 'ఫీల్డ్ ఆఫీసర్'}
              </button>
              <button
                type="button"
                onClick={() => setRole('borrower')}
                className={`rounded-xl py-3 text-xs font-bold border transition ${
                  role === 'borrower'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👩‍🌾 {lang === 'en' ? 'Borrower' : 'రుణగ్రహీత'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
          >
            {lang === 'en' ? 'Sign In →' : 'సైన్ ఇన్ అవ్వండి →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Full Name' : 'పూర్తి పేరు'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Phone Number' : 'ఫోన్ నంబర్'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Organization / MFI / SHG' : 'సంస్థ / బ్యాంక్ / గ్రూప్ పేరు'}
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="e.g. Spandana Sphoorty / Kudumbashree"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'en' ? 'Select Role' : 'పాత్రను ఎంచుకోండి'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('officer')}
                className={`rounded-xl py-3 text-xs font-bold border transition ${
                  role === 'officer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👔 {lang === 'en' ? 'Field Officer' : 'ఫీల్డ్ ఆఫీసర్'}
              </button>
              <button
                type="button"
                onClick={() => setRole('borrower')}
                className={`rounded-xl py-3 text-xs font-bold border transition ${
                  role === 'borrower'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👩‍🌾 {lang === 'en' ? 'Borrower' : 'రుణగ్రహీత'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-700 py-4 text-base font-bold text-white shadow-lg hover:bg-emerald-800 active:scale-[0.98] transition"
          >
            {lang === 'en' ? 'Create Account & Sign In →' : 'ఖాతా సృష్టించి కొనసాగించండి →'}
          </button>
        </form>
      )}
    </StepLayout>
  )
}

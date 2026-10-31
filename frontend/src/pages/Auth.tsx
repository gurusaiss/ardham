import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { signIn, signUp, signInDemo, getCurrentUser } from '../lib/auth'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking } from '../lib/speech'

export default function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'demo' | 'signin' | 'signup'>('demo')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'officer' | 'borrower'>('officer')
  const [org, setOrg] = useState('')
  const [currentUser, setCurrentUser] = useState(getCurrentUser())

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      speakTelugu('లాగిన్ లేదా రిజిస్ట్రేషన్ పేజీకి స్వాగతం. లేదా 1-క్లిక్ డెమో తో లాగిన్ అవ్వండి.')
    }
    return () => stopSpeaking()
  }, [])

  function handleDemoLogin(demoRole: 'officer' | 'borrower') {
    const user = signInDemo(demoRole)
    setCurrentUser(user)
    if (isVoiceAssistantEnabled()) {
      speakTelugu(`${user.name} గా లాగిన్ అయ్యారు. వెరిఫికేషన్ ప్రారంభించవచ్చు.`)
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
    <StepLayout title="User Account & Login" teluguTitle="యూజర్ లాగిన్ & రిజిస్ట్రేషన్">
      {currentUser && (
        <div className="mb-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            ప్రస్తుతం లాగిన్ అయిన ప్రొఫైల్ (Active Profile)
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">{currentUser.name}</p>
          <p className="text-xs text-slate-500">{currentUser.organization} • {currentUser.phone}</p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              కొనసాగించండి (Continue to Home)
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
        <button
          onClick={() => setTab('demo')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            tab === 'demo' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          ⚡ 1-Click Demo
        </button>
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            tab === 'signin' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            tab === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sign Up
        </button>
      </div>

      {tab === 'demo' ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
            <p className="font-bold">⚡ Hackathon & Evaluation Quick Access:</p>
            <p className="mt-1">
              Judges and evaluators can instantly log in as a certified Field Officer or Rural Borrower with one touch.
            </p>
          </div>

          <button
            onClick={() => handleDemoLogin('officer')}
            className="w-full rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-left text-white shadow hover:bg-slate-800 active:scale-[0.98] transition flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-base">👔 Field Officer Demo</p>
              <p className="text-xs text-slate-300">Ramesh Kumar • Spandana Sphoorty MFI (Vizag)</p>
            </div>
            <span className="text-xl">→</span>
          </button>

          <button
            onClick={() => handleDemoLogin('borrower')}
            className="w-full rounded-2xl border-2 border-emerald-600 bg-white p-4 text-left text-slate-900 shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-base text-emerald-950">🌾 Rural Borrower Demo</p>
              <p className="text-xs text-slate-500">Anitha Devi • DWCRA SHG Group #4</p>
            </div>
            <span className="text-xl text-emerald-700">→</span>
          </button>
        </div>
      ) : tab === 'signin' ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              ఫోన్ నెంబర్ లేదా మొబైల్ (Phone Number)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9848022338"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              రోల్ (Role)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('officer')}
                className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                  role === 'officer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👔 Field Officer
              </button>
              <button
                type="button"
                onClick={() => setRole('borrower')}
                className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                  role === 'borrower'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                🌾 Borrower
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow hover:bg-slate-800 active:scale-[0.98] transition"
          >
            Sign In (లాగిన్ అవ్వండి)
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              పూర్తి పేరు (Full Name)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              మొబైల్ నెంబర్ (Mobile Number)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9848022338"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              సంస్థ / బ్యాంక్ (Organization / Bank / SHG)
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="e.g. Muthoot Finance / Spandana MFI / DWCRA"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              రోల్ (Role)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('officer')}
                className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                  role === 'officer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                👔 Field Officer
              </button>
              <button
                type="button"
                onClick={() => setRole('borrower')}
                className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                  role === 'borrower'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                🌾 Borrower
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition"
          >
            Sign Up & Create Account (ఖాతా తెరవండి)
          </button>
        </form>
      )}
    </StepLayout>
  )
}

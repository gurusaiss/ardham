import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'

const STEPS = [
  { id: 'scan', en: 'Scan', te: 'స్కాన్', hi: 'स्कैन', pathPrefix: '/scan' },
  { id: 'review', en: 'Review', te: 'సమీక్ష', hi: 'समीक्षा', pathPrefix: '/review' },
  { id: 'explain', en: 'Explain', te: 'వివరణ', hi: 'विवरण', pathPrefix: '/explain' },
  { id: 'quiz', en: 'Quiz', te: 'ప్రశ్నలు', hi: 'प्रश्नोत्तरी', pathPrefix: '/quiz' },
  { id: 'cert', en: 'Certificate', te: 'ధృవీకరణ', hi: 'प्रमाणपत्र', pathPrefix: '/certificate' },
]

export default function StepProgress() {
  const location = useLocation()
  const path = location.pathname
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  if (path === '/' || path === '/auth' || path === '/choose-loan') {
    return null
  }

  let currentIndex = 0
  if (path.startsWith('/scan')) currentIndex = 0
  else if (path.startsWith('/review')) currentIndex = 1
  else if (path.startsWith('/explain')) currentIndex = 2
  else if (path.startsWith('/quiz') || path.startsWith('/result')) currentIndex = 3
  else if (path.startsWith('/certificate')) currentIndex = 4

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((s, idx) => {
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          const label = lang === 'en' ? s.en : lang === 'hi' ? s.hi : s.te

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                    : isCurrent
                    ? 'bg-slate-900 text-white shadow-md ring-4 ring-emerald-400'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-2 text-xs font-bold tracking-tight hidden sm:block ${
                  isCurrent ? 'text-slate-900' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useLocation } from 'react-router-dom'

const STEPS = [
  { id: 'scan', label: 'Scan', te: 'స్కాన్', pathPrefix: '/scan' },
  { id: 'review', label: 'Review', te: 'సమీక్ష', pathPrefix: '/review' },
  { id: 'explain', label: 'Explain', te: 'వివరణ', pathPrefix: '/explain' },
  { id: 'quiz', label: 'Quiz', te: 'ప్రశ్నలు', pathPrefix: '/quiz' },
  { id: 'cert', label: 'Certificate', te: 'సర్టిఫికెట్', pathPrefix: '/certificate' },
]

export default function StepProgress() {
  const location = useLocation()
  const path = location.pathname

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

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                    : isCurrent
                    ? 'bg-slate-900 text-white shadow-md ring-4 ring-emerald-400 animate-pulse'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-bold tracking-tight hidden sm:block ${
                  isCurrent ? 'text-slate-900' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              <span
                className={`text-[9px] hidden sm:block ${
                  isCurrent ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                }`}
              >
                {s.te}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useState, useSyncExternalStore } from 'react'
import { clearLatencyLog, getLatencyLog, getSettings, subscribeLatency } from '../lib/api'

export default function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [backend, setBackendState] = useState<string | null>(null)
  const entries = useSyncExternalStore(subscribeLatency, getLatencyLog)

  useEffect(() => {
    if (!open) return
    getSettings()
      .then((s) => setBackendState(s.backend))
      .catch(() => setBackendState('unknown'))
  }, [open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-white"
      >
        debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-3 right-3 w-64 rounded-lg border border-slate-300 bg-white p-3 text-xs shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Debug — on-device speed</span>
        <button onClick={() => setOpen(false)} className="text-slate-400">
          ✕
        </button>
      </div>
      <div className="mb-2 text-slate-500">backend: {backend ?? '...'}</div>
      {entries.length === 0 ? (
        <div className="text-slate-400">No calls yet.</div>
      ) : (
        <ul className="flex max-h-48 flex-col-reverse gap-1 overflow-y-auto">
          {entries.map((e, i) => (
            <li key={i} className="flex justify-between border-b border-slate-100 py-0.5">
              <span>{e.label}</span>
              <span className="font-mono">{e.seconds.toFixed(2)}s</span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={clearLatencyLog} className="mt-2 text-slate-400 underline">
        clear
      </button>
    </div>
  )
}

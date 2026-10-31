import { useState } from 'react'
import { ApiError, setBackend } from '../lib/api'

export default function ErrorBanner({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const [switching, setSwitching] = useState(false)
  const message = error instanceof Error ? error.message : String(error)
  const modelUnavailable = error instanceof ApiError ? error.modelUnavailable : null

  async function switchTo(target: 'local' | 'aistudio' | 'groq') {
    setSwitching(true)
    try {
      await setBackend(target)
      onRetry()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 shadow-sm">
      <p className="font-semibold">{message}</p>
      {modelUnavailable ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {modelUnavailable.backend !== 'aistudio' && (
            <button
              disabled={switching}
              onClick={() => switchTo('aistudio')}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {switching ? 'Switching...' : 'Switch to AI Studio (Gemma)'}
            </button>
          )}
          {modelUnavailable.backend !== 'groq' && (
            <button
              disabled={switching}
              onClick={() => switchTo('groq')}
              className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {switching ? 'Switching...' : 'Switch to Groq (Fast Cloud)'}
            </button>
          )}
          {modelUnavailable.backend !== 'local' && (
            <button
              disabled={switching}
              onClick={() => switchTo('local')}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {switching ? 'Switching...' : 'Switch to Local (Ollama)'}
            </button>
          )}
        </div>
      ) : (
        <button onClick={onRetry} className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white">
          Retry
        </button>
      )}
    </div>
  )
}

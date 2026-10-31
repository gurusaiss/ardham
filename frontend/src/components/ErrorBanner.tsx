import { useState } from 'react'
import { ApiError, setBackend } from '../lib/api'

export default function ErrorBanner({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const [switching, setSwitching] = useState(false)
  const message = error instanceof Error ? error.message : String(error)
  const modelUnavailable = error instanceof ApiError ? error.modelUnavailable : null

  async function switchBackup() {
    if (!modelUnavailable) return
    setSwitching(true)
    try {
      const target = modelUnavailable.backend === 'local' ? 'aistudio' : 'local'
      await setBackend(target)
      onRetry()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <p>{message}</p>
      {modelUnavailable ? (
        <button
          disabled={switching}
          onClick={switchBackup}
          className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {switching
            ? 'Switching...'
            : `Switch to ${modelUnavailable.backend === 'local' ? 'AI Studio backup' : 'local Gemma'} and retry`}
        </button>
      ) : (
        <button onClick={onRetry} className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white">
          Retry
        </button>
      )}
    </div>
  )
}

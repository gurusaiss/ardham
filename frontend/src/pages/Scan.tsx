import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { extractTerms, getSampleCardFile } from '../lib/api'

export default function Scan() {
  const { loanType } = useParams<{ loanType: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)

  async function onFile(file: File) {
    if (!loanType) return
    setLastFile(file)
    setBusy(true)
    setError(null)
    try {
      const { session_id, terms, consistency_warnings } = await extractTerms(loanType, file)
      navigate(`/review/${session_id}`, { state: { terms, consistencyWarnings: consistency_warnings } })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  async function useSampleCard() {
    if (!loanType) return
    setBusy(true)
    setError(null)
    try {
      const file = await getSampleCardFile(loanType)
      await onFile(file)
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <StepLayout title="Scan the loan card" teluguTitle="రుణ పత్రాన్ని స్కాన్ చేయండి">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className="flex flex-col gap-3">
        <button
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl bg-slate-900 py-6 text-lg font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? 'Reading loan card...' : '📷 Take photo / upload card'}
        </button>

        <button
          disabled={busy}
          onClick={useSampleCard}
          className="w-full rounded-xl border-2 border-emerald-600 bg-emerald-50 py-4 text-base font-medium text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50"
        >
          {busy ? 'Processing sample...' : '⚡ Quick Demo: Use sample loan card'}
        </button>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorBanner error={error} onRetry={() => (lastFile ? onFile(lastFile) : useSampleCard())} />
        </div>
      ) : null}
    </StepLayout>
  )
}

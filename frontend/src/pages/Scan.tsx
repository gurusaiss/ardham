import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { extractTerms, getSampleCardFile } from '../lib/api'
import { isVoiceAssistantEnabled, speakTelugu, stopSpeaking } from '../lib/speech'

export default function Scan() {
  const { loanType } = useParams<{ loanType: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      speakTelugu('లోన్ కార్డును ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి. లేదా డెమో కార్డును ఎంచుకోండి.')
    }
    return () => stopSpeaking()
  }, [])

  async function onFile(file: File) {
    if (!loanType) return
    setLastFile(file)
    setBusy(true)
    setError(null)
    if (isVoiceAssistantEnabled()) {
      speakTelugu('లోన్ కార్డు చదువుతున్నాం... వివరాలు సేకరిస్తున్నాం.')
    }
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
          className="w-full rounded-2xl bg-slate-900 py-6 text-lg font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? 'Reading loan card...' : '📷 Take photo / upload card'}
        </button>

        <button
          disabled={busy}
          onClick={useSampleCard}
          className="w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-4 text-base font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? 'Processing sample...' : '⚡ Quick Demo: Use sample loan card'}
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">♿ Accessibility & Field Assistance:</p>
        <p className="mt-1">
          For visually impaired borrowers, the field officer captures the loan card photo. The system then automatically guides the borrower through oral Telugu explanations and comprehension verification questions.
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorBanner error={error} onRetry={() => (lastFile ? onFile(lastFile) : useSampleCard())} />
        </div>
      ) : null}
    </StepLayout>
  )
}

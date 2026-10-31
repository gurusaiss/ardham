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
  const addMoreRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      speakTelugu('లోన్ కార్డును ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి. డాక్యుమెంట్‌లో ఎక్కువ పేజీలు ఉంటే అన్ని పేజీలను యాడ్ చేయవచ్చు.')
    }
    return () => stopSpeaking()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setSelectedFiles((prev) => [...prev, ...files])
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function processFiles(filesToProcess: File[]) {
    if (!loanType || filesToProcess.length === 0) return
    setBusy(true)
    setError(null)
    if (isVoiceAssistantEnabled()) {
      speakTelugu(`${filesToProcess.length} పేజీల లోన్ డాక్యుమెంట్‌ను చదువుతున్నాం... వివరాలు సేకరిస్తున్నాం.`)
    }
    try {
      const { session_id, terms, consistency_warnings } = await extractTerms(loanType, filesToProcess)
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
      await processFiles([file])
    } catch (e) {
      setError(e)
      setBusy(false)
    }
  }

  return (
    <StepLayout title="Scan loan document / KFS" teluguTitle="రుణ పత్రాలు లేదా KFS స్కాన్ చేయండి">
      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={addMoreRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col gap-3">
        {selectedFiles.length === 0 ? (
          <button
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl bg-slate-900 py-6 text-lg font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition flex flex-col items-center justify-center gap-1"
          >
            <span>📷 {busy ? 'Reading pages...' : 'Take photos / Upload pages'}</span>
            <span className="text-xs font-normal text-slate-300">
              Select 1 or multiple pages (1 to 10+ pages)
            </span>
          </button>
        ) : (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">
                📄 {selectedFiles.length} {selectedFiles.length === 1 ? 'Page' : 'Pages'} Selected
              </span>
              <button
                type="button"
                onClick={() => addMoreRef.current?.click()}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-95"
              >
                + Add Another Page
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFiles.map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                >
                  <span>Page {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-500 hover:text-red-700 font-bold ml-1"
                    title="Remove page"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              disabled={busy}
              onClick={() => processFiles(selectedFiles)}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3.5 text-base font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
            >
              {busy ? 'Extracting from all pages...' : `🔍 Analyze all ${selectedFiles.length} pages with Gemma`}
            </button>
          </div>
        )}

        <button
          disabled={busy}
          onClick={useSampleCard}
          className="w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-3.5 text-base font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? 'Processing sample...' : '⚡ Quick Demo: Use sample loan card'}
        </button>
      </div>

      {/* RBI Regulatory & Multi-page Explainer */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <span>🏛️ RBI Key Fact Statement (KFS) Rule:</span>
        </div>
        <p className="leading-relaxed">
          Under RBI Circular RBI/2023-24/139, lenders <strong>must provide a 1-page Key Fact Statement (KFS)</strong> on Page 1 or 2 summarizing all APR, fees, and net disbursal.
        </p>
        <p className="leading-relaxed text-slate-500">
          • If you have the <strong>KFS summary page</strong>, scanning just that 1 page is enough!<br />
          • If the lender gave a <strong>10+ page agreement</strong> without a KFS, snap all pages. Ardham scans across all pages to hunt down hidden charges and fine-print traps.
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorBanner
            error={error}
            onRetry={() => (selectedFiles.length > 0 ? processFiles(selectedFiles) : useSampleCard())}
          />
        </div>
      ) : null}
    </StepLayout>
  )
}

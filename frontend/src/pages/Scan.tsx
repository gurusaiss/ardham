import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { extractTerms, getSampleCardFile } from '../lib/api'
import {
  isVoiceAssistantEnabled,
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'

export default function Scan() {
  const { loanType } = useParams<{ loanType: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  useEffect(() => {
    if (isVoiceAssistantEnabled()) {
      if (lang === 'en') {
        speakText('Please photograph or upload your loan card. You can add 1 to 10+ pages.', 'en')
      } else if (lang === 'hi') {
        speakText('कृपया ऋण दस्तावेज़ की फोटो लें या अपलोड करें। आप एक या अधिक पृष्ठ जोड़ सकते हैं।', 'hi')
      } else {
        speakText('లోన్ కార్డును ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి. డాక్యుమెంట్‌లో ఎక్కువ పేజీలు ఉంటే అన్ని పేజీలను యాడ్ చేయవచ్చు.', 'te')
      }
    }
    return () => stopSpeaking()
  }, [lang])

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
      const msg = lang === 'en'
        ? `Analyzing ${filesToProcess.length} loan pages with Gemma 4...`
        : lang === 'hi'
        ? `जेम्मा 4 से ${filesToProcess.length} पृष्ठों का विश्लेषण किया जा रहा है...`
        : `${filesToProcess.length} పేజీల లోన్ డాక్యుమెంట్‌ను చదువుతున్నాం... వివరాలు సేకరిస్తున్నాం.`
      speakText(msg, lang)
    }
    try {
      const { session_id, terms, consistency_warnings, fairness_analysis } = await extractTerms(loanType, filesToProcess)
      navigate(`/review/${session_id}`, {
        state: { terms, consistencyWarnings: consistency_warnings, fairnessAnalysis: fairness_analysis },
      })
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
    <StepLayout
      title={t('scan_title', lang)}
      subtitle={{
        en: 'Scan loan agreement or Key Fact Statement (1 to 10+ pages)',
        te: 'రుణ పత్రాలు లేదా KFS స్కాన్ చేయండి (1 నుండి 10+ పేజీలు)',
        hi: 'ऋण दस्तावेज़ या केएफएस स्कैन करें (1 से 10+ पृष्ठ)',
      }}
      maxWidthClass="max-w-5xl"
    >
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

      <div className="flex flex-col gap-4">
        {selectedFiles.length === 0 ? (
          <button
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-3xl bg-slate-900 py-8 px-6 text-xl font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition flex flex-col items-center justify-center gap-2 group"
          >
            <span className="text-3xl">📷</span>
            <span className="text-lg sm:text-xl font-bold">
              {busy ? (lang === 'en' ? 'Extracting with Gemma 4...' : 'విశ్లేషిస్తున్నాం...') : t('take_photo_btn', lang)}
            </span>
            <span className="text-xs font-normal text-slate-300">
              {lang === 'en'
                ? 'Select 1 or multiple pages (1 to 10+ pages accepted)'
                : lang === 'hi'
                ? '1 या अधिक पृष्ठ चुनें (1 से 10+ पृष्ठ)'
                : '1 లేదా అంతకంటే ఎక్కువ పేజీలను ఎంచుకోండి (1 నుండి 10+ పేజీలు)'}
            </span>
          </button>
        ) : (
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">
                📄 {selectedFiles.length} {t('pages_selected', lang)}
              </span>
              <button
                type="button"
                onClick={() => addMoreRef.current?.click()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-95 transition"
              >
                {t('add_another_page', lang)}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                >
                  <span className="font-bold text-emerald-800">Page {i + 1}</span>
                  <span className="text-slate-400 text-xs truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-sm"
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
              className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition"
            >
              {busy ? (lang === 'en' ? 'Extracting from all pages...' : 'వివరాలు సేకరిస్తున్నాం...') : t('analyze_all_btn', lang)}
            </button>
          </div>
        )}

        <button
          disabled={busy}
          onClick={useSampleCard}
          className="w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-4 px-6 text-base font-bold text-emerald-900 shadow-sm hover:bg-emerald-100 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? (lang === 'en' ? 'Processing sample...' : 'ప్రాసెస్ చేస్తున్నాం...') : t('use_sample_btn', lang)}
        </button>
      </div>

      {/* RBI Regulatory & Multi-page Explainer */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-xs sm:text-sm text-slate-600 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <span>🏛️ RBI Key Fact Statement (KFS) Rule:</span>
        </div>
        <p className="leading-relaxed">
          {lang === 'en'
            ? 'Under RBI Circular RBI/2023-24/139, lenders must provide a 1-page Key Fact Statement (KFS) on Page 1 or 2 summarizing all APR, fees, and net disbursal.'
            : lang === 'hi'
            ? 'आरबीआई परिपत्र RBI/2023-24/139 के तहत, ऋणदाताओं को सभी ब्याज दरों, शुल्कों और निवल संवितरण का सारांश देते हुए 1 पृष्ठ का केएफएस प्रदान करना अनिवार्य है।'
            : 'ఆర్బీఐ సర్క్యులర్ RBI/2023-24/139 ప్రకారం, బ్యాంకులు తప్పనిసరిగా మొదటి పేజీలోనే 1-పేజీ KFS స్టేట్‌మెంట్‌ను అందించాలి.'}
        </p>
        <p className="leading-relaxed text-slate-500 text-xs">
          {lang === 'en'
            ? '• If you have the KFS summary page, scanning just that 1 page is enough! • If the lender gave a 10+ page agreement without a KFS, snap all pages. Ardham scans across all pages to hunt down hidden charges.'
            : lang === 'hi'
            ? '• यदि आपके पास केएफएस पृष्ठ है, तो केवल वह 1 पृष्ठ स्कैन करना पर्याप्त है। • यदि 10+ पृष्ठों का अनुबंध है, तो सभी पृष्ठ स्कैन करें।'
            : '• మీ వద్ద KFS సారాంశ పేజీ ఉంటే, కేవలం ఆ 1 పేజీని స్కాన్ చేస్తే సరిపోతుంది! • 10+ పేజీల ఒప్పందం ఉంటే అన్ని పేజీలను ఫోటో తీయండి.'}
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

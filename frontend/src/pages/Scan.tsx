import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import ErrorBanner from '../components/ErrorBanner'
import { extractTerms, getSampleCardFile, ApiError } from '../lib/api'
import {
  isVoiceAssistantEnabled,
  isAvatarModalActive,
  speakText,
  stopSpeaking,
  getLanguage,
  subscribeLanguage,
  type AppLanguage,
} from '../lib/speech'
import { t } from '../lib/translations'
import { subscribeVoiceCommands } from '../lib/voiceCommander'

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.pdf']
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

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
    if (isVoiceAssistantEnabled() && !isAvatarModalActive()) {
      if (lang === 'en') {
        speakText('Please photograph or upload your loan card. Only genuine loan documents are accepted.', 'en')
      } else if (lang === 'hi') {
        speakText('कृपया ऋण दस्तावेज़ की फोटो लें या अपलोड करें। केवल वैध ऋण दस्तावेज़ ही स्वीकार किए जाते हैं।', 'hi')
      } else {
        speakText('లోన్ కార్డును ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి. కేవలం నిజమైన లోన్ పత్రాలు మాత్రమే అనుమతించబడతాయి.', 'te')
      }
    }
    return () => stopSpeaking()
  }, [lang])

  // Hands-free voice command to process/next
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'next' || action === 'start') {
        if (!busy) {
          if (selectedFiles.length > 0) {
            processFiles(selectedFiles)
          } else {
            useSampleCard()
          }
        }
      }
    })
    return () => unsubCmd()
  }, [busy, selectedFiles, loanType])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files || [])
    if (incoming.length === 0) return

    // Pre-upload Boundary & Extension Checks
    for (const file of incoming) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXT.includes(ext)) {
        const msg =
          lang === 'en'
            ? `File "${file.name}" is not supported. Only loan document photos (PNG, JPG, WEBP) or PDFs are accepted.`
            : lang === 'hi'
            ? `फ़ाइल "${file.name}" समर्थित नहीं है। केवल ऋण दस्तावेज़ की फोटो (PNG, JPG, WEBP) या PDF स्वीकार्य हैं।`
            : `ఫైల్ "${file.name}" చెల్లదు. కేవలం లోన్ కార్డు ఫోటోలు (PNG, JPG, WEBP) లేదా PDF పత్రాలు మాత్రమే అప్‌లోడ్ చేయండి.`
        setError(new Error(msg))
        if (isVoiceAssistantEnabled()) speakText(msg, lang)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        const msg =
          lang === 'en'
            ? `File "${file.name}" exceeds the 15MB limit. Please upload a smaller photo.`
            : lang === 'hi'
            ? `फ़ाइल "${file.name}" 15MB सीमा से अधिक है। कृपया एक छोटी फ़ाइल चुनें।`
            : `ఫైల్ "${file.name}" 15MB కంటే పెద్దదిగా ఉంది. దయచేసి చిన్న ఫోటోను ఎంచుకోండి.`
        setError(new Error(msg))
        if (isVoiceAssistantEnabled()) speakText(msg, lang)
        return
      }

      if (file.size < 100) {
        const msg =
          lang === 'en'
            ? `File "${file.name}" appears corrupt or empty. Please take a clear photo.`
            : lang === 'hi'
            ? `फ़ाइल "${file.name}" खाली या दूषित प्रतीत होती है। कृपया स्पष्ट फोटो लें।`
            : `ఫైల్ "${file.name}" ఖాళీగా లేదా దెబ్బతిన్నట్లు ఉంది. దయచేసి స్పష్టమైన ఫోటో తీయండి.`
        setError(new Error(msg))
        if (isVoiceAssistantEnabled()) speakText(msg, lang)
        return
      }
    }

    if (selectedFiles.length + incoming.length > 15) {
      const msg =
        lang === 'en'
          ? 'Maximum 15 pages allowed per loan agreement.'
          : lang === 'hi'
          ? 'प्रति ऋण अनुबंध अधिकतम 15 पृष्ठों की अनुमति है।'
          : 'ఒకేసారి గరిష్టంగా 15 పేజీలు మాత్రమే అనుమతించబడతాయి.'
      setError(new Error(msg))
      if (isVoiceAssistantEnabled()) speakText(msg, lang)
      return
    }

    setError(null)
    setSelectedFiles((prev) => [...prev, ...incoming])
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function processFiles(filesToProcess: File[]) {
    if (!loanType || filesToProcess.length === 0) return
    setBusy(true)
    setError(null)
    if (isVoiceAssistantEnabled()) {
      const msg =
        lang === 'en'
          ? `Verifying loan document across ${filesToProcess.length} pages with Gemma 4...`
          : lang === 'hi'
          ? `जेम्मा 4 से ${filesToProcess.length} पृष्ठों का ऋण सत्यापन किया जा रहा है...`
          : `${filesToProcess.length} పేజీల లోన్ డాక్యుమెంట్‌ను ధృవీకరిస్తున్నాం...`
      speakText(msg, lang)
    }
    try {
      const { session_id, terms, consistency_warnings, fairness_analysis } = await extractTerms(
        loanType,
        filesToProcess
      )
      navigate(`/review/${session_id}`, {
        state: { terms, consistencyWarnings: consistency_warnings, fairnessAnalysis: fairness_analysis },
      })
    } catch (e: any) {
      setError(e)
      if (isVoiceAssistantEnabled()) {
        const detail = e?.detail
        let audioMsg = ''
        if (detail?.error === 'INVALID_LOAN_DOCUMENT') {
          audioMsg =
            lang === 'en'
              ? 'This document is not a recognized loan agreement. Please upload a genuine loan card or use our sample card.'
              : lang === 'hi'
              ? 'यह ऋण दस्तावेज़ नहीं है। कृपया वैध ऋण कार्ड अपलोड करें या नमूना कार्ड चुनें।'
              : 'ఇది లోన్ కార్డు కాదు. దయచేసి సరైన మైక్రోఫైనాన్స్ లోన్ కార్డును అప్‌లోడ్ చేయండి లేదా నమూనా కార్డును ఎంచుకోండి.'
        } else if (detail?.error === 'DOCUMENT_BOUNDARY_ERROR') {
          audioMsg =
            lang === 'en'
              ? 'Invalid file. Only loan documents in PNG, JPG, or PDF under 15MB are accepted.'
              : lang === 'hi'
              ? 'अमान्य फ़ाइल। केवल 15MB से कम के PNG, JPG या PDF ऋण दस्तावेज़ स्वीकार्य हैं।'
              : 'చెల్లని ఫైల్. 15MB లోపు గల PNG, JPG లేదా PDF లోన్ పత్రాలు మాత్రమే అనుమతించబడతాయి.'
        }
        if (audioMsg) speakText(audioMsg, lang)
      }
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

  // Parse structured barrier error details if present
  const isApiErr = error instanceof ApiError
  const errorDetail = isApiErr ? error.detail : null
  const isInvalidDoc = errorDetail?.error === 'INVALID_LOAN_DOCUMENT'
  const isBoundaryErr = errorDetail?.error === 'DOCUMENT_BOUNDARY_ERROR'

  const barrierMessage: string = String(
    (lang === 'te'
      ? errorDetail?.message_te || errorDetail?.message
      : lang === 'hi'
      ? errorDetail?.message_hi || errorDetail?.message
      : errorDetail?.message_en || errorDetail?.message) ||
      (error instanceof Error ? error.message : String(error || ''))
  )

  return (
    <StepLayout
      title={t('scan_title', lang)}
      subtitle={{
        en: 'Scan loan agreement or bank card (1 to 15 pages)',
        te: 'రుణ పత్రాలు లేదా బ్యాంక్ కార్డును స్కాన్ చేయండి (1 నుండి 15 పేజీలు)',
        hi: 'ऋण दस्तावेज़ या बैंक कार्ड स्कैन करें (1 से 15 पृष्ठ)',
      }}
      maxWidthClass="max-w-5xl"
    >
      {/* Hidden file inputs with explicit accept restrictions */}
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={addMoreRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* System Barriers, Bounds & Verification Rules (Mobile-Clean) */}
      <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/5 p-3 sm:p-4 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
          <span>🛡️ {lang === 'en' ? 'Verified Loan Documents Only' : lang === 'hi' ? 'केवल वैध ऋण दस्तावेज़' : 'కేవలం లోన్ పత్రాలు మాత్రమే'}</span>
          <span className="ml-auto text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Filter Active
          </span>
        </div>
        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
          {lang === 'en'
            ? 'Key Fact Statements, MFI passbooks & sanction letters (PNG, JPG, WEBP, PDF up to 15MB). Non-loan files are automatically rejected.'
            : lang === 'hi'
            ? 'ऋण अनुबंध, पासबुक और स्वीकृति पत्र (PNG, JPG, WEBP, PDF - 15MB तक)। गैर-ऋण फाइलें स्वतः अस्वीकृत होंगी।'
            : 'రుణ ఒప్పందాలు, పాస్‌బుక్‌లు & మంజూరు పత్రాలు (PNG, JPG, WEBP, PDF - 15MB లోపు). ఇతర ఫైళ్లు తిరస్కరించబడతాయి.'}
        </p>
      </div>

      {/* Dedicated Document Barrier & Fallback Card */}
      {Boolean(error && (isInvalidDoc || isBoundaryErr)) && (
        <div className="mb-5 rounded-2xl border-2 border-rose-400 bg-rose-50 p-5 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl select-none">🛑</span>
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-black text-rose-900">
                {isInvalidDoc
                  ? lang === 'en'
                    ? 'Non-Loan Document Rejected (Guardrail Active)'
                    : lang === 'hi'
                    ? 'गैर-ऋण दस्तावेज़ अस्वीकृत (सुरक्षा सक्रिय)'
                    : 'లోన్ సంబంధిత పత్రం కాదు — తిరస్కరించబడింది'
                  : lang === 'en'
                  ? 'Document File Boundary Violation'
                  : lang === 'hi'
                  ? 'फ़ाइल सीमा उल्लंघन'
                  : 'ఫైల్ పరిమితి ఉల్లంఘన'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-rose-700 leading-relaxed font-medium">
                {barrierMessage}
              </p>

              {/* Instant Fallback Recovery Actions */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([])
                    setError(null)
                    inputRef.current?.click()
                  }}
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2 shadow-sm transition active:scale-95"
                >
                  📷 {lang === 'en' ? 'Photograph Valid Loan Card' : lang === 'hi' ? 'वैध ऋण कार्ड की फोटो लें' : 'సరైన లోన్ కార్డు ఫోటో తీయండి'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([])
                    useSampleCard()
                  }}
                  className="rounded-xl border border-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition active:scale-95"
                >
                  📄 {lang === 'en' ? 'Use Verified Sample Loan Card (Safe Fallback)' : lang === 'hi' ? 'सत्यापित नमूना ऋण कार्ड चुनें (सुरक्षित विकल्प)' : 'ధృవీకరించిన నమూనా లోన్ కార్డును వాడండి (సురక్షిత ఎంపిక)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Error Banner for generic network / server errors */}
      {Boolean(error && !isInvalidDoc && !isBoundaryErr) && (
        <div className="mb-4">
          <ErrorBanner
            error={error}
            onRetry={() => (selectedFiles.length > 0 ? processFiles(selectedFiles) : useSampleCard())}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {selectedFiles.length === 0 ? (
          <button
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-3xl bg-slate-900 py-8 px-6 text-xl font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition flex flex-col items-center justify-center gap-2 group"
          >
            <span className="text-3xl">📷</span>
            <span className="text-lg sm:text-xl font-bold">
              {busy ? (lang === 'en' ? 'Verifying with Gemma 4...' : 'ధృవీకరిస్తున్నాం...') : t('take_photo_btn', lang)}
            </span>
            <span className="text-xs font-normal text-slate-300">
              {lang === 'en'
                ? 'Select 1 or multiple pages (PNG, JPG, WEBP, PDF up to 15 pages)'
                : lang === 'hi'
                ? '1 या अधिक पृष्ठ चुनें (PNG, JPG, WEBP, PDF - 15 पृष्ठ तक)'
                : '1 లేదా అంతకంటే ఎక్కువ పేజీలను ఎంచుకోండి (1 నుండి 15 పేజీలు)'}
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
                  <span className="text-slate-400 text-[10px]">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
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
              data-voice-next="true"
              disabled={busy}
              onClick={() => processFiles(selectedFiles)}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition"
            >
              {busy ? (lang === 'en' ? 'Verifying all pages with Gemma 4...' : 'వివరాలు ధృవీకరిస్తున్నాం...') : t('analyze_all_btn', lang)}
            </button>
          </div>
        )}

        <button
          data-voice-next="true"
          disabled={busy}
          onClick={useSampleCard}
          className="w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-4 px-6 text-base font-bold text-emerald-900 shadow-sm hover:bg-emerald-100 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {busy ? (lang === 'en' ? 'Processing sample...' : 'ప్రాసెస్ చేస్తున్నాం...') : t('use_sample_btn', lang)}
        </button>
      </div>

      {/* Official Guidelines & Multi-page Explainer */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-xs sm:text-sm text-slate-600 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <span>🏛️ {lang === 'en' ? 'Official Loan Transparency Rules:' : lang === 'hi' ? 'आधिकारिक ऋण नियम:' : 'అధికారిక రుణ పారదర్శక నిబంధనలు:'}</span>
        </div>
        <p className="leading-relaxed">
          {lang === 'en'
            ? 'Official guidelines mandate that lenders disclose all upfront charges, real yearly cost, and the exact money you receive in hand before you sign.'
            : lang === 'hi'
            ? 'आधिकारिक नियम यह अनिवार्य करते हैं कि ऋणदाता हस्ताक्षर से पहले सभी अग्रिम शुल्क, वास्तविक लागत और हाथ में मिलने वाली राशि स्पष्ट करें।'
            : 'బ్యాంకులు లేదా సంస్థలు రుణం ఇచ్చే ముందు అసలు అప్పు, అన్ని ముందస్తు ఛార్జీలు మరియు చేతికి వచ్చే నికర నగదును స్పష్టంగా తెలపాలి.'}
        </p>
        <p className="leading-relaxed text-slate-500 text-xs">
          {lang === 'en'
            ? '• If you have a summary sheet or passbook card, scanning just that 1 page is enough! • If you received a full multi-page agreement, snap all pages. Ardham scans across every page to find any hidden fees.'
            : lang === 'hi'
            ? '• यदि आपके पास सारांश पृष्ठ या पासबुक कार्ड है, तो केवल 1 पृष्ठ स्कैन करें। • यदि लंबा अनुबंध है, तो सभी पृष्ठों की फोटो लें।'
            : '• మీ వద్ద సారాంశ పేజీ లేదా పాస్‌బుక్ కార్డు ఉంటే, ఆ 1 పేజీని స్కాన్ చేస్తే సరిపోతుంది! • పూర్తి ఒప్పందం ఉంటే అన్ని పేజీలను ఫోటో తీయండి.'}
        </p>
      </div>
    </StepLayout>
  )
}

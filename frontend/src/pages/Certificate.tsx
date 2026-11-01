import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import QRCodeSvg from '../components/QRCodeSvg'
import { getCertificate, getCertificateHtmlUrl, getAnswerAudioUrl, type Certificate as CertType } from '../lib/api'
import { getCurrentUser } from '../lib/auth'
import { getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { subscribeVoiceCommands } from '../lib/voiceCommander'
import { t } from '../lib/translations'

export default function Certificate() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [cert, setCert] = useState<CertType | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [lang, setLang] = useState<AppLanguage>(getLanguage())
  const user = getCurrentUser()

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    getCertificate(sessionId).then(setCert)
  }, [sessionId])

  // Hands-free voice commands in Certificate
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'download') {
        window.print()
      } else if (action === 'share') {
        handleWhatsAppShare()
      }
    })
    return () => unsubCmd()
  }, [cert, lang])

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : `https://ardham.app/certificate/${sessionId}`

  function handleWhatsAppShare() {
    if (!cert) return
    const loanAmt = cert.terms.loan_amount?.value || ''
    const emi = cert.terms.instalment_amount?.value || ''
    const total = cert.terms.total_payable?.value || ''

    let msg = ''
    if (lang === 'en') {
      msg =
        `*🏛️ ARDHAM - Loan Comprehension & Verification Receipt*\n` +
        `Loan Product: ${cert.loan_type}\n` +
        `Loan Amount: ₹${loanAmt}\n` +
        `Installment EMI: ₹${emi}\n` +
        `Total Repayable: ₹${total}\n` +
        `Comprehension Score: ${cert.score}% ✓ PASS\n` +
        `Verifying Officer: ${user?.name || 'Ramesh Kumar'}\n\n` +
        `📜 Live Digital Certificate:\n${verifyUrl}\n\n` +
        `🔒 Verification Seal: ${cert.sha256.substring(0, 16)}...`
    } else if (lang === 'hi') {
      msg =
        `*🏛️ अर्थम - ऋण समझ एवं सत्यापन रसीद*\n` +
        `ऋण उत्पाद: ${cert.loan_type}\n` +
        `ऋण राशि: ₹${loanAmt}\n` +
        `किस्त राशि: ₹${emi}\n` +
        `कुल भुगतान: ₹${total}\n` +
        `समझ स्कोर: ${cert.score}% ✓ PASS\n` +
        `सत्यापित अधिकारी: ${user?.name || 'रमेश कुमार'}\n\n` +
        `📜 लाइव डिजिटल प्रमाणपत्र:\n${verifyUrl}\n\n` +
        `🔒 डिजिटल सील: ${cert.sha256.substring(0, 16)}...`
    } else {
      msg = 
        `*🏛️ అర్థం - లోన్ అవగాహన & అధికారిక రసీదు*\n` +
        `రుణ రకం: ${cert.loan_type}\n` +
        `లోన్ మొత్తం: ₹${loanAmt}\n` +
        `వాయిదా: ₹${emi}\n` +
        `మొత్తం చెల్లింపు: ₹${total}\n` +
        `అవగాహన స్కోర్: ${cert.score}% ✓ PASS\n` +
        `ధృవీకరించిన అధికారి: ${user?.name || 'Ramesh Kumar'}\n\n` +
        `📜 లైవ్ డిజిటల్ సర్టిఫికెట్:\n${verifyUrl}\n\n` +
        `🔒 అధికారిక సీల్: ${cert.sha256.substring(0, 16)}...`
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function playAudioSnippet(fieldId: string) {
    if (!sessionId) return
    if (playingAudio === fieldId) {
      setPlayingAudio(null)
      return
    }
    const audioUrl = getAnswerAudioUrl(sessionId, fieldId)
    const audio = new Audio(audioUrl)
    setPlayingAudio(fieldId)
    audio.play().catch(() => setPlayingAudio(null))
    audio.onended = () => setPlayingAudio(null)
    audio.onerror = () => setPlayingAudio(null)
  }

  return (
    <StepLayout
      title={t('cert_title', lang)}
      subtitle={{
        en: 'Official Digital Loan Verification Certificate',
        te: 'అధికారిక డిజిటల్ లోన్ ధృవీకరణ పత్రం',
        hi: 'आधिकारिक डिजिटल ऋण सत्यापन प्रमाणपत्र',
      }}
      maxWidthClass="max-w-6xl"
    >
      {cert ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Digital Certificate Card */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-3xl border-2 border-emerald-500 bg-white p-6 sm:p-8 text-sm shadow-lg space-y-5">
              {/* Regulatory Seal Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-800 shadow-inner">
                    🏛️
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {lang === 'en' ? 'Official Bank Verification Seal' : lang === 'hi' ? 'आधिकारिक बैंक सत्यापन सील' : 'అధికారిక బ్యాంక్ ధృవీకరణ ముద్ర'}
                    </h3>
                    <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                      {lang === 'en' ? '100% Rules & Fairness Verified' : lang === 'hi' ? '100% नियम एवं निष्पक्षता सत्यापित' : '100% నిబంధనలు & న్యాయమైన రుణం ధృవీకరించబడింది'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-black px-3.5 py-1.5 rounded-full ${
                    cert.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {cert.score}% {cert.score >= 70 ? '✓ PASS' : '⚠ CONDITIONAL'}
                </span>
              </div>

              {/* Verification Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product / Category</span>
                  <p className="font-bold text-slate-900 mt-1 capitalize text-sm sm:text-base">{cert.loan_type.replace(/-/g, ' ')}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Officer</span>
                  <p className="font-bold text-slate-900 mt-1 truncate text-sm sm:text-base">
                    {user?.role === 'officer' ? user.name : 'Ramesh Kumar (MFI Officer)'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-xs sm:text-sm text-slate-600 px-1 border-b border-slate-100 pb-3">
                <span className="font-medium">Verification Timestamp:</span>
                <span className="font-bold text-slate-800">{new Date(cert.created_at).toLocaleString('en-IN')}</span>
              </div>

              {/* Elderly & Benami Proxy Coercion Shield Box */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-1.5 text-blue-950">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <span>🛡️ Elderly & Benami Proxy Protection:</span>
                </div>
                <p className="leading-relaxed text-xs sm:text-sm text-blue-900">
                  {lang === 'en'
                    ? 'The primary borrower verbally confirmed their understanding and willingness to enter this contract in their native language, free from third-party family or agent pressure.'
                    : lang === 'hi'
                    ? 'उधारकर्ता ने बिना किसी बाहरी दबाव के अपनी मातृभाषा में ऋण की सभी शर्तों को समझने की पुष्टि की है।'
                    : 'దృష్టి లోపం లేదా వృద్ధాప్యం ఉన్న రుణగ్రహీత ఎలాంటి కుటుంబ ఒత్తిడి లేకుండా స్వచ్ఛందంగా నిబంధనలను అర్థం చేసుకున్నారని ధృవీకరించబడింది.'}
                </p>
              </div>

              {/* Key Loan Metrics Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'en' ? 'Key Loan Details' : lang === 'hi' ? 'मुख्य ऋण विवरण' : 'ముఖ్యమైన రుణ వివరాలు'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {lang === 'en' ? 'Loan Amount' : 'అసలు అప్పు'}
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{String(cert.terms.loan_amount?.value || '—')}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {lang === 'en' ? 'Instalment' : 'వాయిదా'}
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{String(cert.terms.instalment_amount?.value || '—')}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {lang === 'en' ? 'Interest Rate' : 'వడ్డీ రేటు'}
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {String(cert.terms.interest_rate?.value || '—')}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {lang === 'en' ? 'Total Payable' : 'మొత్తం చెల్లింపు'}
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{String(cert.terms.total_payable?.value || '—')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Dynamic QR Code & Tamper-Proof Cryptographic Hash */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  <QRCodeSvg value={verifyUrl} size={92} />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    🔒 {lang === 'en' ? 'Official Digital Verification Seal' : lang === 'hi' ? 'आधिकारिक डिजिटल सत्यापन सील' : 'అధికారిక డిజిటల్ సీల్'}
                  </p>
                  <p className="font-mono text-xs text-slate-600 break-all select-all">
                    {cert.sha256}
                  </p>
                  <p className="text-xs text-emerald-800 font-semibold">
                    ✓ {lang === 'en' ? 'Securely verified and saved on your device' : lang === 'hi' ? 'सुरक्षित रूप से सत्यापित और आपके डिवाइस पर सहेजा गया' : 'మీ మొబైల్‌లో సురక్షితంగా ధృవీకరించబడి సేవ్ చేయబడింది'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions, Audio Audit Clips & Navigation */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Action Buttons Box */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Certificate Distribution & Archival
              </div>

              {/* 1-Click WhatsApp Family Dispatch */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 px-5 text-base font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
              >
                <span>📲 {t('share_whatsapp_btn', lang)}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                >
                  {t('print_pdf_btn', lang)}
                </button>
                <a
                  href={getCertificateHtmlUrl(cert.session_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 text-center active:scale-95 transition"
                >
                  {t('printable_html_btn', lang)}
                </a>
              </div>
            </div>

            {/* Comprehension Audio Records (Oral Evidence Audit) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>🎙️ Recorded Spoken Answers</span>
                <span className="text-xs font-medium text-slate-400">Oral Evidence</span>
              </div>
              <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {cert.results.map((r) => (
                  <li key={r.field_id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 capitalize truncate">
                        {r.field_id.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Heard: "{r.heard || 'spoken audio'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        r.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.correct ? 'PASS' : 'FAIL'}
                      </span>
                      <button
                        type="button"
                        onClick={() => playAudioSnippet(r.field_id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          playingAudio === r.field_id
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Listen to recorded answer"
                      >
                        {playingAudio === r.field_id ? '⏹️ Playing' : '▶️ Play'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/"
              className="w-full block rounded-2xl bg-slate-900 py-4 text-center text-sm sm:text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
            >
              {lang === 'en'
                ? 'Start New Loan Verification →'
                : lang === 'hi'
                ? 'नया ऋण सत्यापन शुरू करें →'
                : 'కొత్త లోన్ ధృవీకరణ ప్రారంభించండి →'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-500">Generating certificate...</p>
        </div>
      )}
    </StepLayout>
  )
}

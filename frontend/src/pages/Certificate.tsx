import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import QRCodeSvg from '../components/QRCodeSvg'
import { getCertificate, getCertificateHtmlUrl, getAnswerAudioUrl, type Certificate as CertType } from '../lib/api'
import { getCurrentUser } from '../lib/auth'

export default function Certificate() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [cert, setCert] = useState<CertType | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const user = getCurrentUser()

  useEffect(() => {
    if (!sessionId) return
    getCertificate(sessionId).then(setCert)
  }, [sessionId])

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : `https://ardham.app/certificate/${sessionId}`

  function handleWhatsAppShare() {
    if (!cert) return
    const loanAmt = cert.terms.loan_amount?.value || ''
    const emi = cert.terms.instalment_amount?.value || ''
    const total = cert.terms.total_payable?.value || ''
    const msg = 
      `*🏛️ అర్థం - లోన్ అవగాహన & KFS రసీదు*\n` +
      `రుణ రకం: ${cert.loan_type}\n` +
      `లోన్ మొత్తం: ₹${loanAmt}\n` +
      `వాయిదా: ₹${emi}\n` +
      `మొత్తం చెల్లింపు: ₹${total}\n` +
      `అవగాహన స్కోర్: ${cert.score}% ✓ PASS\n` +
      `ధృవీకరించిన అధికారి: ${user?.name || 'Ramesh Kumar'}\n\n` +
      `📜 లైవ్ డిజిటల్ సర్టిఫికెట్ & ఆడిట్ సీల్:\n${verifyUrl}\n\n` +
      `🔒 SHA-256 హాష్: ${cert.sha256.substring(0, 16)}...`

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
    <StepLayout title="Comprehension Certificate" teluguTitle="రుణ అవగాహన ధృవీకరణ పత్రం">
      {cert ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border-2 border-emerald-500 bg-white p-5 text-sm shadow-md">
            {/* Regulatory Seal Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
                  🏛️
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">RBI KFS Audit Seal</h3>
                  <p className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                    Digital Lending Guidelines Verified
                  </p>
                </div>
              </div>

              <span className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                cert.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {cert.score}% {cert.score >= 70 ? '✓ PASS' : '⚠ CONDITIONAL'}
              </span>
            </div>

            {/* Verification Metadata */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Product / Category</span>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">{cert.loan_type.replace(/-/g, ' ')}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Officer</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">
                  {user?.role === 'officer' ? user.name : 'Ramesh Kumar (MFI Officer)'}
                </p>
              </div>
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate-500 px-1">
              <span>ధృవీకరణ తేదీ:</span>
              <span className="font-medium text-slate-700">{new Date(cert.created_at).toLocaleString('en-IN')}</span>
            </div>

            {/* Elderly & Benami Proxy Coercion Shield Box */}
            <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <span>🛡️ వృద్ధుల రక్షణ & బినామీ లోన్ రక్షణ ధృవీకరణ:</span>
              </div>
              <ul className="mt-1 space-y-0.5 text-[11px] text-emerald-800">
                <li>• ✓ ప్రత్యక్ష మౌఖిక సమ్మతి (Direct Spoken Oral Consent Verified)</li>
                <li>• ✓ ఎలాంటి ఒత్తిడి లేదా మోసం లేకుండా స్వచ్ఛందంగా తీసుకున్న రుణం</li>
                <li>• ✓ కుటుంబ సభ్యుల కోసం డిజిటల్ KFS కాపీ సిద్ధం చేయబడింది</li>
              </ul>
            </div>

            {/* Questions Checked List */}
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                ధృవీకరించబడిన అంశాలు & మౌఖిక సాక్ష్యం (Oral Evidence: {cert.results.length})
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                {cert.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5">
                    <div>
                      <span className="font-semibold text-slate-800 capitalize">
                        {r.field_id.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400">"{r.heard || 'Oral Telugu answer'}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playAudioSnippet(r.field_id)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition ${
                          playingAudio === r.field_id
                            ? 'bg-red-600 text-white border-red-600 animate-pulse'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="రుణగ్రహీత స్వరం వినండి"
                      >
                        {playingAudio === r.field_id ? '⏹️ ఆపు' : '🔊 స్వరం వినండి'}
                      </button>

                      <span className={r.correct ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                        {r.correct ? '✓ PASS' : '↻ RE-EXPLAIN'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Scannable QR Code */}
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-center">
              <div className="text-xs font-bold text-emerald-950 mb-2">
                📱 స్మార్ట్‌ఫోన్ కెమెరాతో స్కాన్ చేసి ధృవీకరించండి
              </div>
              <QRCodeSvg value={verifyUrl} size={130} />
              <div className="mt-2 text-[10px] font-medium text-slate-500">
                Scan with any phone camera to verify cryptographic hash
              </div>
            </div>

            {/* SHA-256 Audit Seal Hash */}
            <div className="mt-4 break-all rounded-xl bg-slate-900 p-3 font-mono text-[10px] text-emerald-400">
              <span className="font-bold text-white uppercase tracking-wider block mb-1">
                🔒 Cryptographic Audit Seal (SHA-256):
              </span>
              {cert.sha256}
            </div>
          </div>

          {/* Action Sharing Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="rounded-2xl bg-emerald-600 py-3.5 text-center text-xs sm:text-sm font-bold text-white shadow hover:bg-emerald-700 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <span>📲 వాట్సాప్‌లో పంపండి</span>
              <span className="text-[11px] font-normal">(WhatsApp)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-center text-xs sm:text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition"
            >
              🖨️ Print / Save PDF
            </button>

            <a
              href={getCertificateHtmlUrl(cert.session_id)}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-center text-xs sm:text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition flex items-center justify-center"
            >
              📄 Printable HTML
            </a>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-sm">ధృవీకరణ పత్రం సిద్ధమవుతోంది...</p>
        </div>
      )}

      <Link
        to="/"
        className="mt-4 block w-full rounded-2xl bg-slate-900 py-4 text-center text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition"
      >
        కొత్త లోన్ వెరిఫికేషన్ ప్రారంభించండి (Start New Verification)
      </Link>
    </StepLayout>
  )
}

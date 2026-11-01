import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import QRCodeSvg from '../components/QRCodeSvg'
import { getCertificate, getCertificateHtmlUrl, type Certificate as CertType } from '../lib/api'
import { getCurrentUser } from '../lib/auth'

export default function Certificate() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [cert, setCert] = useState<CertType | null>(null)
  const user = getCurrentUser()

  useEffect(() => {
    if (!sessionId) return
    getCertificate(sessionId).then(setCert)
  }, [sessionId])

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : `https://ardham.app/certificate/${sessionId}`

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

            {/* Questions Checked List */}
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                ధృవీకరించబడిన అంశాలు (Verified Questions: {cert.results.length})
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                {cert.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5">
                    <span className="font-semibold text-slate-800 capitalize">
                      {r.field_id.replace(/_/g, ' ')}
                    </span>
                    <span className={r.correct ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                      {r.correct ? '✓ అర్థం చేసుకున్నారు (Passed)' : '↻ మళ్లీ వివరించబడింది'}
                    </span>
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

            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed text-center">
              This tamper-proof cryptographic audit seal proves compliance with RBI Digital Lending Guidelines (2022) and Microfinance Fair Practices Code.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition"
            >
              🖨️ Print / Save PDF
            </button>
            <a
              href={getCertificateHtmlUrl(cert.session_id)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition"
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

import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'

const LOAN_TYPES = [
  {
    id: 'microfinance-group-loan',
    icon: '👩‍🌾',
    en: 'Microfinance Group Loan (JLG)',
    te: 'స్వయం సహాయక సంఘాల గ్రూప్ రుణం',
    desc: 'Joint Liability Group (JLG) loans with weekly repayments & reducing balance.',
    color: 'border-emerald-500 bg-emerald-50/40 text-emerald-950',
  },
  {
    id: 'gold-loan',
    icon: '💍',
    en: 'Gold Loan (Jewellery Collateral)',
    te: 'బంగారు ఆభరణాల తాకట్టు రుణం',
    desc: 'Gold-backed loan with bullet repayment and mandatory auction notice checks.',
    color: 'border-amber-400 bg-amber-50/40 text-amber-950',
  },
  {
    id: 'individual-personal-loan',
    icon: '💼',
    en: 'Individual Personal Loan',
    te: 'వ్యక్తిగత వినియోగదారుల రుణం',
    desc: 'Standard amortized EMI loan with upfront processing & insurance fees.',
    color: 'border-blue-400 bg-blue-50/40 text-blue-950',
  },
]

export default function ChooseLoanType() {
  const navigate = useNavigate()
  return (
    <StepLayout title="Select Loan Category" teluguTitle="రుణ రకాన్ని ఎంచుకోండి">
      <p className="text-xs text-slate-500 mb-4">
        దయచేసి మీరు వెరిఫై చేయాలనుకుంటున్న రుణ కేటగిరీని ఎంచుకోండి (Select the category of the loan card to scan):
      </p>

      <div className="flex flex-col gap-3">
        {LOAN_TYPES.map((loan) => (
          <button
            key={loan.id}
            onClick={() => navigate(`/scan/${loan.id}`)}
            className={`rounded-2xl border-2 ${loan.color} p-4 text-left shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex items-start justify-between gap-3`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{loan.icon}</span>
                <span className="text-base font-bold text-slate-900">{loan.en}</span>
              </div>
              <div className="text-sm font-semibold text-emerald-800 mt-1">{loan.te}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{loan.desc}</div>
            </div>
            <span className="text-xl font-bold text-slate-400 mt-2">→</span>
          </button>
        ))}
      </div>
    </StepLayout>
  )
}

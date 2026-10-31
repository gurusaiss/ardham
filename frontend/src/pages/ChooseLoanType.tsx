import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'

const LOAN_TYPES = [
  { id: 'microfinance-group-loan', en: 'Group Loan (JLG)', te: 'గ్రూప్ రుణం' },
  { id: 'gold-loan', en: 'Gold Loan', te: 'బంగారు రుణం' },
  { id: 'individual-personal-loan', en: 'Personal Loan', te: 'వ్యక్తిగత రుణం' },
]

export default function ChooseLoanType() {
  const navigate = useNavigate()
  return (
    <StepLayout title="Choose loan type" teluguTitle="రుణ రకాన్ని ఎంచుకోండి">
      <div className="flex flex-col gap-3">
        {LOAN_TYPES.map((loan) => (
          <button
            key={loan.id}
            onClick={() => navigate(`/scan/${loan.id}`)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-left shadow-sm active:scale-[0.98]"
          >
            <div className="text-lg font-medium">{loan.en}</div>
            <div className="text-sm text-slate-500">{loan.te}</div>
          </button>
        ))}
      </div>
    </StepLayout>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { subscribeVoiceCommands } from '../lib/voiceCommander'
import { t } from '../lib/translations'

const LOAN_TYPES = [
  {
    id: 'microfinance-group-loan',
    icon: '👩‍🌾',
    en: 'Self Help Group Loan (SHG)',
    te: 'స్వయం సహాయక సంఘాల గ్రూప్ రుణం',
    hi: 'स्वयं सहायता समूह ऋण (SHG)',
    desc_en: 'Self Help Group loan with easy weekly repayments & group support.',
    desc_te: 'వారపు వాయిదాలు, సులభ వడ్డీ లెక్కంపు, మరియు గ్రూప్ మద్దతు కలిగిన రుణం.',
    desc_hi: 'आसान साप्ताहिक किश्तों और समूह सहयोग के साथ ऋण।',
    color: 'border-emerald-500 bg-emerald-50/40 text-emerald-950',
  },
  {
    id: 'gold-loan',
    icon: '💍',
    en: 'Gold Jewellery Loan',
    te: 'బంగారు ఆభరణాల తాకట్టు రుణం',
    hi: 'स्वर्ण आभूषण ऋण (गोल्ड लोन)',
    desc_en: 'Gold jewelry loan with simple interest and safety against sudden auction.',
    desc_te: 'బంగారు ఆభరణాల తాకట్టుపై రుణం, సరళమైన వడ్డీ చెల్లింపు, మరియు వేలం హెచ్చరికల రక్షణ.',
    desc_hi: 'सोने के गहनों पर आसान ब्याज और सुरक्षित ऋण।',
    color: 'border-amber-400 bg-amber-50/40 text-amber-950',
  },
  {
    id: 'individual-personal-loan',
    icon: '💼',
    en: 'Individual Personal Loan',
    te: 'వ్యక్తిగత వినియోగదారుల రుణం',
    hi: 'व्यक्तिगत ऋण (पर्सनल लोन)',
    desc_en: 'Regular monthly installment loan with clear fee breakdown.',
    desc_te: 'నెలవారీ సమాన వాయిదాలు, స్పష్టమైన ప్రాసెసింగ్ ఫీజు మరియు రక్షణతో కూడిన రుణం.',
    desc_hi: 'मासिक ईएमआई और स्पष्ट शुल्कों के साथ व्यक्तिगत ऋण।',
    color: 'border-blue-400 bg-blue-50/40 text-blue-950',
  },
]

export default function ChooseLoanType() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  // Hands-free voice selection: saying "next" picks default JLG loan
  useEffect(() => {
    const unsubCmd = subscribeVoiceCommands((action) => {
      if (action === 'next' || action === 'start') {
        navigate('/scan/microfinance-group-loan')
      }
    })
    return () => unsubCmd()
  }, [navigate])

  return (
    <StepLayout
      title={lang === 'en' ? 'Select Loan Category' : lang === 'hi' ? 'ऋण श्रेणी चुनें' : 'రుణ కేటగిరీని ఎంచుకోండి'}
      subtitle={{
        en: 'Select the category of loan document to verify',
        te: 'మీరు వెరిఫై చేయాలనుకుంటున్న రుణ రకాన్ని ఎంచుకోండి',
        hi: 'सत्यापित करने के लिए ऋण दस्तावेज़ की श्रेणी चुनें',
      }}
      maxWidthClass="max-w-5xl"
    >
      <p className="text-sm text-slate-500 mb-6">
        {lang === 'en'
          ? 'Choose the product category of the loan card to scan:'
          : lang === 'hi'
          ? 'स्कैन करने के लिए ऋण दस्तावेज़ की श्रेणी चुनें:'
          : 'స్కాన్ చేయడానికి లోన్ కార్డు రకాన్ని ఎంచుకోండి:'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        {LOAN_TYPES.map((loan) => (
          <button
            key={loan.id}
            onClick={() => navigate(`/scan/${loan.id}`)}
            className={`rounded-2xl sm:rounded-3xl border-2 ${loan.color} p-4 sm:p-6 text-left shadow-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex flex-col justify-between`}
          >
            <div>
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{loan.icon}</div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                {lang === 'en' ? loan.en : lang === 'hi' ? loan.hi : loan.te}
              </div>
              <div className="text-xs text-slate-600 mt-1.5 sm:mt-2 leading-relaxed">
                {lang === 'en' ? loan.desc_en : lang === 'hi' ? loan.desc_hi : loan.desc_te}
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex items-center justify-between text-xs font-bold text-emerald-800 pt-2.5 sm:pt-3 border-t border-emerald-200/60">
              <span>{t('step_scan', lang)} →</span>
              <span>⚡ {lang === 'en' ? 'Start' : lang === 'hi' ? 'शुरू करें' : 'ప్రారంభించండి'}</span>
            </div>
          </button>
        ))}
      </div>
    </StepLayout>
  )
}

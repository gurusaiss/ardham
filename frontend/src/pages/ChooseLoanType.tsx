import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../components/StepLayout'
import { getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'
import { t } from '../lib/translations'

const LOAN_TYPES = [
  {
    id: 'microfinance-group-loan',
    icon: '👩‍🌾',
    en: 'Microfinance Group Loan (JLG)',
    te: 'స్వయం సహాయక సంఘాల గ్రూప్ రుణం',
    hi: 'माइक्रोफाइनेंस समूह ऋण (JLG)',
    desc_en: 'Joint Liability Group loans with weekly repayments & reducing balance.',
    desc_te: 'వారపు వాయిదాలు, తగ్గే వడ్డీ లెక్కంపు, మరియు గ్రూప్ బాధ్యత కలిగిన రుణం.',
    desc_hi: 'साप्ताहिक किश्तों और घटते ब्याज के साथ समूह ऋण।',
    color: 'border-emerald-500 bg-emerald-50/40 text-emerald-950',
  },
  {
    id: 'gold-loan',
    icon: '💍',
    en: 'Gold Loan (Jewellery Collateral)',
    te: 'బంగారు ఆభరణాల తాకట్టు రుణం',
    hi: 'स्वर्ण आभूषण ऋण (गोल्ड लोन)',
    desc_en: 'Gold-backed loan with bullet repayment and mandatory auction notice checks.',
    desc_te: 'బంగారం తాకట్టుపై రుణం, బులెట్ వడ్డీ చెల్లింపు, మరియు వేలం హెచ్చరికల ఆడిట్.',
    desc_hi: 'सोने के बदले ऋण, एकमुश्त भुगतान और अनिवार्य नीलामी नोटिस जांच।',
    color: 'border-amber-400 bg-amber-50/40 text-amber-950',
  },
  {
    id: 'individual-personal-loan',
    icon: '💼',
    en: 'Individual Personal Loan',
    te: 'వ్యక్తిగత వినియోగదారుల రుణం',
    hi: 'व्यक्तिगत ऋण (पर्सनल लोन)',
    desc_en: 'Standard amortized EMI loan with upfront processing & insurance fees.',
    desc_te: 'నెలవారీ ఈఎంఐ, ముందస్తు ప్రాసెసింగ్ ఫీజు మరియు ఇన్సూరెన్స్ తనిఖీలతో రుణం.',
    desc_hi: 'मासिक ईएमआई और अग्रिम प्रोसेसिंग व बीमा शुल्क के साथ व्यक्तिगत ऋण।',
    color: 'border-blue-400 bg-blue-50/40 text-blue-950',
  },
]

export default function ChooseLoanType() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  return (
    <StepLayout
      title={lang === 'en' ? 'Select Loan Category' : lang === 'hi' ? 'ऋण श्रेणी चुनें' : 'రుణ కేటగిరీని ఎంచుకోండి'}
      teluguTitle="మీరు వెరిఫై చేయాలనుకుంటున్న రుణ రకాన్ని ఎంచుకోండి"
      maxWidthClass="max-w-5xl"
    >
      <p className="text-sm text-slate-500 mb-6">
        {lang === 'en'
          ? 'Select the category of the loan card to scan with Gemma 4:'
          : lang === 'hi'
          ? 'जेम्मा 4 के साथ स्कैन करने के लिए ऋण दस्तावेज़ की श्रेणी चुनें:'
          : 'జెమ్మా 4 తో స్కాన్ చేయడానికి లోన్ కార్డు రకాన్ని ఎంచుకోండి:'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LOAN_TYPES.map((loan) => (
          <button
            key={loan.id}
            onClick={() => navigate(`/scan/${loan.id}`)}
            className={`rounded-3xl border-2 ${loan.color} p-6 text-left shadow-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex flex-col justify-between`}
          >
            <div>
              <div className="text-3xl mb-2">{loan.icon}</div>
              <div className="text-base font-black text-slate-900">
                {lang === 'en' ? loan.en : lang === 'hi' ? loan.hi : loan.te}
              </div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">
                {lang === 'en' ? loan.te : loan.en}
              </div>
              <div className="text-xs text-slate-600 mt-3 leading-relaxed">
                {lang === 'en' ? loan.desc_en : lang === 'hi' ? loan.desc_hi : loan.desc_te}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-emerald-800 pt-3 border-t border-emerald-200/60">
              <span>{t('step_scan', lang)} →</span>
              <span>⚡ Start</span>
            </div>
          </button>
        ))}
      </div>
    </StepLayout>
  )
}

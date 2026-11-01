import { useState, useEffect } from 'react'
import { speakText, getLanguage, subscribeLanguage, type AppLanguage } from '../lib/speech'

interface Props {
  loanAmount: number
  instalmentAmount: number
  penalty: number
  loanType: string
}

export default function LoanSimulator({
  loanAmount,
  instalmentAmount,
  penalty,
  loanType,
}: Props) {
  const [scenario, setScenario] = useState<'on_time' | 'late_1_week' | 'late_2_months' | 'early_pay'>('on_time')
  const [lang, setLang] = useState<AppLanguage>(getLanguage())

  useEffect(() => {
    return subscribeLanguage(setLang)
  }, [])

  const isGold = loanType.includes('gold')

  function getScenarioDetails() {
    if (scenario === 'late_1_week') {
      const extraPenalty = penalty || (isGold ? 200 : 20)
      if (lang === 'en') {
        return {
          title: 'What if 1 week late?',
          penaltyText: `₹${extraPenalty} late fee penalty applies`,
          status: 'Minor Risk',
          statusColor: 'text-amber-800 bg-amber-100 border-amber-300',
          explanation: `A 1-week delay costs an additional ₹${extraPenalty} penalty fee. However, no legal notice or gold auction will occur.`,
          speech: `If delayed by one week, you must pay ${extraPenalty} rupees penalty fee. No legal action will occur.`,
        }
      }
      if (lang === 'hi') {
        return {
          title: 'यदि 1 सप्ताह की देरी हो तो?',
          penaltyText: `₹${extraPenalty} अतिरिक्त जुर्माना लगेगा`,
          status: 'मामूली जोखिम',
          statusColor: 'text-amber-800 bg-amber-100 border-amber-300',
          explanation: `1 सप्ताह की देरी पर ₹${extraPenalty} जुर्माना देना होगा। कोई कानूनी कार्रवाई या नीलामी नहीं होगी।`,
          speech: `यदि एक सप्ताह की देरी होती है, तो ${extraPenalty} रुपये का जुर्माना लगेगा। कोई कानूनी समस्या नहीं होगी।`,
        }
      }
      return {
        title: 'ఒక వారం ఆలస్యమైతే (What if 1 week late?)',
        penaltyText: `₹${extraPenalty} అదనపు జరిమానా పడుతుంది`,
        status: 'మధ్యస్థ ప్రమాదం (Minor Risk)',
        statusColor: 'text-amber-800 bg-amber-100 border-amber-300',
        explanation: `ఒక వారం లేట్ అయితే ₹${extraPenalty} అపరాధ రుసుము కట్టాలి. కానీ ఎలాంటి లీగల్ నోటీసు లేదా వేలం ఉండదు.`,
        speech: `ఒక వారం ఆలస్యమైతే మీరు ${extraPenalty} రూపాయలు అపరాధ రుసుము చెల్లించాలి. ఎలాంటి లీగల్ ఇబ్బంది ఉండదు.`,
      }
    }

    if (scenario === 'late_2_months') {
      const extraPenalty = (penalty || 50) * 8
      if (lang === 'en') {
        return {
          title: 'What if 2 months missed?',
          penaltyText: isGold ? '⚠️ Risk of Gold Auction by Lender!' : `₹${extraPenalty} Heavy penalty & peer group pressure`,
          status: 'High Risk Alert',
          statusColor: 'text-rose-800 bg-rose-100 border-rose-300',
          explanation: isGold
            ? 'Critical warning: Beyond 60 days of non-payment, the lender will issue a legal notice to auction your gold ornaments.'
            : 'Critical warning: Recovery officers will visit, and Joint Liability Group clauses will obligate fellow group members to cover the loan.',
          speech: isGold
            ? 'High risk alert! If you miss payments for two months, the bank will legally auction your pledged gold.'
            : 'High risk alert! Two months of missed payments incurs heavy penalties and peer group liability.',
        }
      }
      if (lang === 'hi') {
        return {
          title: 'यदि 2 महीने किस्त न चुकाएं तो?',
          penaltyText: isGold ? '⚠️ बैंक द्वारा सोना नीलाम करने का जोखिम!' : `₹${extraPenalty} भारी जुर्माना एवं समूह देयता`,
          status: 'गंभीर चेतावनी',
          statusColor: 'text-rose-800 bg-rose-100 border-rose-300',
          explanation: isGold
            ? 'गंभीर चेतावनी! 60 दिनों से अधिक देरी पर बैंक गिरवी रखे सोने की नीलामी के लिए कानूनी नोटिस जारी कर सकता है।'
            : 'गंभीर चेतावनी! रिकवरी अधिकारी आएंगे और समूह दायित्व के तहत अन्य सदस्यों पर दबाव पड़ेगा।',
          speech: isGold
            ? 'गंभीर चेतावनी! दो महीने तक भुगतान न करने पर बैंक आपका सोना नीलाम कर सकता है।'
            : 'गंभीर चेतावनी! दो महीने किस्त न चुकाने पर भारी जुर्माना लगेगा।',
        }
      }
      return {
        title: 'రెండు నెలలు కట్టకపోతే (What if 2 months missed?)',
        penaltyText: isGold ? '⚠️ బంగారం వేలం వేసే ప్రమాదం ఉంది!' : `₹${extraPenalty} భారీ జరిమానా & గ్రూప్ బాధ్యత`,
        status: 'తీవ్ర హెచ్చరిక (High Risk Alert)',
        statusColor: 'text-rose-800 bg-rose-100 border-rose-300',
        explanation: isGold
          ? 'తీవ్ర హెచ్చరిక! 60 రోజులు దాటితే బ్యాంక్ తాకట్టు పెట్టిన బంగారాన్ని వేలం వేయడానికి లీగల్ నోటీసు జారీ చేస్తుంది.'
          : 'తీవ్ర హెచ్చరిక! రికవరీ అధికారులు ఇంటికి వస్తారు. సెల్ఫ్ హెల్ప్ గ్రూప్ లయబిలిటీ కింద తోటి సభ్యులపై ఒత్తిడి తెస్తారు.',
        speech: isGold
          ? 'తీవ్ర హెచ్చరిక! రెండు నెలలు కట్టకపోతే తాకట్టు పెట్టిన బంగారాన్ని బ్యాంక్ వేలం వేస్తుంది.'
          : 'తీవ్ర హెచ్చరిక! రెండు నెలలు కట్టకపోతే భారీ జరిమానా పడుతుంది మరియు తోటి గ్రూప్ సభ్యులు మీ లోన్ కట్టాల్సి వస్తుంది.',
      }
    }

    if (scenario === 'early_pay') {
      const savings = Math.round(loanAmount * 0.08)
      if (lang === 'en') {
        return {
          title: 'What if paid early (Preclosure)?',
          penaltyText: `Save approximately ₹${savings.toLocaleString('en-IN')} in future interest`,
          status: 'Best Savings',
          statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
          explanation: `Repaying ahead of schedule saves recurring interest. Under RBI regulations, zero prepayment penalties apply on floating individual loans!`,
          speech: `If you prepay this loan early, you will save approximately ${savings} rupees in interest with zero prepayment penalties.`,
        }
      }
      if (lang === 'hi') {
        return {
          title: 'समय से पहले चुकाने पर क्या होगा?',
          penaltyText: `लगभग ₹${savings.toLocaleString('en-IN')} ब्याज की बचत`,
          status: 'सर्वोत्तम बचत',
          statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
          explanation: `समय से पहले ऋण चुकाने से भविष्य का ब्याज बचता है। आरबीआई नियमों के अनुसार कोई प्रीपेमेंट जुर्माना नहीं लगेगा।`,
          speech: `यदि आप समय से पहले कर्ज चुकाते हैं, तो लगभग ${savings} रुपये की ब्याज बचत होगी।`,
        }
      }
      return {
        title: 'ముందుగానే మొత్తం కట్టేస్తే? (What if paid early?)',
        penaltyText: `₹${savings.toLocaleString('en-IN')} వడ్డీ ఆదా అవుతుంది`,
        status: 'అత్యుత్తమ పొదుపు (Best Savings)',
        statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        explanation: `లోన్ కాలపరిమితి కంటే ముందుగానే చెల్లిస్తే భవిష్యత్ వడ్డీ మిగులుతుంది. ఆర్బీఐ నిబంధనల ప్రకారం ఫ్లోటింగ్ రేట్ లోన్లపై ఎలాంటి ప్రీపేమెంట్ పెనాల్టీ ఉండదు!`,
        speech: `మీరు లోన్ ముందుగానే తీర్చేస్తే దాదాపు ${savings} రూపాయల వరకు వడ్డీ ఆదా అవుతుంది. ఎలాంటి ప్రీపేమెంట్ పెనాల్టీ ఉండదు.`,
      }
    }

    if (lang === 'en') {
      return {
        title: 'On-time Repayments',
        penaltyText: `Only ₹${instalmentAmount || 690} per scheduled cycle`,
        status: '100% Safe',
        statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        explanation: 'Paying regular installments on time incurs zero penalty charges and steadily improves your formal credit score.',
        speech: `Repaying on schedule incurs zero penalty fees and builds strong credit history for future low-interest loans.`,
      }
    }
    if (lang === 'hi') {
      return {
        title: 'समय पर भुगतान करने पर',
        penaltyText: `प्रत्येक चक्र में केवल ₹${instalmentAmount || 690}`,
        status: '100% सुरक्षित',
        statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        explanation: 'नियमित रूप से समय पर भुगतान करने से कोई जुर्माना नहीं लगेगा और आपका क्रेडिट स्कोर बेहतर होगा।',
        speech: `समय पर किस्तों का भुगतान करने पर कोई अतिरिक्त शुल्क नहीं लगेगा।`,
      }
    }
    return {
      title: 'సమయానికి చెల్లిస్తే (On-time repayments)',
      penaltyText: `ప్రతి వాయిదా ₹${instalmentAmount || 690} మాత్రమే`,
      status: 'సురక్షితం (100% Safe)',
      statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      explanation: 'ప్రతి వారం లేదా నెలకు నిర్ణీత వాయిదా సక్రమంగా చెల్లిస్తే అదనంగా ఒక్క రూపాయి కూడా జరిమానా పడదు. సిబిల్ స్కోర్ పెరుగుతుంది.',
      speech: `సమయానికి వాయిదాలు కడితే ఎలాంటి జరిమానా ఉండదు. భవిష్యత్తులో మరింత పెద్ద లోన్ తక్కువ వడ్డీకే లభిస్తుంది.`,
    }
  }

  const details = getScenarioDetails()

  return (
    <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/40 p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            🔮 {lang === 'en' ? 'Live "What-If" Loan Simulator' : lang === 'hi' ? 'लाइव "व्हाट-इफ" ऋण सिम्युलेटर' : 'లైవ్ లోన్ సిమ్యులేటర్ ("What-If" Simulator)'}
          </span>
          <p className="text-xs text-indigo-700 font-medium mt-0.5">
            {lang === 'en'
              ? 'What happens if payments are delayed, on-time, or paid early?'
              : lang === 'hi'
              ? 'यदि भुगतान में देरी हो या समय से पहले चुकाया जाए तो क्या होगा?'
              : 'ఒకవేళ చెల్లింపుల్లో మార్పు వస్తే ఏమవుతుంది?'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => speakText(details.speech, lang)}
          className="rounded-xl bg-white border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-900 shadow-sm hover:bg-indigo-100 active:scale-95 transition flex items-center gap-1.5"
        >
          <span>🔊 {lang === 'en' ? 'Hear Outcome' : lang === 'hi' ? 'परिणाम सुनें' : 'ఫలితాన్ని వినండి'}</span>
        </button>
      </div>

      {/* Scenario buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setScenario('on_time')}
          className={`rounded-2xl py-3 px-3 text-xs sm:text-sm font-bold border transition ${
            scenario === 'on_time'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ✓ {lang === 'en' ? 'On-Time' : lang === 'hi' ? 'समय पर' : 'ఆన్-టైమ్'}
        </button>

        <button
          type="button"
          onClick={() => setScenario('late_1_week')}
          className={`rounded-2xl py-3 px-3 text-xs sm:text-sm font-bold border transition ${
            scenario === 'late_1_week'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {lang === 'en' ? '1 Wk Late' : lang === 'hi' ? '1 सप्ताह देरी' : '1 వారం లేట్'}
        </button>

        <button
          type="button"
          onClick={() => setScenario('late_2_months')}
          className={`rounded-2xl py-3 px-3 text-xs sm:text-sm font-bold border transition ${
            scenario === 'late_2_months'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {lang === 'en' ? '2 Mos Late ⚠️' : lang === 'hi' ? '2 माह देरी ⚠️' : '2 నెలలు లేట్ ⚠️'}
        </button>

        <button
          type="button"
          onClick={() => setScenario('early_pay')}
          className={`rounded-2xl py-3 px-3 text-xs sm:text-sm font-bold border transition ${
            scenario === 'early_pay'
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {lang === 'en' ? 'Pay Early 💰' : lang === 'hi' ? 'पहले चुकाएं 💰' : 'ముందుగా కడితే 💰'}
        </button>
      </div>

      {/* Scenario result card */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 border border-indigo-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-900">{details.title}</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${details.statusColor}`}>
            {details.status}
          </span>
        </div>

        <div className="text-base font-black text-slate-900">{details.penaltyText}</div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{details.explanation}</p>
      </div>
    </div>
  )
}

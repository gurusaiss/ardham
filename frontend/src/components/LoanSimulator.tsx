import { useState } from 'react'
import { speakTelugu } from '../lib/speech'

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

  const isGold = loanType.includes('gold')

  function getScenarioDetails() {
    if (scenario === 'late_1_week') {
      const extraPenalty = penalty || (isGold ? 200 : 20)
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
      return {
        title: 'రెండు నెలలు కట్టకపోతే (What if 2 months missed?)',
        penaltyText: isGold ? '⚠️ బంగారం వేలం వేసే ప్రమాదం ఉంది!' : `₹${extraPenalty} భారీ జరిమానా & గ్రూప్ బాధ్యత`,
        status: 'తీవ్ర హెచ్చరిక (High Risk Alert)',
        statusColor: 'text-red-800 bg-red-100 border-red-300',
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
      return {
        title: 'ముందుగానే మొత్తం కట్టేస్తే? (What if paid early?)',
        penaltyText: `₹${savings.toLocaleString('en-IN')} వడ్డీ ఆదా అవుతుంది`,
        status: 'అత్యుత్తమ పొదుపు (Best Savings)',
        statusColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        explanation: `లోన్ కాలపరిమితి కంటే ముందుగానే చెల్లిస్తే భవిష్యత్ వడ్డీ మిగులుతుంది. ఆర్బీఐ నిబంధనల ప్రకారం ఫ్లోటింగ్ రేట్ లోన్లపై ఎలాంటి ప్రీపేమెంట్ పెనాల్టీ ఉండదు!`,
        speech: `మీరు లోన్ ముందుగానే తీర్చేస్తే దాదాపు ${savings} రూపాయల వరకు వడ్డీ ఆదా అవుతుంది. ఎలాంటి ప్రీపేమెంట్ పెనాల్టీ ఉండదు.`,
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
    <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            🔮 లైవ్ లోన్ సిమ్యులేటర్ (Live "What-If" Simulator)
          </span>
          <p className="text-[11px] text-indigo-700">ఒకవేళ చెల్లింపుల్లో మార్పు వస్తే ఏమవుతుంది?</p>
        </div>

        <button
          onClick={() => speakTelugu(details.speech)}
          className="rounded-xl bg-white border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-900 shadow-sm hover:bg-indigo-100 active:scale-95 transition"
        >
          🔊 ఫలితాన్ని వినండి
        </button>
      </div>

      {/* Scenario buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          onClick={() => setScenario('on_time')}
          className={`rounded-xl py-2 px-2 text-xs font-bold border transition ${
            scenario === 'on_time'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ✓ ఆన్-టైమ్
        </button>

        <button
          onClick={() => setScenario('late_1_week')}
          className={`rounded-xl py-2 px-2 text-xs font-bold border transition ${
            scenario === 'late_1_week'
              ? 'bg-amber-600 text-white border-amber-600 shadow'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          1 వారం లేట్
        </button>

        <button
          onClick={() => setScenario('late_2_months')}
          className={`rounded-xl py-2 px-2 text-xs font-bold border transition ${
            scenario === 'late_2_months'
              ? 'bg-red-600 text-white border-red-600 shadow'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          2 నెలలు లేట్ ⚠️
        </button>

        <button
          onClick={() => setScenario('early_pay')}
          className={`rounded-xl py-2 px-2 text-xs font-bold border transition ${
            scenario === 'early_pay'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ముందుగా కడితే 💰
        </button>
      </div>

      {/* Scenario result card */}
      <div className="rounded-xl bg-white p-3.5 border border-indigo-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900">{details.title}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${details.statusColor}`}>
            {details.status}
          </span>
        </div>

        <div className="text-sm font-bold text-slate-800">{details.penaltyText}</div>
        <p className="text-xs text-slate-600 leading-relaxed">{details.explanation}</p>
      </div>
    </div>
  )
}

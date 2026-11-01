/**
 * Centralized Trilingual Translation Store
 * Supports Telugu (te), English (en), and Hindi (hi) across all screens.
 */

import { getLanguage, type AppLanguage } from './speech'

export const TRANSLATIONS = {
  // Common / Header / Nav
  app_name: { te: 'అర్థం', en: 'Ardham', hi: 'अर्थम' },
  tagline: {
    te: 'గ్రామీణ మరియు దృష్టి లోపం ఉన్న రుణగ్రహీతల కోసం ప్రత్యేక వెరిఫికేషన్',
    en: 'Make sure rural & visually impaired borrowers understand before signing',
    hi: 'ग्रामीण और दृष्टिबाधित उधारकर्ताओं के लिए ऋण समझ सत्यापन',
  },
  offline_ready: { te: 'ఆఫ్‌లైన్ సిద్ధం', en: 'Offline ready', hi: 'ऑफ़लाइन तैयार' },
  online: { te: 'ఆన్‌లైన్', en: 'Online', hi: 'ऑनलाइन' },
  voice_assistant: { te: 'వాయిస్ అసిస్టెంట్', en: 'Voice Assistant', hi: 'वॉइस असिस्टेंट' },
  voice_on: { te: 'వాయిస్: ఆన్', en: 'Voice: ON', hi: 'वॉइस: चालू' },
  voice_silent: { te: 'వాయిస్: సైలెంట్', en: 'Voice: Silent', hi: 'वॉइस: मूक' },
  stop_audio: { te: 'ఆడియో ఆపు', en: 'Stop Audio', hi: 'ऑडियो रोकें' },
  change_language: { te: 'భాష మార్చండి', en: 'Language', hi: 'भाषा बदलें' },

  // Home Page
  start_new_session: {
    te: 'కొత్త సెషన్ ప్రారంభించండి (Start Session)',
    en: 'Start a New Session',
    hi: 'नया सत्र शुरू करें',
  },
  quick_demo_card: {
    te: '⚡ 1-క్లిక్ డెమో: మైక్రోఫైనాన్స్ లోన్ స్కాన్',
    en: '⚡ 1-Click Fast Demo: Microfinance Loan',
    hi: '⚡ 1-क्लिक डेमो: माइक्रोफाइनेंस ऋण स्कैन',
  },
  rbi_kfs_compliance_title: {
    te: '🏛️ RBI KFS & డిజిటల్ సమ్మతి ధృవీకరణ',
    en: '🏛️ RBI Key Fact Statement (KFS) Compliance',
    hi: '🏛️ आरबीआई केएफएस अनुपालन सत्यापन',
  },
  rbi_kfs_compliance_desc: {
    te: 'ఆర్బీఐ డిజిటల్ లెండింగ్ నిబంధనల ప్రకారం సంతకం లేదా వేలిముద్ర వేయడానికి ముందే రుణగ్రహీతకు పూర్తి అవగాహన ఉండాలి.',
    en: 'Complies with RBI Digital Lending Guidelines & Microfinance Fair Practices Code: verified oral comprehension before signing.',
    hi: 'आरबीआई डिजिटल लेंडिंग नियमों के अनुसार हस्ताक्षर से पहले मौखिक समझ सुनिश्चित की जाती है।',
  },

  // Steps
  step_scan: { te: 'స్కాన్', en: 'Scan', hi: 'स्कैन' },
  step_review: { te: 'సమీక్ష', en: 'Review', hi: 'समीक्षा' },
  step_explain: { te: 'వివరణ', en: 'Explain', hi: 'विवरण' },
  step_quiz: { te: 'ప్రశ్నలు', en: 'Quiz', hi: 'प्रश्नोत्तरी' },
  step_cert: { te: 'ధృవీకరణ', en: 'Certificate', hi: 'प्रमाणपत्र' },

  // Loan Categories
  cat_microfinance: { te: 'మైక్రోఫైనాన్స్ గ్రూప్ రుణం', en: 'Microfinance Group Loan (JLG)', hi: 'माइक्रोफाइनेंस समूह ऋण (JLG)' },
  cat_gold: { te: 'బంగారు ఆభరణాల తాకట్టు రుణం', en: 'Gold Loan (Jewellery Collateral)', hi: 'स्वर्ण ऋण (गोल्ड लोन)' },
  cat_personal: { te: 'వ్యక్తిగత వినియోగదారుల రుణం', en: 'Individual Personal Loan', hi: 'व्यक्तिगत ऋण (पर्सनल लोन)' },

  // Scan Screen
  scan_title: { te: 'రుణ పత్రాన్ని స్కాన్ చేయండి', en: 'Scan Loan Document / KFS', hi: 'ऋण दस्तावेज़ / केएफएस स्कैन करें' },
  take_photo_btn: { te: '📷 ఫోటో తీయండి / పేజీలను అప్‌లోడ్ చేయండి', en: '📷 Take Photos / Upload Pages', hi: '📷 फोटो लें / दस्तावेज़ अपलोड करें' },
  use_sample_btn: { te: '⚡ శాంపిల్ కార్డుతో తక్షణ డెమో', en: '⚡ Quick Demo: Use Sample Card', hi: '⚡ त्वरित डेमो: नमूना कार्ड का उपयोग करें' },
  pages_selected: { te: 'పేజీలు ఎంచుకోబడ్డాయి', en: 'Pages Selected', hi: 'पृष्ठ चुने गए' },
  add_another_page: { te: '+ మరొక పేజీని జోడించండి', en: '+ Add Another Page', hi: '+ अन्य पृष्ठ जोड़ें' },
  analyze_all_btn: { te: '🔍 జెమ్మా 4 తో అన్ని పేజీలను విశ్లేషించండి', en: '🔍 Analyze All Pages with Gemma 4', hi: '🔍 जेम्मा 4 से सभी पृष्ठों का विश्लेषण करें' },

  // Review & Fairness Screen
  review_title: { te: 'రుణ వివరాలు & మోసపూరిత వడ్డీ విశ్లేషణ', en: 'Loan Review & Fairness Analysis', hi: 'ऋण समीक्षा एवं निष्पक्षता विश्लेषण' },
  fairness_score: { te: 'న్యాయమైన రుణ రేటింగ్', en: 'Fair Lending Score', hi: 'निष्पक्ष ऋण स्कोर' },
  money_flow_title: { te: 'డబ్బు ప్రయాణం (Visual Money Flow)', en: 'Money Flow Breakdown', hi: 'पैसे का प्रवाह (मनी फ्लो)' },
  net_in_hand: { te: 'చేతికి వచ్చేది', en: 'Net in Hand', hi: 'हाथ में मिलने वाली राशि' },
  extra_cost: { te: 'అదనపు ఖర్చు (వడ్డీ + ఫీజులు)', en: 'Extra Cost (Interest + Fees)', hi: 'अतिरिक्त लागत (ब्याज + शुल्क)' },
  total_repayment: { te: 'మొత్తం చెల్లింపు', en: 'Total Repayment', hi: 'कुल पुनर्भुगतान' },
  principal_ratio: { te: 'అసలు', en: 'Principal', hi: 'मूलधन' },
  fees_ratio: { te: 'వడ్డీ & ఫీజులు', en: 'Interest & Fees', hi: 'ब्याज और शुल्क' },
  listen_analysis_btn: { te: '🔊 విశ్లేషణ వినండి', en: '🔊 Listen to Analysis', hi: '🔊 विश्लेषण सुनें' },
  confirm_terms_btn: { te: 'వివరాలు సరిగ్గా ఉన్నాయి — కొనసాగించండి →', en: 'Looks Correct — Continue →', hi: 'विवरण सही हैं — आगे बढ़ें →' },

  // Explanation Screen
  explain_title: { te: 'రుణ నిబంధనల వివరణ', en: 'Loan Terms Explanation', hi: 'ऋण शर्तों का विवरण' },
  item_counter: { te: 'అంశం', en: 'Item', hi: 'मद' },
  source_on_card: { te: 'కార్డుపై ముద్రించబడిన అసలు పంక్తి', en: 'Exact Line Printed on Card', hi: 'कार्ड पर छपी मूल पंक्ति' },
  listen_pure_btn: { te: '🔊 వినండి (Listen Aloud)', en: '🔊 Listen to Full Sentence', hi: '🔊 पूरा वाक्य सुनें' },
  back_btn: { te: '← వెనుకకు', en: '← Back', hi: '← वापस' },
  next_btn: { te: 'తర్వాత అంశం →', en: 'Next Item →', hi: 'अगला मद →' },
  start_quiz_btn: { te: 'అవగాహన ప్రశ్నలు ప్రారంభించండి →', en: 'Start Questions →', hi: 'प्रश्नोत्तरी शुरू करें →' },

  // Quiz Screen
  quiz_title: { te: 'అవగాహన ప్రశ్న', en: 'Comprehension Question', hi: 'समझ प्रश्न' },
  speak_mic_btn: { te: '🎤 నోటితో సమాధానం చెప్పండి', en: '🎤 Speak Answer into Mic', hi: '🎤 बोलकर उत्तर दें' },
  stop_recording_btn: { te: '⏹️ రికార్డింగ్ ఆపు', en: '⏹️ Stop Recording', hi: '⏹️ रिकॉर्डिंग रोकें' },
  or_tap_option: { te: 'లేదా ఒక సమాధానాన్ని నొక్కండి:', en: 'Or Tap an Answer Option:', hi: 'या एक विकल्प चुनें:' },
  or_type_answer: { te: 'లేదా టైప్ చేయండి:', en: 'Or Type Answer:', hi: 'या उत्तर टाइप करें:' },

  // Result Screen
  result_title: { te: 'రుణ అవగాహన ఫలితం', en: 'Comprehension Result', hi: 'समझ का परिणाम' },
  score_label: { te: 'అవగాహన స్కోర్', en: 'Understanding Score', hi: 'समझ स्कोर' },
  re_explain_btn: { te: 'ఈ అంశాలను మళ్లీ వివరించండి', en: 'Re-explain Missed Parts', hi: 'छूटे हुए भागों को दोबारा समझाएं' },
  view_cert_btn: { te: 'ధృవీకరణ పత్రం చూడండి →', en: 'View Comprehension Certificate →', hi: 'प्रमाणपत्र देखें →' },

  // Certificate Screen
  cert_title: { te: 'రుణ అవగాహన ధృవీకరణ పత్రం', en: 'Comprehension Certificate', hi: 'ऋण समझ प्रमाणपत्र' },
  share_whatsapp_btn: { te: '📲 వాట్సాప్‌లో పంపండి', en: '📲 Share on WhatsApp', hi: '📲 व्हाट्सएप पर भेजें' },
  print_pdf_btn: { te: '🖨️ ప్రింట్ / PDF సేవ్', en: '🖨️ Print / Save as PDF', hi: '🖨️ प्रिंट / पीडीएफ सहेजें' },
  printable_html_btn: { te: '📄 ప్రింటబుల్ HTML', en: '📄 Printable HTML', hi: '📄 प्रिंट करने योग्य HTML' },
}

export function t(key: keyof typeof TRANSLATIONS, lang?: AppLanguage): string {
  const currentLang = lang || getLanguage()
  const entry = TRANSLATIONS[key]
  if (!entry) return key
  return entry[currentLang] || entry.te || key
}

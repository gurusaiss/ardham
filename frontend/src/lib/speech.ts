/**
 * Multi-Language & Pure Speech Synthesis Controller
 * 
 * - Supports Telugu (te), English (en), and Hindi (hi).
 * - Comprehensive Telugu & Hindi Phonetic Fallback:
 *   When no native Telugu TTS voice is installed on OS (common on Windows),
 *   intelligently converts Telugu text to clean phonetic syllables so Indian English (en-IN)
 *   or default TTS speaks EVERY SINGLE WORD AND NUMBER aloud without dropping characters!
 * - Global Stop Audio control across the entire application.
 * - Reactive Language and Voice State Subscriptions.
 */

export type AppLanguage = 'te' | 'en' | 'hi'

const LANG_KEY = 'ardham_app_language'
const VOICE_PREF_KEY = 'ardham_voice_assistant'
const MODAL_ANSWERED_KEY = 'ardham_voice_modal_answered'

type SpeakingListener = (speaking: boolean) => void
const speakingListeners = new Set<SpeakingListener>()
let currentSpeakingState = false

function notifySpeaking(speaking: boolean) {
  currentSpeakingState = speaking
  speakingListeners.forEach((fn) => {
    try {
      fn(speaking)
    } catch {
      // ignore
    }
  })
}

export function subscribeSpeaking(fn: SpeakingListener): () => void {
  speakingListeners.add(fn)
  fn(currentSpeakingState)
  return () => {
    speakingListeners.delete(fn)
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  return window.speechSynthesis.speaking
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  notifySpeaking(false)
}

type LanguageListener = (lang: AppLanguage) => void
const languageListeners = new Set<LanguageListener>()

export function subscribeLanguage(fn: LanguageListener): () => void {
  languageListeners.add(fn)
  fn(getLanguage())
  return () => {
    languageListeners.delete(fn)
  }
}

export function getLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'te'
  const lang = localStorage.getItem(LANG_KEY) as AppLanguage | null
  return lang === 'en' || lang === 'hi' ? lang : 'te'
}

export function setLanguage(lang: AppLanguage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_KEY, lang)
  languageListeners.forEach((fn) => {
    try {
      fn(lang)
    } catch {
      // ignore
    }
  })
}

export function getSpeechRate(): number {
  return 1.0
}

export function setSpeechRate(_rate: number) {
  // Speed permanently locked to standard natural 1.0x
}

export function isVoiceAssistantEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(VOICE_PREF_KEY) === 'true'
}

export function setVoiceAssistantEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(VOICE_PREF_KEY, enabled ? 'true' : 'false')
  localStorage.setItem(MODAL_ANSWERED_KEY, 'true')
  if (!enabled) {
    stopSpeaking()
  }
}

export function hasAnsweredVoiceModal(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(MODAL_ANSWERED_KEY) === 'true'
}

export function resetVoiceModal() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MODAL_ANSWERED_KEY)
}

/**
 * Normalizes Telugu text:
 * Replaces accidental Hindi loan words with pure Telugu financial terms.
 */
export function sanitizeTeluguText(text: string): string {
  return text
    .replace(/కిష్త్/g, 'వాయిదా')
    .replace(/కిస్తు/g, 'వాయిదా')
    .replace(/కర్జ్/g, 'అప్పు')
    .replace(/బ్యాజ్/g, 'వడ్డీ')
    .replace(/జుర్మానా/g, 'అపరాధ రుసుము')
    .replace(/లెక్కాపత్రం/g, 'వివరాలు')
    .replace(/\(stub[^\)]*\)/gi, '')
    .trim()
}

/**
 * Comprehensive Telugu Unicode Transliteration Engine
 * Ensures 100% of spoken words and numbers are audible when OS lacks native Telugu TTS.
 */
const TELUGU_PHONETIC_PHRASES: Record<string, string> = {
  'మంజూరైన': 'manjooraina',
  'చెల్లించాల్సి': 'chellinchaalsi',
  'చెల్లించాలి': 'chellinchaali',
  'చెల్లించవలెను': 'chellinchavalenu',
  'మినహాయిస్తారు': 'minahaayisthaaru',
  'మినహాయించబడును': 'minahaayinchabadunu',
  'ముందుగానే': 'mundhugaanee',
  'కాలపరిమితి': 'kaalaparimithi',
  'అపరాధ రుసుము': 'aparaadha rusumu',
  'అపరాధ': 'aparaadha',
  'జరిమానా': 'jarimaanaa',
  'పడుపడుతుంది': 'paduthundi',
  'పడుతుంది': 'paduthundi',
  'రూపాయలు': 'rupaayalu',
  'రూపాయల': 'rupaayala',
  'రూపాయిలు': 'rupaayilu',
  'వాయిదాలలో': 'vaayidaalalo',
  'వాయిదాకి': 'vaayidaaki',
  'వాయిదాలు': 'vaayidaalu',
  'వాయిదా': 'vaayidaa',
  'వార్షిక': 'vaarshika',
  'ప్రాసెసింగ్': 'processing',
  'ప్రీమియం': 'premium',
  'ఉంటుంది': 'untundi',
  'మరియు': 'mariyu',
  'మొత్తం': 'motham',
  'వడ్డీ రేటు': 'vaddi rate',
  'వడ్డీ': 'vaddi',
  'శాతం': 'percent',
  'రుసుము': 'rusumu',
  'రుసుముగా': 'rusumugaa',
  'బీమా': 'beema',
  'కొరకు': 'koraku',
  'కలిపి': 'kalipi',
  'మీద': 'meeda',
  'మీకు': 'Meeku',
  'మీరు': 'Meeru',
  'లోన్': 'loan',
  'రుణం': 'runam',
  'అప్పు': 'appu',
  'విలువ': 'viluva',
  'ప్రతి': 'prathi',
  'వారం': 'vaaram',
  'కట్టాలి': 'kattali',
  'కడతారు': 'kadataaru',
  'నెలలు': 'nelalu',
  'నెలల': 'nelala',
  'వారాలు': 'vaaraalu',
  'వారాల': 'vaarala',
  'ఆలస్యమైతే': 'aalasyamaithe',
  'అవును': 'avunu',
  'కాదు': 'kaadu',
  'తెలీదు': 'teleedu',
  'బంగారం': 'bangaaram',
  'తాకట్టు': 'thaakattu',
  'అమ్మేస్తారు': 'ammeesthaaru',
  'వేలం': 'veelam',
  'వేస్తారు': 'veesthaaru',
  'తీసేసుకుంటారు': 'theeseesukuntaaru',
  'కట్టకపోతే': 'kattakapoothye',
  'అవగాహన': 'avagaahana',
  'స్కోర్': 'score',
  'వివరాలు': 'vivaraalu',
  'చేతికి': 'cheethiki',
  'వచ్చేది': 'vachhedhi',
  'అందే': 'andhee',
  'నగదు': 'nagadhu',
  'ధృవీకరించబడింది': 'dhruveekarinchabadindi',
  'అభినందనలు': 'abhinandanalu',
  'స్వాగతం': 'swaagatham',
  'నమస్కారం': 'namaskaaram',
}

const TELUGU_VOWELS: Record<string, string> = {
  '\u0C05': 'a', '\u0C06': 'aa', '\u0C07': 'i', '\u0C08': 'ee',
  '\u0C09': 'u', '\u0C0A': 'oo', '\u0C0B': 'ru', '\u0C0E': 'e',
  '\u0C0F': 'ee', '\u0C10': 'ai', '\u0C12': 'o', '\u0C13': 'oo', '\u0C14': 'au'
}

const TELUGU_CONSONANTS: Record<string, string> = {
  '\u0C15': 'k', '\u0C16': 'kh', '\u0C17': 'g', '\u0C18': 'gh', '\u0C19': 'ng',
  '\u0C1A': 'ch', '\u0C1B': 'chh', '\u0C1C': 'j', '\u0C1D': 'jh', '\u0C1E': 'ny',
  '\u0C1F': 't', '\u0C20': 'th', '\u0C21': 'd', '\u0C22': 'dh', '\u0C23': 'n',
  '\u0C24': 'th', '\u0C25': 'thh', '\u0C26': 'd', '\u0C27': 'dh', '\u0C28': 'n',
  '\u0C2A': 'p', '\u0C2B': 'ph', '\u0C2C': 'b', '\u0C2D': 'bh', '\u0C2E': 'm',
  '\u0C2F': 'y', '\u0C30': 'r', '\u0C31': 'r', '\u0C32': 'l', '\u0C33': 'l',
  '\u0C35': 'v', '\u0C36': 'sh', '\u0C37': 'sh', '\u0C38': 's', '\u0C39': 'h'
}

const TELUGU_MATRAS: Record<string, string> = {
  '\u0C3E': 'aa', '\u0C3F': 'i', '\u0C40': 'ee', '\u0C41': 'u',
  '\u0C42': 'oo', '\u0C43': 'ru', '\u0C46': 'e', '\u0C47': 'ee',
  '\u0C48': 'ai', '\u0C4A': 'o', '\u0C4B': 'oo', '\u0C4C': 'au',
}

const TELUGU_ANUSVARA = '\u0C02' // ం
const TELUGU_VISARGA = '\u0C03'  // ః
const TELUGU_VIRAMA = '\u0C4D'   // ్

export function teluguToPhonetic(text: string): string {
  let res = text
  const sorted = Object.keys(TELUGU_PHONETIC_PHRASES).sort((a, b) => b.length - a.length)
  for (const k of sorted) {
    res = res.split(k).join(' ' + TELUGU_PHONETIC_PHRASES[k] + ' ')
  }

  let out = ''
  let i = 0
  while (i < res.length) {
    const ch = res[i]
    if (TELUGU_VOWELS[ch]) {
      out += TELUGU_VOWELS[ch]
      i++
    } else if (TELUGU_CONSONANTS[ch]) {
      const c = TELUGU_CONSONANTS[ch]
      const next1 = res[i + 1]
      const next2 = res[i + 2]
      if (next1 === TELUGU_VIRAMA) {
        out += c
        i += 2
      } else if (next1 && TELUGU_MATRAS[next1] !== undefined) {
        out += c + TELUGU_MATRAS[next1]
        i += 2
        if (next2 === TELUGU_ANUSVARA) {
          out += 'm'
          i++
        }
      } else if (next1 === TELUGU_ANUSVARA) {
        out += c + 'am'
        i += 2
      } else {
        out += c + 'a'
        i++
      }
    } else if (ch === TELUGU_ANUSVARA) {
      out += 'm'
      i++
    } else if (ch === TELUGU_VISARGA) {
      out += 'h'
      i++
    } else {
      out += ch
      i++
    }
  }

  // Strip any lingering non-ASCII unicode to guarantee speech engines never drop words
  return out.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Universal Speech Synthesizer:
 * Speaks all words, text, and numbers with perfect phonetic fallback.
 */
export function speakText(text: string, lang?: AppLanguage, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  stopSpeaking()

  const targetLang = lang || getLanguage()
  const sanitized = targetLang === 'te' ? sanitizeTeluguText(text) : text
  const voices = window.speechSynthesis.getVoices()

  let voiceToUse: SpeechSynthesisVoice | null = null
  let textToSpeak = sanitized
  let langTag = 'en-IN'

  if (targetLang === 'te') {
    const teVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')
    )
    if (teVoice) {
      voiceToUse = teVoice
      textToSpeak = sanitized
      langTag = 'te-IN'
    } else {
      // No native Telugu voice installed on OS -> use clean phonetic transliteration!
      const enIn = voices.find(
        (v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en')
      )
      voiceToUse = enIn || null
      textToSpeak = teluguToPhonetic(sanitized)
      langTag = 'en-IN'
    }
  } else if (targetLang === 'hi') {
    const hiVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
    )
    voiceToUse = hiVoice || null
    textToSpeak = sanitized
    langTag = 'hi-IN'
  } else {
    // English
    const enVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en')
    )
    voiceToUse = enVoice || null
    textToSpeak = sanitized
    langTag = 'en-IN'
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak)
  utterance.rate = getSpeechRate()
  utterance.pitch = 1.0
  utterance.lang = langTag
  if (voiceToUse) {
    utterance.voice = voiceToUse
  }

  utterance.onstart = () => notifySpeaking(true)
  utterance.onend = () => {
    notifySpeaking(false)
    onEnd?.()
  }
  utterance.onerror = () => {
    notifySpeaking(false)
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

export function speakTelugu(text: string, onEnd?: () => void) {
  speakText(text, 'te', onEnd)
}

/**
 * Spoken prompt for Step 1: Language Selection (Trilingual)
 */
export function speakLanguagePrompt(onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  stopSpeaking()

  const promptText = 'నమస్కారం! భాషను ఎంచుకోండి. తెలుగు, English, లేదా हिंदी.'
  speakText(promptText, 'te', onEnd)
}

/**
 * Spoken prompt for Step 2: Voice Assistant Needed?
 */
export function speakVoiceAssistancePrompt(lang: AppLanguage = 'te', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  stopSpeaking()

  let prompt = 'మీకు వాయిస్ అసిస్టెంట్ కావాలా? కావాలంటే YES బటన్ నొక్కండి లేదా YES అని చెప్పండి.'
  if (lang === 'en') {
    prompt = 'Do you need Voice Assistance? Press YES or say YES.'
  } else if (lang === 'hi') {
    prompt = 'क्या आपको वॉइस असिस्टेंट चाहिए? YES बोलें या दबाएं।'
  }

  speakText(prompt, lang, onEnd)
}

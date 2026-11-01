/**
 * Multi-Language & Pure Speech Synthesis Controller
 * 
 * - Supports Telugu (default), English, and Hindi.
 * - Native Telugu voice support with intelligent Phonetic Fallback:
 *   When no native Telugu TTS voice is installed on OS (common on Windows),
 *   intelligently converts Telugu text to clean phonetic syllables so Indian English (en-IN)
 *   TTS speaks EVERY SINGLE WORD AND NUMBER aloud, instead of dropping characters!
 * - Global Stop Audio control across the entire application.
 * - Remembers Language & Voice Assistant preferences in localStorage.
 */

export type AppLanguage = 'te' | 'en' | 'hi'

const LANG_KEY = 'ardham_app_language'
const VOICE_PREF_KEY = 'ardham_voice_assistant'
const MODAL_ANSWERED_KEY = 'ardham_voice_modal_answered'

type SpeakingListener = (speaking: boolean) => void
const listeners = new Set<SpeakingListener>()
let currentSpeakingState = false

function notify(speaking: boolean) {
  currentSpeakingState = speaking
  listeners.forEach((fn) => {
    try {
      fn(speaking)
    } catch {
      // ignore
    }
  })
}

export function subscribeSpeaking(fn: SpeakingListener): () => void {
  listeners.add(fn)
  fn(currentSpeakingState)
  return () => {
    listeners.delete(fn)
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  return window.speechSynthesis.speaking
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  notify(false)
}

export function getLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'te'
  const lang = localStorage.getItem(LANG_KEY) as AppLanguage | null
  return lang === 'en' || lang === 'hi' ? lang : 'te'
}

export function setLanguage(lang: AppLanguage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_KEY, lang)
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
 * Dictionary of common Telugu words to phonetic English representations.
 * Ensures natural and intelligible spoken output when TTS has no native Telugu font reader.
 */
const TELUGU_WORD_MAP: Record<string, string> = {
  'మీకు': 'Meeku',
  'మీరు': 'Meeru',
  'మీ': 'Mee',
  'మంజూరైన': 'manjooraina',
  'లోన్': 'loan',
  'రుణం': 'runam',
  'అప్పు': 'appu',
  'మొత్తం': 'motham',
  'విలువ': 'viluva',
  'రూపాయలు': 'rupaayalu',
  'రూపాయల': 'rupaayala',
  'రూపాయిలు': 'rupaayilu',
  'ప్రతి': 'prathi',
  'వారం': 'vaaram',
  'వాయిదాకి': 'vaayidaaki',
  'వాయిదా': 'vaayidaa',
  'వాయిదాలలో': 'vaayidaalalo',
  'వాయిదాలు': 'vaayidaalu',
  'చెల్లించాలి': 'chellinchaali',
  'చెల్లించవలెను': 'chellinchavalenu',
  'కట్టాలి': 'kattali',
  'కడతారు': 'kadataaru',
  'వార్షిక': 'vaarshika',
  'వడ్డీ': 'vaddi',
  'రేటు': 'rate',
  'శాతం': 'percent',
  'ప్రాసెసింగ్': 'processing',
  'రుసుము': 'rusumu',
  'రుసుముగా': 'rusumugaa',
  'మినహాయిస్తారు': 'minahaayisthaaru',
  'మినహాయించబడును': 'minahaayinchabadunu',
  'బీమా': 'beema',
  'ప్రీమియం': 'premium',
  'కొరకు': 'koraku',
  'కలిపి': 'kalipi',
  'మీద': 'meeda',
  'మరియు': 'mariyu',
  'ఆలస్యమైతే': 'aalasyamaithe',
  'అపరాధ': 'aparaadha',
  'జరిమానా': 'jarimaanaa',
  'పడుతుంది': 'paduthundi',
  'కాలపరిమితి': 'kaalaparimithi',
  'నెలలు': 'nelalu',
  'నెలల': 'nelala',
  'వారాలు': 'vaaraalu',
  'వారాల': 'vaarala',
  'పాటు': 'paatu',
  'ఎంత': 'entha',
  'ఎన్ని': 'enni',
  'ప్రశ్న': 'prashna',
  'సమాధానం': 'samaadhaanam',
  'చెప్పండి': 'cheppandi',
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
  'అర్ధం': 'Ardham',
  'స్వాగతం': 'swaagatham',
  'నమస్కారం': 'namaskaaram',
  'భాషను': 'bhashanu',
  'ఎంచుకోండి': 'enchukondi',
  'కావాలా': 'kaavaalaa',
  'కావాలంటే': 'kaavaalante',
  'నొక్కండి': 'nokkandi',
  'లేదా': 'leedhaa',
  'అని': 'ani',
  'వద్దు': 'vaddu',
  'సైలెంట్': 'silent',
  'మోడ్': 'mode',
  'ధృవీకరించబడింది': 'dhruveekarinchabadindi',
  'ధృవీకరించబడ్డాయి': 'dhruveekarinchabaddaayi',
  'అవగాహన': 'avagaahana',
  'స్కోర్': 'score',
  'వివరాలు': 'vivaraalu',
  'చేతికి': 'cheethiki',
  'వచ్చేది': 'vachhedhi',
  'అందే': 'andhee',
  'నగదు': 'nagadhu',
  'దాచిన': 'daachina',
  'షరతులు': 'sharathulu',
  'హెచ్చరిక': 'hechharika',
  'హెచ్చరికలు': 'hechharikalu',
  'అంశాలలో': 'amshaalalo',
  'స్పష్టత': 'spashtatha',
  'అవసరం': 'avasaram',
  'అభినందనలు': 'abhinandanalu',
  'విజయవంతంగా': 'vijayavanthamgaa',
}

const VOWELS: Record<string, string> = {
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo',
  'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'ee', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'oo', 'ఔ': 'au',
}
const CONSONANTS: Record<string, string> = {
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 'th', 'థ': 'thh', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l',
}
const MATRAS: Record<string, string> = {
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru',
  'ె': 'e', 'ే': 'ee', 'ై': 'ai', 'ొ': 'o', 'ో': 'oo', 'ౌ': 'au',
  'ం': 'm', 'ః': 'h', '్': '',
}

export function teluguToPhonetic(text: string): string {
  let result = text
  for (const [te, en] of Object.entries(TELUGU_WORD_MAP)) {
    result = result.split(te).join(en + ' ')
  }

  let out = ''
  let i = 0
  while (i < result.length) {
    const ch = result[i]
    if (VOWELS[ch]) {
      out += VOWELS[ch]
      i++
    } else if (CONSONANTS[ch]) {
      const cons = CONSONANTS[ch]
      const next = result[i + 1]
      if (next === '్') {
        out += cons
        i += 2
      } else if (next && MATRAS[next] !== undefined) {
        out += cons + MATRAS[next]
        i += 2
      } else {
        out += cons + 'a'
        i++
      }
    } else {
      out += ch
      i++
    }
  }

  return out.replace(/\s+/g, ' ').trim()
}

/**
 * Universal speaker based on active language or specified text.
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
  let langTag = 'te-IN'

  if (targetLang === 'te') {
    const teVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')
    )
    if (teVoice) {
      voiceToUse = teVoice
      textToSpeak = sanitized
      langTag = 'te-IN'
    } else {
      // No native Telugu voice installed on OS!
      // Convert to phonetic syllables so Indian English voice speaks EVERY SINGLE WORD & NUMBER
      // instead of dropping Telugu characters!
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
    const enVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en')
    )
    voiceToUse = enVoice || null
    textToSpeak = sanitized
    langTag = 'en-IN'
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak)
  utterance.rate = 0.92 // Natural measured speaking speed
  utterance.pitch = 1.0
  utterance.lang = langTag
  if (voiceToUse) {
    utterance.voice = voiceToUse
  }

  utterance.onstart = () => notify(true)
  utterance.onend = () => {
    notify(false)
    onEnd?.()
  }
  utterance.onerror = () => {
    notify(false)
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

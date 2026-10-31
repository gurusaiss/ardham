/**
 * Multi-Language & Pure Speech Synthesis Controller
 * 
 * - Supports Telugu (default), English, and Hindi.
 * - Ensures pure Telugu vocabulary without Hindi loan words when Telugu is active.
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
  const utterance = new SpeechSynthesisUtterance(sanitized)
  utterance.rate = 0.95
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()

  if (targetLang === 'te') {
    const teVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')
    )
    if (teVoice) {
      utterance.voice = teVoice
      utterance.lang = 'te-IN'
    } else {
      const enIn = voices.find((v) => v.lang.toLowerCase().startsWith('en-in'))
      if (enIn) utterance.voice = enIn
      utterance.lang = 'te-IN'
    }
  } else if (targetLang === 'hi') {
    const hiVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
    )
    if (hiVoice) utterance.voice = hiVoice
    utterance.lang = 'hi-IN'
  } else {
    const enVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en')
    )
    if (enVoice) utterance.voice = enVoice
    utterance.lang = 'en-IN'
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

  const u = new SpeechSynthesisUtterance(
    'నమస్కారం! భాషను ఎంచుకోండి. తెలుగు, English, లేదా हिंदी.'
  )
  u.lang = 'te-IN'
  u.rate = 0.95
  u.onstart = () => notify(true)
  u.onend = () => {
    notify(false)
    onEnd?.()
  }
  u.onerror = () => {
    notify(false)
    onEnd?.()
  }
  window.speechSynthesis.speak(u)
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

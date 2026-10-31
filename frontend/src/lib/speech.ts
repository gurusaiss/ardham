/**
 * Pure Telugu & Accessible Speech Synthesis Controller
 * 
 * - Ensures pure Telugu vocabulary (no Hindi loan words).
 * - Speaks numbers in clear English digits to avoid TTS number garbling.
 * - Global Stop Audio control across the entire application.
 * - Voice Assistant mode state (ON for blind/audio-first, OFF for silent).
 */

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
      // ignore listener errors
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

/**
 * Normalizes Telugu text:
 * 1. Cleanses out accidental Hindi loan words in favor of pure Telugu.
 * 2. Leaves numbers as clean digits (e.g. 50,000 or 690) so Indian English/Telugu TTS
 *    pronounces numbers crisply without butchering.
 */
export function sanitizeTeluguText(text: string): string {
  let cleaned = text
    // Replace common Hindi loan words with pure Telugu financial terms
    .replace(/కిష్త్/g, 'వాయిదా')
    .replace(/కిస్తు/g, 'వాయిదా')
    .replace(/కర్జ్/g, 'అప్పు')
    .replace(/బ్యాజ్/g, 'వడ్డీ')
    .replace(/జుర్మానా/g, 'అపరాధ రుసుము')
    .replace(/లెక్కాపత్రం/g, 'వివరాలు')
    // Remove stub tags if any
    .replace(/\(stub[^\)]*\)/gi, '')
    .trim()

  return cleaned
}

/**
 * Speak text using Web Speech API with strict Telugu voice prioritization.
 * If te-IN voice is unavailable, uses Indian English (en-IN) instead of Hindi (hi-IN)
 * so words are never pronounced with a Hindi accent.
 */
export function speakTelugu(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  stopSpeaking()

  const sanitized = sanitizeTeluguText(text)
  const utterance = new SpeechSynthesisUtterance(sanitized)
  utterance.rate = 0.95 // Slightly slower for clear rural comprehension
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  // Look for native Telugu voice first
  const teVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')
  )

  if (teVoice) {
    utterance.voice = teVoice
    utterance.lang = 'te-IN'
  } else {
    // If no Telugu voice installed on OS, try Indian English (en-IN) or default, NEVER Hindi (hi-IN)
    const indianVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en-in'))
    if (indianVoice) {
      utterance.voice = indianVoice
    }
    utterance.lang = 'te-IN' // Still request te-IN synthesis
  }

  utterance.onstart = () => {
    notify(true)
  }

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

/**
 * Trilingual initial onboarding greeting:
 * Spoken in Telugu first, followed by English, so both rural Telugu borrowers
 * and English testers immediately understand what is being asked.
 */
export function speakOnboardingPrompt(onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  stopSpeaking()

  const teluguPart = 'నమస్కారం. అర్ధం కి స్వాగతం. మీకు వాయిస్ అసిస్టెంట్ కావాలా? కావాలంటే YES బటన్ నొక్కండి లేదా YES అని చెప్పండి.'
  const englishPart = 'Do you need Voice Assistance? Click YES or say YES.'

  const u1 = new SpeechSynthesisUtterance(teluguPart)
  u1.rate = 0.95
  const voices = window.speechSynthesis.getVoices()
  const teVoice = voices.find((v) => v.lang.toLowerCase().startsWith('te'))
  if (teVoice) u1.voice = teVoice
  u1.lang = 'te-IN'

  const u2 = new SpeechSynthesisUtterance(englishPart)
  u2.rate = 1.0
  const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en'))
  if (enVoice) u2.voice = enVoice
  u2.lang = 'en-IN'

  u1.onstart = () => notify(true)
  u1.onerror = () => notify(false)
  
  u1.onend = () => {
    window.speechSynthesis.speak(u2)
  }

  u2.onend = () => {
    notify(false)
    onEnd?.()
  }
  u2.onerror = () => {
    notify(false)
    onEnd?.()
  }

  window.speechSynthesis.speak(u1)
}

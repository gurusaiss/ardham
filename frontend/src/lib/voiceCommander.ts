/**
 * Global Hands-Free Voice Commander for Blind & Visually Impaired Users.
 * 
 * - 100% On-device, offline-compatible Web Speech Recognition loop.
 * - Multi-dialect voice recognition for Telugu, English, and Hindi.
 * - Dispatches navigation, reading, and interaction commands without touching the screen:
 *   - "Start" / "ప్రారంభించు" / "शुरू"
 *   - "Next" / "తరువాత" / "आगे"
 *   - "Back" / "వెనుకకు" / "पीछे"
 *   - "Repeat" / "మళ్ళీ చెప్పు" / "फिर से" / "Listen"
 *   - "Stop" / "ఆపు" / "रुको"
 *   - "Download" / "డౌన్‌లోడ్" / "डाउनलोड"
 *   - "Share" / "వాట్సాప్" / "शेयर"
 *   - "Avatar" / "అవతార్" / "Screen" / "స్క్రీన్"
 */

import { getLanguage, stopSpeaking, isVoiceAssistantEnabled } from './speech'

export type VoiceCommandAction =
  | 'start'
  | 'next'
  | 'back'
  | 'repeat'
  | 'stop'
  | 'download'
  | 'share'
  | 'avatar'
  | 'screen'
  | 'help'

export type CommandHandler = (action: VoiceCommandAction, rawText: string) => void

const commandHandlers = new Set<CommandHandler>()
let recognitionInstance: any = null
let isListeningActive = false
let lastTranscript = ''
type TranscriptListener = (transcript: string, isFinal: boolean) => void
const transcriptListeners = new Set<TranscriptListener>()

export function subscribeVoiceCommands(handler: CommandHandler): () => void {
  commandHandlers.add(handler)
  return () => {
    commandHandlers.delete(handler)
  }
}

export function subscribeTranscript(fn: TranscriptListener): () => void {
  transcriptListeners.add(fn)
  fn(lastTranscript, false)
  return () => {
    transcriptListeners.delete(fn)
  }
}

function notifyTranscript(text: string, isFinal: boolean) {
  lastTranscript = text
  transcriptListeners.forEach((fn) => {
    try {
      fn(text, isFinal)
    } catch {
      // ignore
    }
  })
}

function notifyCommand(action: VoiceCommandAction, rawText: string) {
  commandHandlers.forEach((fn) => {
    try {
      fn(action, rawText)
    } catch {
      // ignore
    }
  })
}

/**
 * Parses spoken speech text into structured system commands across TE, HI, EN.
 */
export function parseVoiceCommand(text: string): VoiceCommandAction | null {
  const t = text.trim().toLowerCase()

  // 1. Next / Advance
  if (
    t.includes('next') ||
    t.includes('తరువాత') ||
    t.includes('నెక్స్ట్') ||
    t.includes('ముందుకు') ||
    t.includes('आगे') ||
    t.includes('अगला') ||
    t.includes('continue') ||
    t.includes('proceed')
  ) {
    return 'next'
  }

  // 2. Back / Previous
  if (
    t.includes('back') ||
    t.includes('వెనుకకు') ||
    t.includes('బ్యాక్') ||
    t.includes('పీచే') ||
    t.includes('पीछे') ||
    t.includes('previous')
  ) {
    return 'back'
  }

  // 3. Repeat / Listen Aloud
  if (
    t.includes('repeat') ||
    t.includes('మళ్ళీ చెప్పు') ||
    t.includes('మళ్లీ') ||
    t.includes('విను') ||
    t.includes('వినండి') ||
    t.includes('listen') ||
    t.includes('speak') ||
    t.includes('फिर से') ||
    t.includes('दोहराएं') ||
    t.includes('सुनो')
  ) {
    return 'repeat'
  }

  // 4. Stop / Silence
  if (
    t.includes('stop') ||
    t.includes('ఆపు') ||
    t.includes('సైలెంట్') ||
    t.includes('ఆగండి') ||
    t.includes('रुको') ||
    t.includes('रोकें') ||
    t.includes('चुप') ||
    t.includes('quiet')
  ) {
    return 'stop'
  }

  // 5. Start / New Session
  if (
    t.includes('start') ||
    t.includes('ప్రారంభించు') ||
    t.includes('స్టార్ట్') ||
    t.includes('ఓపెన్') ||
    t.includes('begin') ||
    t.includes('शुरू')
  ) {
    return 'start'
  }

  // 6. Download Certificate
  if (
    t.includes('download') ||
    t.includes('డౌన్‌లోడ్') ||
    t.includes('డౌన్లోడ్') ||
    t.includes('సేవ్') ||
    t.includes('डाउनलोड') ||
    t.includes('save')
  ) {
    return 'download'
  }

  // 7. Share WhatsApp
  if (
    t.includes('share') ||
    t.includes('whatsapp') ||
    t.includes('వాట్సాప్') ||
    t.includes('షేర్') ||
    t.includes('व्हाट्सएप') ||
    t.includes('शेयर')
  ) {
    return 'share'
  }

  // 8. Avatar Mode
  if (
    t.includes('avatar') ||
    t.includes('అవతార్') ||
    t.includes('voice only') ||
    t.includes('వాయిస్ ఓన్లీ') ||
    t.includes('अवतार')
  ) {
    return 'avatar'
  }

  // 9. Screen Mode
  if (
    t.includes('screen') ||
    t.includes('స్క్రీన్') ||
    t.includes('voice and text') ||
    t.includes('स्क्रीन')
  ) {
    return 'screen'
  }

  // 10. Help
  if (
    t.includes('help') ||
    t.includes('సహాయం') ||
    t.includes('హెల్ప్') ||
    t.includes('मदद')
  ) {
    return 'help'
  }

  return null
}

/**
 * Initializes and starts the continuous on-device voice recognition loop.
 */
export function startVoiceCommander() {
  if (typeof window === 'undefined') return
  if (!isVoiceAssistantEnabled()) return
  if (isListeningActive) return

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRec) {
    console.warn('SpeechRecognition API not supported on this browser.')
    return
  }

  try {
    const recognition = new SpeechRec()
    recognition.continuous = true
    recognition.interimResults = true

    const lang = getLanguage()
    recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'

    recognition.onstart = () => {
      isListeningActive = true
    }

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = (event.results[i][0]?.transcript || '').trim()
        const isFinal = event.results[i].isFinal

        notifyTranscript(transcript, isFinal)

        if (isFinal && transcript.length > 0) {
          const action = parseVoiceCommand(transcript)
          if (action) {
            if (action === 'stop') {
              stopSpeaking()
            }
            notifyCommand(action, transcript)
          }
        }
      }
    }

    recognition.onerror = (e: any) => {
      // Don't kill loop on no-speech
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition status:', e.error)
      }
    }

    recognition.onend = () => {
      isListeningActive = false
      // Automatically keep listening if Voice Assistant is still enabled
      if (isVoiceAssistantEnabled()) {
        setTimeout(() => {
          try {
            startVoiceCommander()
          } catch {
            // ignore
          }
        }, 300)
      }
    }

    recognitionInstance = recognition
    recognition.start()
  } catch (err) {
    console.warn('Could not start continuous speech recognition:', err)
  }
}

export function stopVoiceCommander() {
  isListeningActive = false
  if (recognitionInstance) {
    try {
      recognitionInstance.stop()
    } catch {
      // ignore
    }
    recognitionInstance = null
  }
}

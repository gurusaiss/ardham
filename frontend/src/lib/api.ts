const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : import.meta.env.DEV
    ? 'http://localhost:8000'
    : ''

export type LoanField = {
  value: unknown
  source_text: string
  confidence: number
}

export type LoanTerms = Record<string, LoanField>

export type Question = {
  field_id: string
  prompt_te: string
  prompt_en: string
  prompt_hi?: string
}

export type GradeResult = {
  correct: boolean
  heard: string
  field_id: string
}

export type Certificate = {
  session_id: string
  loan_type: string
  terms: LoanTerms
  questions: Question[]
  results: GradeResult[]
  score: number
  created_at: string
  sha256: string
}

export type ModelUnavailableDetail = {
  error: 'model_unavailable'
  backend: string
  reason: string
}

export type ApiErrorDetail = {
  error?: string
  message?: string
  message_en?: string
  message_te?: string
  message_hi?: string
  backend?: string
  reason?: string
}

/** Thrown for any non-2xx response. `.detail` preserves structured error responses,
 * and `.modelUnavailable` is set when the backend returned 503. */
export class ApiError extends Error {
  status: number
  detail: ApiErrorDetail | null
  modelUnavailable: ModelUnavailableDetail | null

  constructor(status: number, message: string, detail: ApiErrorDetail | null = null) {
    super(message)
    this.status = status
    this.detail = detail
    this.modelUnavailable =
      detail?.error === 'model_unavailable' ? (detail as unknown as ModelUnavailableDetail) : null
  }
}

// --- Debug/latency panel support -------------------------------------------------

export type LatencyEntry = { label: string; seconds: number; at: number }

const latencyLog: LatencyEntry[] = []
const latencyListeners = new Set<() => void>()

function recordLatency(label: string, seconds: number | undefined | null) {
  if (typeof seconds !== 'number') return
  latencyLog.push({ label, seconds, at: Date.now() })
  if (latencyLog.length > 50) latencyLog.shift()
  latencyListeners.forEach((cb) => cb())
}

export function subscribeLatency(cb: () => void): () => void {
  latencyListeners.add(cb)
  return () => latencyListeners.delete(cb)
}

export function getLatencyLog(): LatencyEntry[] {
  return latencyLog
}

export function clearLatencyLog() {
  latencyLog.length = 0
  latencyListeners.forEach((cb) => cb())
}

// --- Core request helper -----------------------------------------------------------

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail: ApiErrorDetail | null = null
    try {
      const parsed = JSON.parse(text)
      detail = parsed?.detail || parsed
    } catch {
      // not JSON, or not our shape — fall through with detail=null
    }
    const msg =
      detail?.message ||
      detail?.message_en ||
      (detail?.backend ? `${detail.backend}: ${detail.reason}` : '') ||
      text ||
      res.statusText
    throw new ApiError(res.status, msg, detail)
  }
  return res.json() as Promise<T>
}

// --- Settings / backend switch ------------------------------------------------------

export async function getSettings(): Promise<{ backend: string; available_backends: string[] }> {
  const res = await fetch(`${API_BASE}/settings`)
  return asJson(res)
}

export async function setBackend(backend: 'local' | 'aistudio' | 'groq'): Promise<{ backend: string }> {
  const res = await fetch(`${API_BASE}/settings/backend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backend }),
  })
  return asJson(res)
}

// --- Session flow ------------------------------------------------------------------

export interface FairnessAnalysis {
  sanctioned_amount: number
  upfront_deductions: number
  net_in_hand: number
  total_payable: number
  total_extra_cost: number
  stated_interest_rate: number
  effective_apr: number
  apr_gap: number
  tenure_months: number
  fairness_score: number
  fairness_label: string
  fairness_label_te: string
  moneylender_comparison: {
    shark_apr: number
    shark_cost: number
    borrower_savings: number
    savings_te: string
    savings_en: string
  }
  warnings_en: string[]
  warnings_te: string[]
}

export async function extractTerms(
  loanType: string,
  imageOrImages: File | File[]
): Promise<{
  session_id: string
  terms: LoanTerms
  consistency_warnings: string[]
  fairness_analysis?: FairnessAnalysis
}> {
  const form = new FormData()
  form.append('loan_type', loanType)
  if (Array.isArray(imageOrImages)) {
    imageOrImages.forEach((f) => form.append('images', f))
    if (imageOrImages.length > 0) {
      form.append('image', imageOrImages[0])
    }
  } else {
    form.append('image', imageOrImages)
    form.append('images', imageOrImages)
  }
  const res = await fetch(`${API_BASE}/extract`, { method: 'POST', body: form })
  const data = await asJson<{
    session_id: string
    terms: LoanTerms
    consistency_warnings: string[]
    fairness_analysis?: FairnessAnalysis
    latency: { extract_s: number }
  }>(res)
  recordLatency('extract', data.latency?.extract_s)
  return data
}

export async function getTerms(sessionId: string): Promise<{ terms: LoanTerms; loan_type: string }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/terms`)
  return asJson(res)
}

export async function getAnalysis(sessionId: string): Promise<FairnessAnalysis> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/analysis`)
  return asJson(res)
}

export async function confirmTerms(sessionId: string, terms: LoanTerms) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms }),
  })
  return asJson(res)
}

export interface ExplanationSentence {
  field_id: string
  text_te: string
  text_en?: string
  text_hi?: string
}

export async function getExplanation(
  sessionId: string,
  onlyFieldIds?: string[]
): Promise<{ sentences: ExplanationSentence[]; dropped: { field_id: string; reason: string }[] }> {
  const qs = onlyFieldIds && onlyFieldIds.length ? `?field_ids=${onlyFieldIds.join(',')}` : ''
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/explain${qs}`)
  const data = await asJson<{
    sentences: ExplanationSentence[]
    dropped: { field_id: string; reason: string }[]
    latency: { explain_by_field_s: Record<string, number>; total_s: number }
  }>(res)
  recordLatency('explain', data.latency?.total_s)
  return data
}

export async function getQuiz(sessionId: string): Promise<{ questions: Question[] }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/quiz`)
  return asJson(res)
}

export async function submitAnswer(
  sessionId: string,
  fieldId: string,
  audio: Blob | null,
  typedAnswer: string | null
): Promise<GradeResult> {
  const form = new FormData()
  form.append('field_id', fieldId)
  if (audio) form.append('audio', audio, 'answer.wav')
  if (typedAnswer) form.append('typed_answer', typedAnswer)
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/answer`, { method: 'POST', body: form })
  const data = await asJson<GradeResult & { latency: { transcribe_s: number; grade_s: number } }>(res)
  recordLatency('answer', (data.latency?.transcribe_s ?? 0) + (data.latency?.grade_s ?? 0))
  return data
}

export async function getCertificate(sessionId: string): Promise<Certificate> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/certificate`)
  return asJson(res)
}

export async function getSampleCardFile(loanType: string): Promise<File> {
  const res = await fetch(`${API_BASE}/samples/${loanType}/card.png`)
  if (!res.ok) throw new Error('Could not load sample card')
  const blob = await res.blob()
  return new File([blob], `${loanType}_card.png`, { type: 'image/png' })
}

export function getCertificateHtmlUrl(sessionId: string): string {
  return `${API_BASE}/sessions/${sessionId}/certificate.html`
}

export function getAnswerAudioUrl(sessionId: string, fieldId: string): string {
  return `${API_BASE}/sessions/${sessionId}/audio/${fieldId}`
}

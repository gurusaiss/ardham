/**
 * Authentication & User Session Manager
 * 
 * Supports:
 * - Real Sign-in / Sign-up persistence in localStorage
 * - 1-Click Instant Demo logins for hackathon judges & field testing
 * - Officer and Borrower role tracking
 */

export interface User {
  id: string
  name: string
  role: 'officer' | 'borrower'
  phone: string
  organization: string
  isDemo?: boolean
}

const AUTH_KEY = 'ardham_user'

const DEMO_OFFICER: User = {
  id: 'usr_demo_officer_01',
  name: 'Ramesh Kumar',
  role: 'officer',
  phone: '9848022338',
  organization: 'Spandana Sphoorty MFI (Vizag Branch)',
  isDemo: true,
}

const DEMO_BORROWER: User = {
  id: 'usr_demo_borrower_02',
  name: 'Anitha Devi',
  role: 'borrower',
  phone: '9440188291',
  organization: 'DWCRA SHG Group #4, Anandapuram',
  isDemo: true,
}

type AuthListener = (user: User | null) => void
const authListeners = new Set<AuthListener>()

function notify(user: User | null) {
  authListeners.forEach((fn) => {
    try {
      fn(user)
    } catch {
      // ignore
    }
  })
}

export function subscribeAuth(fn: AuthListener): () => void {
  authListeners.add(fn)
  fn(getCurrentUser())
  return () => {
    authListeners.delete(fn)
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function signInDemo(role: 'officer' | 'borrower' = 'officer'): User {
  const user = role === 'officer' ? DEMO_OFFICER : DEMO_BORROWER
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  notify(user)
  return user
}

export function signIn(phone: string, role: 'officer' | 'borrower' = 'officer'): User {
  const existing = getCurrentUser()
  const user: User = {
    id: existing?.id || `usr_${Date.now()}`,
    name: existing?.name || (role === 'officer' ? 'Field Officer' : 'Borrower'),
    role,
    phone,
    organization: role === 'officer' ? 'Rural Financial Services' : 'Self-Help Group',
    isDemo: false,
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  notify(user)
  return user
}

export function signUp(name: string, phone: string, role: 'officer' | 'borrower', organization: string): User {
  const user: User = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    role,
    phone: phone.trim(),
    organization: organization.trim() || (role === 'officer' ? 'NBFC / Bank' : 'Rural Borrower'),
    isDemo: false,
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  notify(user)
  return user
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY)
  notify(null)
}

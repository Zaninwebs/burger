/**
 * Einwilligungen (Cookie-Banner). Notwendige Speicherung ist immer aktiv;
 * „Externe Medien“ (Google Maps) nur nach Zustimmung. Die Entscheidung liegt
 * im localStorage und kann jederzeit über „Cookie-Einstellungen“ geändert werden.
 */
export interface Consent {
  /** Google-Maps-Karte und andere eingebettete Inhalte von Drittanbietern */
  media: boolean
  /** Zeitpunkt der Entscheidung (ISO) */
  at: string
  v: number
}

const KEY = 'aoh-consent'
const VERSION = 1
const CHANGE = 'aoh-consent-change'
const OPEN = 'aoh-consent-open'

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Consent
    return c.v === VERSION ? c : null
  } catch {
    return null
  }
}

export function saveConsent(media: boolean): Consent {
  const c: Consent = { media, at: new Date().toISOString(), v: VERSION }
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    /* privater Modus – Entscheidung gilt dann nur für diesen Besuch */
  }
  window.dispatchEvent(new CustomEvent(CHANGE, { detail: c }))
  return c
}

export function onConsentChange(fn: (c: Consent) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<Consent>).detail)
  window.addEventListener(CHANGE, h)
  return () => window.removeEventListener(CHANGE, h)
}

/** Öffnet den Banner erneut (Link „Cookie-Einstellungen“). */
export function openConsent() {
  window.dispatchEvent(new Event(OPEN))
}

export function onConsentOpen(fn: () => void): () => void {
  window.addEventListener(OPEN, fn)
  return () => window.removeEventListener(OPEN, fn)
}

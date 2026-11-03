// Gemeinsame Regeln für Frontend und Backend des Terminsystems.
// Öffnungszeiten laut bisheriger Website: Di–Fr 09:00–18:00, Sa 09:00–14:00.

export const REQUEST_STATUSES = ['pending', 'proposed', 'confirmed', 'declined', 'completed'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Offen',
  proposed: 'Alternative vorgeschlagen',
  confirmed: 'Bestätigt',
  declined: 'Abgelehnt',
  completed: 'Erledigt',
}

export const DAY_MODES = ['auto', 'available', 'partial', 'full', 'closed'] as const
export type DayMode = (typeof DAY_MODES)[number]

export type DayStatus = 'available' | 'partial' | 'full' | 'closed' | 'past'

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  available: 'Verfügbar',
  partial: 'Teilweise verfügbar',
  full: 'Ausgebucht',
  closed: 'Geschlossen',
  past: 'Vergangen',
}

/**
 * Leistungen für die Terminanfrage – bewusst wenige, leicht verständliche
 * Gruppen. Details klärt der Salon beim Rückruf.
 */
export const BOOKABLE_SERVICES = [
  'Damen-Haarschnitt',
  'Herren-Haarschnitt',
  'Kinder-Haarschnitt',
  'Farbe, Strähnen oder Balayage',
  'Föhnen, Styling oder Hochsteckfrisur',
  'Brautfrisur',
  'Bart',
  'Etwas anderes / Beratung',
] as const

/** Mitarbeiter, die Kunden für ihren Termin wählen können. */
export const STAFF = [
  { id: 'simyan', name: 'Simyan', role: 'Inhaber & Friseurmeister' },
  { id: 'graziella', name: 'Graziella', role: 'Top-Stylistin' },
  { id: 'vanessa', name: 'Vanessa', role: 'Top-Stylistin' },
  { id: 'chiara', name: 'Chiara', role: 'Top-Stylistin' },
  { id: 'rosel', name: 'Rosel', role: 'Auszubildende, 3. Lehrjahr' },
  { id: 'sarkar', name: 'Sarkar', role: 'Auszubildender, 2. Lehrjahr' },
] as const

export type StaffId = (typeof STAFF)[number]['id']

/** Leerer Wert = „Egal, wer frei ist“. */
export const staffName = (id: string | null | undefined) =>
  STAFF.find((s) => s.id === id)?.name ?? 'Egal, wer frei ist'

export const isStaffId = (v: unknown): v is StaffId => STAFF.some((s) => s.id === v)

/** Wie viele Termine gleichzeitig angefragt werden können (eine Person je Stuhl). */
export const SLOT_CAPACITY = STAFF.length

/** Buchungsfenster: frühestens morgen, spätestens in so vielen Tagen. */
export const BOOKING_HORIZON_DAYS = 120

/** Startzeiten der Zeitfenster pro Wochentag (0 = Sonntag). */
const SLOT_HOURS: Record<number, number[]> = {
  0: [],
  1: [],
  2: [9, 10, 11, 12, 13, 14, 15, 16, 17],
  3: [9, 10, 11, 12, 13, 14, 15, 16, 17],
  4: [9, 10, 11, 12, 13, 14, 15, 16, 17],
  5: [9, 10, 11, 12, 13, 14, 15, 16, 17],
  6: [9, 10, 11, 12, 13],
}

export const OPENING_HOURS = [
  { days: 'Montag', hours: 'Geschlossen' },
  { days: 'Dienstag – Freitag', hours: '09:00 – 18:00' },
  { days: 'Samstag', hours: '09:00 – 14:00' },
  { days: 'Sonntag', hours: 'Geschlossen' },
] as const

const pad = (n: number) => String(n).padStart(2, '0')

export const isIsoDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseIsoDate(s).getTime())

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  // Ungültige Daten wie 2026-02-31 ablehnen
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return new Date(Number.NaN)
  }
  return date
}

export const toIsoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

/** Heutiges Datum in Deutschland (Europe/Berlin), als YYYY-MM-DD. */
export function todayInBerlin(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(now)
}

export function slotsForDate(iso: string): string[] {
  const weekday = parseIsoDate(iso).getUTCDay()
  return SLOT_HOURS[weekday].map((h) => `${pad(h)}:00`)
}

/** Ostersonntag (Gauß/Anonymer gregorianischer Algorithmus). */
function easterSunday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Gesetzliche Feiertage in Nordrhein-Westfalen. */
export function nrwHolidays(year: number): Map<string, string> {
  const easter = easterSunday(year)
  return new Map([
    [`${year}-01-01`, 'Neujahr'],
    [addDays(easter, -2), 'Karfreitag'],
    [addDays(easter, 1), 'Ostermontag'],
    [`${year}-05-01`, 'Tag der Arbeit'],
    [addDays(easter, 39), 'Christi Himmelfahrt'],
    [addDays(easter, 50), 'Pfingstmontag'],
    [addDays(easter, 60), 'Fronleichnam'],
    [`${year}-10-03`, 'Tag der Deutschen Einheit'],
    [`${year}-11-01`, 'Allerheiligen'],
    [`${year}-12-25`, '1. Weihnachtstag'],
    [`${year}-12-26`, '2. Weihnachtstag'],
  ])
}

export function holidayName(iso: string): string | undefined {
  return nrwHolidays(Number(iso.slice(0, 4))).get(iso)
}

// ---- API-Typen ------------------------------------------------------------

export interface PublicSlot {
  time: string
  free: boolean
}

export interface PublicDay {
  date: string
  status: DayStatus
  /** Öffentlicher Hinweis, z. B. „Betriebsurlaub“ oder Feiertagsname. */
  label?: string
  slots: PublicSlot[]
}

export interface AvailabilityResponse {
  month: string
  days: PublicDay[]
}

export interface BookingRequestInput {
  service: string
  /** Gewünschte Person, leer = egal */
  staff: string | null
  date: string
  time: string | null
  name: string
  phone: string
  /** optional – viele Kunden möchten nur telefonisch erreichbar sein */
  email: string
  message: string
  consent: boolean
  /** Honeypot – muss leer bleiben. */
  website?: string
  /** Zeitpunkt, zu dem das Formular geöffnet wurde (Spam-Schutz). */
  startedAt?: number
}

export interface AdminRequest {
  id: string
  createdAt: string
  updatedAt: string
  status: RequestStatus
  service: string
  staff: string | null
  date: string
  time: string | null
  name: string
  phone: string
  email: string
  message: string
  ownerNote: string
}

export interface AdminSlotRequest {
  id: string
  name: string
  staff: string | null
  status: RequestStatus
}

export interface AdminSlot {
  time: string
  /** frei = noch Platz, voll = alle Stühle belegt */
  state: 'free' | 'blocked' | 'partial' | 'full'
  requests: AdminSlotRequest[]
}

export interface AdminDay {
  date: string
  mode: DayMode
  status: DayStatus
  note: string
  publicNote: string
  holiday?: string
  slots: AdminSlot[]
  requestCount: number
}

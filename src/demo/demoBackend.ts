import { addDays, slotsForDate, todayInBerlin, STAFF } from '../../shared/booking'
import { createHandler } from '../../server/handler'
import type { KVStore } from '../../server/store'
import { encrypt, loadSecrets, newId } from './demoSecurity'

// Vollständiges Demo-Backend im Browser: derselbe Code wie auf dem Server,
// gespeichert im localStorage. So können Kunden Terminanfrage UND
// Admin-Bereich ausprobieren, ohne dass echte Daten irgendwohin gehen.

const PREFIX = 'aoh-demo:'
const VERSION_KEY = 'aoh-demo-version'
const VERSION = '4'

const mem = new Map<string, string>()
const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k)
    } catch {
      return mem.get(k) ?? null
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {
      mem.set(k, v)
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k)
    } catch {
      mem.delete(k)
    }
  },
  keys(): string[] {
    try {
      return Object.keys(localStorage)
    } catch {
      return [...mem.keys()]
    }
  },
}

const store: KVStore = {
  async get(key) {
    const v = ls.get(PREFIX + key)
    return v ? JSON.parse(v) : null
  },
  async set(key, value) {
    ls.set(PREFIX + key, JSON.stringify(value))
  },
  async setIfNew(key, value) {
    if (ls.get(PREFIX + key) !== null) return false
    ls.set(PREFIX + key, JSON.stringify(value))
    return true
  },
  async delete(key) {
    ls.del(PREFIX + key)
  },
  async list(prefix) {
    return ls
      .keys()
      .filter((k) => k.startsWith(PREFIX + prefix))
      .map((k) => k.slice(PREFIX.length))
      .sort()
  },
}

/** Beispiel-Anfragen (frei erfunden, als Demo gekennzeichnet). */
function seed() {
  if (ls.get(VERSION_KEY) === VERSION) return
  for (const k of ls.keys()) if (k.startsWith(PREFIX)) ls.del(k)

  const today = todayInBerlin()
  const nextOpen = (from: number) => {
    let d = addDays(today, from)
    while (slotsForDate(d).length === 0) d = addDays(d, 1)
    return d
  }
  const samples = [
    { day: 1, time: '10:00', staff: 'simyan', status: 'pending', service: 'Herren-Haarschnitt', name: 'Demo: Max Mustermann', phone: '0171 0000001', message: 'Gern mit Bart.' },
    { day: 1, time: '14:00', staff: 'vanessa', status: 'confirmed', service: 'Farbe, Strähnen oder Balayage', name: 'Demo: Erika Beispiel', phone: '0171 0000002', message: '' },
    { day: 2, time: '15:00', staff: null, status: 'pending', service: 'Damen-Haarschnitt', name: 'Demo: Anna Probe', phone: '0171 0000003', message: '' },
    { day: 3, time: '11:00', staff: 'graziella', status: 'proposed', service: 'Brautfrisur', name: 'Demo: Lena Test', phone: '0171 0000004', message: 'Probetermin gewünscht.' },
    { day: 4, time: '09:00', staff: 'chiara', status: 'pending', service: 'Föhnen, Styling oder Hochsteckfrisur', name: 'Demo: Sara Muster', phone: '0171 0000005', message: '' },
  ] as const
  const ts = new Date().toISOString()
  for (const s of samples) {
    const date = nextOpen(s.day)
    const id = newId()
    ls.set(
      `${PREFIX}req/${date}/${id}`,
      JSON.stringify({
        id,
        createdAt: ts,
        updatedAt: ts,
        status: s.status,
        service: s.service,
        staff: s.staff,
        date,
        time: s.time,
        contact: encrypt(0, { name: s.name, phone: s.phone, email: '', message: s.message }),
      }),
    )
    if (s.time && s.staff) ls.set(`${PREFIX}lock/${date}/${s.time}/${s.staff}`, JSON.stringify({ requestId: id }))
  }
  // Einen Tag beispielhaft als Betriebsurlaub markieren
  ls.set(`${PREFIX}day/${nextOpen(9)}`, JSON.stringify({ mode: 'closed', note: 'Demo-Eintrag', publicNote: 'Betriebsurlaub', blocked: [] }))
  void STAFF
  ls.set(VERSION_KEY, VERSION)
}

let handler: ReturnType<typeof createHandler> | null = null

export async function demoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!handler) {
    seed()
    handler = createHandler({ store, secrets: loadSecrets() as never })
  }
  await new Promise((r) => setTimeout(r, 200))
  return handler.handle(new Request(`https://demo.local/api${path}`, init), 'demo-browser')
}

/** Setzt die Demo auf die Beispieldaten zurück. */
export function resetDemo() {
  ls.del(VERSION_KEY)
  handler = null
}

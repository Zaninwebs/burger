import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  STAFF,
  slotsForDate,
  staffName,
  DAY_STATUS_LABEL,
  STATUS_LABEL,
  todayInBerlin,
  type AdminDay,
  type AdminRequest,
  type DayMode,
  type RequestStatus,
} from '../../shared/booking'
import { Calendar, longDate } from '../components/Calendar'
import { Monogram } from '../components/Monogram'
import { api, ApiError } from '../lib/api'
import { IS_DEMO, siteUrl } from '../lib/site'

const TOKEN_KEY = 'aoh-admin-token'

const MODE_LABEL: Record<DayMode, string> = {
  auto: 'Automatisch',
  available: 'Verfügbar',
  partial: 'Teilweise',
  full: 'Ausgebucht',
  closed: 'Geschlossen',
}

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AdminApp() {
  const [token, setToken] = useState<string | null>(readToken)
  const [tab, setTab] = useState<'requests' | 'calendar'>('requests')

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignorieren */
    }
    setToken(null)
  }, [])

  const call = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      try {
        return await api<T>(path, { ...init, token })
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) logout()
        throw e
      }
    },
    [token, logout],
  )

  if (!token)
    return (
      <Login
        onLogin={(t) => {
          try {
            sessionStorage.setItem(TOKEN_KEY, t)
          } catch {
            /* ignorieren */
          }
          setToken(t)
        }}
      />
    )

  return (
    <div className="admin">
      <header className="admin__bar">
        <a href={siteUrl('/')} className="admin__brand">
          <Monogram className="admin__mono" />
          <span>Terminverwaltung</span>
        </a>
        <nav className="admin__tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'requests'} onClick={() => setTab('requests')}>
            Anfragen
          </button>
          <button role="tab" aria-selected={tab === 'calendar'} onClick={() => setTab('calendar')}>
            Kalender &amp; Zeiten
          </button>
        </nav>
        {IS_DEMO && (
          <a href={siteUrl('/')} className="admin__logout">
            Zur Website
          </a>
        )}
        <button className="admin__logout" onClick={logout}>
          Abmelden
        </button>
      </header>
      <main className="admin__main">{tab === 'requests' ? <Requests call={call} /> : <Days call={call} />}</main>
    </div>
  )
}

type Call = <T>(path: string, init?: RequestInit) => Promise<T>

// ---------------------------------------------------------------------------

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { token } = await api<{ token: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
      onLogin(token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={submit} className="admin-login__card">
        <Monogram className="admin-login__mono" title="Art of Hair" />
        <h1>Terminverwaltung</h1>
        {IS_DEMO && (
          <div className="admin-demo">
            <strong>Demo-Zugang</strong>
            <span>
              Passwort: <code>demo</code>
            </span>
            <small>Beispieldaten – Änderungen bleiben nur in Ihrem Browser.</small>
            <button type="button" className="admin-btn admin-btn--small" onClick={() => setPassword('demo')}>
              Passwort einsetzen
            </button>
          </div>
        )}
        <label htmlFor="pw">Passwort</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        {error && <p className="admin__error" role="alert">{error}</p>}
        <button className="admin-btn admin-btn--gold" disabled={busy || !password}>
          {busy ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Requests({ call }: { call: Call }) {
  const [items, setItems] = useState<AdminRequest[] | null>(null)
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending')
  const [upcoming, setUpcoming] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const q = upcoming ? `?from=${todayInBerlin()}` : ''
      const res = await call<{ requests: AdminRequest[] }>(`/admin/requests${q}`)
      setItems(res.requests)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden.')
    }
  }, [call, upcoming])

  useEffect(() => {
    load()
  }, [load])

  const update = async (id: string, body: Partial<Pick<AdminRequest, 'status' | 'ownerNote' | 'date' | 'time' | 'staff'>>) => {
    setError(null)
    try {
      const res = await call<{ request: AdminRequest }>(`/admin/requests/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
      setItems((list) => list?.map((r) => (r.id === id ? res.request : r)) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Diese Anfrage endgültig löschen? Alle personenbezogenen Daten werden entfernt.')) return
    try {
      await call(`/admin/requests/${id}`, { method: 'DELETE' })
      setItems((list) => list?.filter((r) => r.id !== id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length ?? 0 }
    items?.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1))
    return c
  }, [items])

  const shown = items?.filter((r) => filter === 'all' || r.status === filter) ?? []

  return (
    <section>
      <div className="admin__toolbar">
        <div className="admin__filters" role="group" aria-label="Status filtern">
          {(['pending', 'proposed', 'confirmed', 'declined', 'completed', 'all'] as const).map((s) => (
            <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Alle' : STATUS_LABEL[s]}
              <span>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="admin__check">
          <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Nur ab heute
        </label>
        <button className="admin-btn" onClick={load}>
          Aktualisieren
        </button>
      </div>

      {error && <p className="admin__error" role="alert">{error}</p>}
      {!items && !error && <p className="admin__empty">Lade Anfragen …</p>}
      {items && shown.length === 0 && <p className="admin__empty">Keine Anfragen in dieser Ansicht.</p>}

      <ul className="req-list">
        {shown.map((r) => (
          <li key={r.id} className={`req req--${r.status}`}>
            <div className="req__when">
              <strong>{longDate(r.date)}</strong>
              <span>{r.time ? `${r.time} Uhr` : 'Uhrzeit flexibel'}</span>
              <em className={`badge badge--${r.status}`}>{STATUS_LABEL[r.status]}</em>
            </div>
            <div className="req__who">
              <strong>{r.name}</strong>
              <span>{r.service}</span>
              <span>
                Bei: <b>{staffName(r.staff)}</b>
              </span>
              <a href={`tel:${r.phone.replace(/[^+0-9]/g, '')}`} className="req__call">
                Anrufen: {r.phone}
              </a>
              {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
              {r.message && <p className="req__msg">„{r.message}“</p>}
              <small>Eingegangen: {new Date(r.createdAt).toLocaleString('de-DE')}</small>
            </div>
            <div className="req__actions">
              <div className="req__status" role="group" aria-label="Status ändern">
                {(['confirmed', 'declined', 'completed', 'pending'] as const).map((s) => (
                  <button key={s} aria-pressed={r.status === s} className={`st st--${s}`} onClick={() => update(r.id, { status: s })}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              <Propose request={r} onSave={(body) => update(r.id, body)} />
              <label className="req__note">
                <span>Interne Notiz</span>
                <textarea
                  defaultValue={r.ownerNote}
                  rows={2}
                  onBlur={(e) => e.target.value !== r.ownerNote && update(r.id, { ownerNote: e.target.value })}
                />
              </label>
              <button className="req__delete" onClick={() => remove(r.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Anderen Termin vorschlagen: Tag, Uhrzeit und Person ändern. */
function Propose({
  request: r,
  onSave,
}: {
  request: AdminRequest
  onSave: (body: { date: string; time: string | null; staff: string | null; status: RequestStatus }) => void
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(r.date)
  const [time, setTime] = useState(r.time ?? '')
  const [staff, setStaff] = useState(r.staff ?? '')
  const times = slotsForDate(date)

  if (!open)
    return (
      <button className="admin-btn admin-btn--small req__propose-open" onClick={() => setOpen(true)}>
        Anderen Termin / andere Person vorschlagen
      </button>
    )

  const save = (status: RequestStatus) => onSave({ date, time: time || null, staff: staff || null, status })

  return (
    <div className="req__propose">
      <label>
        <span>Tag</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        <span>Uhrzeit</span>
        <select value={time} onChange={(e) => setTime(e.target.value)}>
          <option value="">flexibel</option>
          {times.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Person</span>
        <select value={staff} onChange={(e) => setStaff(e.target.value)}>
          <option value="">Egal</option>
          {STAFF.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {times.length === 0 && <p className="admin__error">An diesem Wochentag ist geschlossen.</p>}
      <div className="req__propose-actions">
        <button className="admin-btn admin-btn--small" onClick={() => save('proposed')}>
          Als Vorschlag speichern
        </button>
        <button className="admin-btn admin-btn--small admin-btn--ok" onClick={() => save('confirmed')}>
          Ändern &amp; bestätigen
        </button>
        <button className="admin-btn admin-btn--small" onClick={() => setOpen(false)}>
          Abbrechen
        </button>
      </div>
      <p className="admin__hint">Tipp: Rufen Sie den Kunden an und besprechen Sie den Vorschlag.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function Days({ call }: { call: Call }) {
  const [month, setMonth] = useState(todayInBerlin().slice(0, 7))
  const [days, setDays] = useState<AdminDay[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await call<{ days: AdminDay[] }>(`/admin/days?month=${month}`)
      setDays(res.days)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden.')
    }
  }, [call, month])

  useEffect(() => {
    setDays(null)
    load()
  }, [load])

  const day = days?.find((d) => d.date === selected) ?? null

  const save = async (patch: Partial<Pick<AdminDay, 'mode' | 'note' | 'publicNote'>> & { blocked?: string[] }) => {
    if (!day) return
    setError(null)
    const blocked = patch.blocked ?? day.slots.filter((s) => s.state === 'blocked').map((s) => s.time)
    try {
      await call(`/admin/days/${day.date}`, {
        method: 'PUT',
        body: JSON.stringify({ mode: patch.mode ?? day.mode, note: patch.note ?? day.note, publicNote: patch.publicNote ?? day.publicNote, blocked }),
      })
      await load()
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    }
  }

  const toggleSlot = (time: string) => {
    if (!day) return
    const blocked = new Set(day.slots.filter((s) => s.state === 'blocked').map((s) => s.time))
    if (blocked.has(time)) blocked.delete(time)
    else blocked.add(time)
    save({ blocked: [...blocked] })
  }

  return (
    <section className="days">
      <div className="days__cal">
        <Calendar
          month={month}
          days={days?.map((d) => ({ date: d.date, status: d.status, label: d.publicNote || d.holiday, slots: [] })) ?? null}
          loading={!days}
          selected={selected}
          onSelect={setSelected}
          onPrev={() => setMonth((m) => shiftMonth(m, -1))}
          onNext={() => setMonth((m) => shiftMonth(m, 1))}
          canPrev
          canNext
          allowAll
        />
        <p className="admin__hint">
          Tag anklicken, um Status, Hinweise und einzelne Zeitfenster zu verwalten. „Automatisch“ berechnet den Status
          aus freien Zeitfenstern, Öffnungszeiten und NRW-Feiertagen.
        </p>
      </div>

      <div className="days__panel">
        {error && <p className="admin__error" role="alert">{error}</p>}
        {!day ? (
          <p className="admin__empty">Kein Tag ausgewählt.</p>
        ) : (
          <div key={day.date}>
            <h2>
              {longDate(day.date)} {saved && <span className="admin__saved">Gespeichert ✓</span>}
            </h2>
            <p className="days__status">
              Status auf der Website: <strong className={`is-${day.status}`}>{DAY_STATUS_LABEL[day.status]}</strong>
              {day.holiday && <> · Feiertag: {day.holiday}</>}
            </p>

            <h3>Tagesstatus</h3>
            <div className="seg" role="group">
              {(Object.keys(MODE_LABEL) as DayMode[]).map((m) => (
                <button key={m} aria-pressed={day.mode === m} onClick={() => save({ mode: m })}>
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>

            <h3>Zeitfenster</h3>
            {day.slots.length === 0 ? (
              <p className="admin__empty">An diesem Wochentag gibt es keine Zeitfenster (geschlossen).</p>
            ) : (
              <ul className="slot-admin">
                {day.slots.map((s) => (
                  <li key={s.time} className={`is-${s.state}`}>
                    <span className="slot-admin__time">{s.time}</span>
                    <span className="slot-admin__state">
                      {s.state === 'blocked' && 'Blockiert'}
                      {s.state !== 'blocked' && s.requests.length === 0 && 'Verfügbar'}
                      {s.requests.map((q) => (
                        <span key={q.id} className="slot-admin__req">
                          {q.name} · {staffName(q.staff)} · {STATUS_LABEL[q.status]}
                        </span>
                      ))}
                    </span>
                    {(s.state === 'blocked' || s.requests.length === 0) && (
                      <button className="admin-btn admin-btn--small" onClick={() => toggleSlot(s.time)}>
                        {s.state === 'free' ? 'Blockieren' : 'Freigeben'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <h3>Hinweise</h3>
            <label className="admin__field">
              <span>Öffentlich (z. B. „Betriebsurlaub“) – sichtbar im Kalender</span>
              <input defaultValue={day.publicNote} maxLength={80} onBlur={(e) => e.target.value !== day.publicNote && save({ publicNote: e.target.value })} />
            </label>
            <label className="admin__field">
              <span>Intern (nur hier sichtbar)</span>
              <textarea defaultValue={day.note} rows={3} onBlur={(e) => e.target.value !== day.note && save({ note: e.target.value })} />
            </label>
          </div>
        )}
      </div>
    </section>
  )
}

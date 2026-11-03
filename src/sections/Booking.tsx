import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  BOOKABLE_SERVICES,
  BOOKING_HORIZON_DAYS,
  STAFF,
  addDays,
  staffName,
  todayInBerlin,
  type PublicDay,
} from '../../shared/booking'
import { Arrow } from '../components/Arrow'
import { Calendar, longDate } from '../components/Calendar'
import { Img } from '../components/Img'
import { Monogram } from '../components/Monogram'
import { business } from '../data/content'
import type { ImageId } from '../data/images.generated'
import { ApiError, getAvailability, sendRequest } from '../lib/api'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { IS_DEMO, siteUrl } from '../lib/site'

const STAFF_IMAGE: Record<string, ImageId> = {
  simyan: 'simyan-portrait',
  graziella: 'graziella',
  vanessa: 'vanessa',
  chiara: 'chiara',
  rosel: 'rosel',
  sarkar: 'sarkar',
}

const STEPS = ['Leistung', 'Person', 'Tag & Uhrzeit', 'Kontakt', 'Prüfen'] as const

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

const PHONE = /^[+0-9][0-9 ()/.-]{4,28}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Terminanfrage in fünf einfachen Schritten – eine Frage pro Bildschirm,
 * große Schaltflächen, klare Sprache. Der Salon bestätigt jede Anfrage
 * persönlich oder schlägt eine andere Zeit bzw. Person vor.
 */
export function Booking() {
  const today = todayInBerlin()
  const firstMonth = today.slice(0, 7)
  const lastMonth = addDays(today, BOOKING_HORIZON_DAYS).slice(0, 7)

  const [step, setStep] = useState(0)
  const [service, setService] = useState('')
  // undefined = noch nicht gewählt, null = egal
  const [staff, setStaff] = useState<string | null | undefined>(undefined)
  const [month, setMonth] = useState(() => (Number(today.slice(8)) > 22 ? shiftMonth(firstMonth, 1) : firstMonth))
  const [days, setDays] = useState<PublicDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  // undefined = noch nicht gewählt, null = egal
  const [time, setTime] = useState<string | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const startedAt = useRef(Date.now())
  const panel = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const shown = useRef({ step: 0, done: false })

  const load = useCallback(async (m: string, s: string | null) => {
    setLoading(true)
    setLoadError(null)
    try {
      setDays((await getAvailability(m, s)).days)
    } catch (e) {
      setDays(null)
      setLoadError(e instanceof ApiError ? e.message : 'Der Kalender konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (step >= 2 && staff !== undefined) load(month, staff)
  }, [month, staff, step, load])

  // Schrittwechsel: sanft einblenden und Fokus auf die Frage setzen
  useLayoutEffect(() => {
    // Nur reagieren, wenn sich Schritt oder Abschluss wirklich geändert haben
    if (shown.current.step === step && shown.current.done === done) return
    shown.current = { step, done }
    heading.current?.focus({ preventScroll: true })
    const el = panel.current
    if (el) {
      const top = el.getBoundingClientRect().top
      if (top < 60 || top > innerHeight * 0.6) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
      if (!prefersReducedMotion())
        gsap.fromTo(el.querySelectorAll('.bk-anim'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.04, ease: 'expo.out' })
    }
  }, [step, done])

  const day = days?.find((d) => d.date === date) ?? null

  const go = (n: number) => {
    setError(null)
    setStep(n)
  }

  // Fehlermeldungen verschwinden, sobald der Kunde das Feld korrigiert
  useEffect(() => {
    setFieldErrors({})
    setError(null)
  }, [name, phone, email, consent])

  const contactErrors = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2) e.name = 'Bitte geben Sie Ihren Namen ein.'
    if (!PHONE.test(phone.trim())) e.phone = 'Bitte geben Sie Ihre Telefonnummer ein, z. B. 0171 1234567.'
    if (email.trim() && !EMAIL.test(email.trim())) e.email = 'Diese E-Mail-Adresse scheint nicht zu stimmen.'
    if (!consent) e.consent = 'Bitte setzen Sie das Häkchen, damit wir Ihre Anfrage bearbeiten dürfen.'
    return e
  }

  const next = () => {
    if (step === 3) {
      const errs = contactErrors()
      setFieldErrors(errs)
      if (Object.keys(errs).length) {
        setError('Bitte prüfen Sie die rot markierten Felder.')
        document.getElementById(`bk-${Object.keys(errs)[0]}`)?.focus()
        return
      }
    }
    go(step + 1)
  }

  const canNext = [!!service, staff !== undefined, !!date && !!time, true, true][step]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (step !== 4 || !date) return
    setSending(true)
    setError(null)
    try {
      await sendRequest({
        service,
        staff: staff ?? null,
        date,
        time: time ?? null,
        name,
        phone,
        email,
        message,
        consent,
        website,
        startedAt: startedAt.current,
      })
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fields ?? {})
        if (err.status === 409) {
          setTime(undefined)
          load(month, staff ?? null)
          go(2)
          setError('Diese Uhrzeit ist leider inzwischen vergeben. Bitte wählen Sie eine andere.')
        }
      } else setError('Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setDone(false)
    setStep(0)
    setService('')
    setStaff(undefined)
    setDate(null)
    setTime(undefined)
    setMessage('')
    startedAt.current = Date.now()
  }

  const pick = (fn: () => void) => {
    fn()
    // Bei einfachen Auswahlschritten automatisch weiter
    setTimeout(() => setStep((s) => Math.min(s + 1, 4)), prefersReducedMotion() ? 0 : 280)
  }

  const summary: { label: string; value: string; step: number }[] = [
    { label: 'Leistung', value: service, step: 0 },
    { label: 'Bei', value: staffName(staff), step: 1 },
    { label: 'Tag', value: date ? longDate(date) : '–', step: 2 },
    { label: 'Uhrzeit', value: time ? `${time} Uhr` : '–', step: 2 },
    { label: 'Name', value: name, step: 3 },
    { label: 'Telefon', value: phone, step: 3 },
    ...(email ? [{ label: 'E-Mail', value: email, step: 3 }] : []),
    ...(message ? [{ label: 'Ihr Wunsch', value: message, step: 3 }] : []),
  ]

  return (
    <section id="termin" className="booking section on-dark grain" aria-labelledby="booking-title">
      <Monogram className="booking__mono" />
      <div className="wrap bk">
        <header className="bk__head">
          <p className="eyebrow">Termin</p>
          <h2 id="booking-title" className="h-lg" data-reveal="text">
            Termin <em>anfragen.</em>
          </h2>
          <p className="lead bk__intro">
            In fünf einfachen Schritten. Sie fragen Ihren Wunschtermin an – wir melden uns persönlich, bestätigen ihn
            oder schlagen Ihnen eine passende Alternative vor.
          </p>
          <a href={business.phoneHref} className="bk__call">
            <span className="bk__call-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <small>Lieber telefonisch?</small>
              <strong>{business.phoneDisplay}</strong>
            </span>
          </a>
        </header>

        <div className="bk__card" ref={panel}>
          {done ? (
            <div className="bk__done" role="status">
              <span className="booking__check bk-anim" aria-hidden="true">
                <svg viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="24" />
                  <path d="M15 27l7 7 15-16" />
                </svg>
              </span>
              <h3 ref={heading} tabIndex={-1} className="bk__q bk-anim">
                Vielen Dank, {name.split(' ')[0]}!
              </h3>
              <p className="bk__text bk-anim">
                Ihre Anfrage ist bei uns angekommen. <strong>Der Termin ist noch nicht fest.</strong> Wir rufen Sie unter{' '}
                <strong>{phone}</strong> an und bestätigen ihn – oder schlagen Ihnen eine andere Zeit vor.
              </p>
              <dl className="bk__summary bk-anim">
                {summary.slice(0, 4).map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className="bk__btn bk__btn--ghost bk-anim" onClick={reset}>
                Weitere Anfrage stellen
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="bk__progress" aria-label={`Schritt ${step + 1} von ${STEPS.length}`}>
                <p>
                  Schritt <strong>{step + 1}</strong> von {STEPS.length}
                  <span> · {STEPS[step]}</span>
                </p>
                <ol>
                  {STEPS.map((s, i) => (
                    <li key={s} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
                      <span className="sr-only">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Schritt 1 – Leistung */}
              {step === 0 && (
                <Step title="Was möchten Sie machen lassen?" headingRef={heading}>
                  <div className="bk__tiles" role="radiogroup" aria-label="Leistung">
                    {BOOKABLE_SERVICES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={service === s}
                        className={`bk__tile bk-anim ${service === s ? 'is-active' : ''}`}
                        onClick={() => pick(() => setService(s))}
                      >
                        <span>{s}</span>
                        <i aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {/* Schritt 2 – Person */}
              {step === 1 && (
                <Step title="Bei wem möchten Sie Ihren Termin?" hint="Sie können auch „Egal“ wählen – dann nehmen wir die Person, die zuerst frei ist." headingRef={heading}>
                  <div className="bk__people" role="radiogroup" aria-label="Mitarbeiter">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={staff === null}
                      className={`bk__person bk__person--any bk-anim ${staff === null ? 'is-active' : ''}`}
                      onClick={() => pick(() => setStaff(null))}
                    >
                      <span className="bk__avatar bk__avatar--any" aria-hidden="true">
                        <Monogram />
                      </span>
                      <span className="bk__person-name">Egal</span>
                      <span className="bk__person-role">Wer zuerst frei ist</span>
                    </button>
                    {STAFF.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={staff === p.id}
                        className={`bk__person bk-anim ${staff === p.id ? 'is-active' : ''}`}
                        onClick={() =>
                          pick(() => {
                            if (staff !== p.id) {
                              setDate(null)
                              setTime(undefined)
                            }
                            setStaff(p.id)
                          })
                        }
                      >
                        <span className="bk__avatar" aria-hidden="true">
                          <Img id={STAFF_IMAGE[p.id]} sizes="96px" />
                        </span>
                        <span className="bk__person-name">{p.name}</span>
                        <span className="bk__person-role">{p.role}</span>
                      </button>
                    ))}
                  </div>
                </Step>
              )}

              {/* Schritt 3 – Tag & Uhrzeit */}
              {step === 2 && (
                <Step
                  title="Wann passt es Ihnen?"
                  hint={`Tippen Sie auf einen Tag mit grünem oder gelbem Punkt und wählen Sie dann eine Uhrzeit.${staff ? ` Angezeigt wird, wann ${staffName(staff)} frei ist.` : ''}`}
                  headingRef={heading}
                >
                  <div className="bk__when">
                    <div className="bk-anim">
                      <Calendar
                        month={month}
                        days={days}
                        loading={loading}
                        selected={date}
                        onSelect={(d) => {
                          setDate(d)
                          setTime(undefined)
                          setTimeout(() => document.getElementById('bk-times')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
                        }}
                        onPrev={() => setMonth((m) => shiftMonth(m, -1))}
                        onNext={() => setMonth((m) => shiftMonth(m, 1))}
                        canPrev={month > firstMonth}
                        canNext={month < lastMonth}
                      />
                      {loadError && (
                        <p className="field__error" role="alert">
                          {loadError} Bitte rufen Sie uns an: {business.phoneDisplay}
                        </p>
                      )}
                    </div>
                    <div id="bk-times" className="bk__times bk-anim" aria-live="polite">
                      {day ? (
                        <>
                          <p className="bk__times-date">{longDate(day.date)}</p>
                          <p className="bk__times-q">Welche Uhrzeit?</p>
                          <div className="bk__slots" role="radiogroup" aria-label="Uhrzeit">
                            {day.slots.map((s) => (
                              <button
                                key={s.time}
                                type="button"
                                role="radio"
                                aria-checked={time === s.time}
                                disabled={!s.free}
                                className={`bk__slot ${time === s.time ? 'is-active' : ''}`}
                                onClick={() => setTime(s.time)}
                                aria-label={`${s.time} Uhr${s.free ? '' : ' – leider vergeben'}`}
                              >
                                {s.time}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="bk__times-empty">Bitte wählen Sie zuerst einen Tag im Kalender.</p>
                      )}
                    </div>
                  </div>
                </Step>
              )}

              {/* Schritt 4 – Kontakt */}
              {step === 3 && (
                <Step title="Wie erreichen wir Sie?" hint="Wir rufen Sie an, um den Termin zu bestätigen." headingRef={heading}>
                  <div className="bk__fields">
                    <BigField id="name" label="Ihr Name" value={name} onChange={setName} error={fieldErrors.name} autoComplete="name" />
                    <BigField
                      id="phone"
                      label="Ihre Telefonnummer"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={setPhone}
                      error={fieldErrors.phone}
                      autoComplete="tel"
                    />
                    <BigField
                      id="email"
                      label="E-Mail"
                      optional
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={setEmail}
                      error={fieldErrors.email}
                      autoComplete="email"
                    />
                    <BigField id="message" label="Ihr Wunsch oder eine Nachricht" optional textarea value={message} onChange={setMessage} />
                  </div>

                  <div className="hp" aria-hidden="true">
                    <label htmlFor="bk-website">Website</label>
                    <input id="bk-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>

                  <label className={`bk__consent bk-anim ${fieldErrors.consent ? 'has-error' : ''}`}>
                    <input id="bk-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span className="bk__check" aria-hidden="true" />
                    <span>
                      Ja, der Salon darf meine Angaben speichern, um mich wegen des Termins zu kontaktieren. Die Daten
                      werden verschlüsselt gespeichert und spätestens 30 Tage nach dem Termin gelöscht.{' '}
                      <a href={siteUrl('/datenschutz/')} className="link-u" target="_blank" rel="noopener">
                        Datenschutz
                      </a>
                    </span>
                  </label>
                  {fieldErrors.consent && <p className="field__error">{fieldErrors.consent}</p>}
                </Step>
              )}

              {/* Schritt 5 – Prüfen */}
              {step === 4 && (
                <Step title="Stimmt alles?" hint="Tippen Sie auf „Ändern“, wenn Sie etwas korrigieren möchten." headingRef={heading}>
                  <dl className="bk__summary bk__summary--edit">
                    {summary.map((s) => (
                      <div key={s.label} className="bk-anim">
                        <dt>{s.label}</dt>
                        <dd>{s.value}</dd>
                        <button type="button" className="bk__edit" onClick={() => go(s.step)}>
                          Ändern
                        </button>
                      </div>
                    ))}
                  </dl>
                </Step>
              )}

              {error && (
                <p className="bk__error" role="alert">
                  {error}
                </p>
              )}

              <div className="bk__nav">
                {step > 0 && (
                  <button key="back" type="button" className="bk__btn bk__btn--ghost" onClick={() => go(step - 1)}>
                    <span aria-hidden="true">←</span> Zurück
                  </button>
                )}
                {step < 4 ? (
                  <button key="next" type="button" className="bk__btn" onClick={next} disabled={!canNext}>
                    Weiter <Arrow />
                  </button>
                ) : (
                  <button key="send" type="submit" className="bk__btn bk__btn--gold" disabled={sending} data-cursor="Senden">
                    {sending ? 'Wird gesendet …' : 'Termin anfragen'} <Arrow />
                  </button>
                )}
              </div>
              <p className="bk__fine">
                {IS_DEMO
                  ? 'Vorschau: Anfragen werden hier nicht gesendet.'
                  : 'Unverbindliche Anfrage – der Termin gilt erst nach unserer Bestätigung.'}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Step({
  title,
  hint,
  children,
  headingRef,
}: {
  title: string
  hint?: string
  children: ReactNode
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <div className="bk__step">
      <h3 ref={headingRef} tabIndex={-1} className="bk__q bk-anim">
        {title}
      </h3>
      {hint && <p className="bk__hint bk-anim">{hint}</p>}
      {children}
    </div>
  )
}

interface BigFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  textarea?: boolean
  optional?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'email' | 'text'
}

/** Großes Eingabefeld mit Beschriftung darüber – gut lesbar für alle Altersgruppen. */
function BigField({ id, label, value, onChange, error, type = 'text', textarea, optional, autoComplete, inputMode }: BigFieldProps) {
  const fid = `bk-${id}`
  const common = {
    id: fid,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    'aria-invalid': !!error,
    'aria-describedby': error ? `err-${id}` : undefined,
    autoComplete,
  }
  return (
    <div className={`bk__field bk-anim ${textarea ? 'bk__field--wide' : ''} ${error ? 'has-error' : ''}`}>
      <label htmlFor={fid}>
        {label} {optional && <small>(freiwillig)</small>}
      </label>
      {textarea ? <textarea rows={3} maxLength={1000} {...common} /> : <input type={type} inputMode={inputMode} {...common} />}
      {error && (
        <p id={`err-${id}`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

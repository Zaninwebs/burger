import { useEffect, useRef, useState } from 'react'
import { onConsentOpen, readConsent, saveConsent } from '../lib/consent'
import { siteUrl } from '../lib/site'

/**
 * Cookie- und Datenschutz-Banner (DSGVO/TTDSG): erscheint beim ersten Besuch,
 * „Ablehnen“ und „Alle akzeptieren“ sind gleichwertig, Details lassen sich
 * einzeln wählen. Über „Cookie-Einstellungen“ im Footer jederzeit änderbar.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)
  const [media, setMedia] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const c = readConsent()
    if (!c) {
      // kurz nach dem Laden einblenden, damit der Seitenauftritt nicht gestört wird
      const t = setTimeout(() => setOpen(true), 1800)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(
    () =>
      onConsentOpen(() => {
        setMedia(readConsent()?.media ?? false)
        setDetails(true)
        setOpen(true)
      }),
    [],
  )

  useEffect(() => {
    if (open) title.current?.focus({ preventScroll: true })
  }, [open])

  const decide = (m: boolean) => {
    saveConsent(m)
    setOpen(false)
    setDetails(false)
  }

  if (!open) return null

  return (
    <div className="cookie" role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-text">
      <div className="cookie__inner">
        <div className="cookie__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.5A9 9 0 1111.5 3a3 3 0 003.5 3.5 3 3 0 003.5 3.5 3 3 0 002.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="8.5" cy="10" r="1.1" fill="currentColor" />
            <circle cx="12" cy="15.5" r="1.1" fill="currentColor" />
            <circle cx="16" cy="13" r="0.9" fill="currentColor" />
          </svg>
        </div>
        <h2 id="cookie-title" ref={title} tabIndex={-1} className="cookie__title">
          Ihre Privatsphäre
        </h2>
        <p id="cookie-text" className="cookie__text">
          Wir verwenden nur technisch notwendige Speicherung, damit die Website funktioniert. Externe Inhalte wie
          Google Maps laden wir erst, wenn Sie zustimmen. Ihre Wahl können Sie jederzeit unter
          „Cookie-Einstellungen“ ganz unten ändern.{' '}
          <a href={siteUrl('/datenschutz/')} className="link-u">
            Datenschutzerklärung
          </a>
        </p>

        {details && (
          <ul className="cookie__list">
            <li>
              <div>
                <strong>Notwendig</strong>
                <span>Speichert Ihre Auswahl und die Terminanfrage. Ohne diese funktioniert die Seite nicht.</span>
              </div>
              <span className="cookie__always">Immer aktiv</span>
            </li>
            <li>
              <label htmlFor="cookie-media">
                <strong>Externe Medien</strong>
                <span>Google Maps für die interaktive Karte. Dabei werden Daten an Google übertragen.</span>
              </label>
              <button
                id="cookie-media"
                type="button"
                role="switch"
                aria-checked={media}
                className={`cookie__switch ${media ? 'is-on' : ''}`}
                onClick={() => setMedia((m) => !m)}
              >
                <i />
                <span className="sr-only">Externe Medien erlauben</span>
              </button>
            </li>
          </ul>
        )}

        <div className={`cookie__actions ${details ? "is-details" : ""}`}>
          <button type="button" className="cookie__btn" onClick={() => decide(false)}>
            Nur notwendige
          </button>
          {details ? (
            <button type="button" className="cookie__btn" onClick={() => decide(media)}>
              Auswahl speichern
            </button>
          ) : (
            <button type="button" className="cookie__btn cookie__btn--link" onClick={() => setDetails(true)}>
              Einstellungen
            </button>
          )}
          <button type="button" className="cookie__btn cookie__btn--gold" onClick={() => decide(true)}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}

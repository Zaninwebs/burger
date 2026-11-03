import { useEffect, useRef, useState } from 'react'
import { business } from '../data/content'
import { IS_DEMO, siteUrl } from '../lib/site'

const PinIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

/**
 * Anfahrt: Ein Tipp auf die Karte öffnet die Routenplanung in Google Maps.
 * Die eingebettete Google-Karte lädt erst nach Klick auf „Karte laden“
 * (Zwei-Klick-Lösung, DSGVO) – vorher wird nichts von Google geladen.
 */
export function MapRoute() {
  const [live, setLive] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)

  // Dezente, animierte Höhenlinien als Platzhalter (keine echten Straßen)
  useEffect(() => {
    const c = canvas.current
    if (!c || live) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let t = 0
    const draw = () => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio || 1, 2)
      if (c.width !== Math.round(r.width * dpr)) {
        c.width = r.width * dpr
        c.height = r.height * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, r.width, r.height)
      const cx = r.width / 2
      const cy = r.height / 2
      for (let i = 1; i < 16; i++) {
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
          const wobble = Math.sin(a * 3 + i * 0.7 + t) * 6 + Math.cos(a * 5 - i + t * 0.6) * 4
          const rad = i * 34 + wobble
          const x = cx + Math.cos(a) * rad * 1.25
          const y = cy + Math.sin(a) * rad * 0.85
          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(207, 171, 112, ${0.22 - i * 0.012})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      t += 0.006
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [live])

  return (
    <section id="anfahrt" className="map section" aria-labelledby="map-title">
      <div className="wrap map__grid">
        <div className="map__text">
          <p className="eyebrow">Anfahrt</p>
          <h2 id="map-title" className="h-lg" data-reveal="text">
            So finden Sie <em>zu uns.</em>
          </h2>
          <address className="map__address" data-reveal="fade">
            {business.name}
            <br />
            {business.street}
            <br />
            {business.zip} {business.city}-{business.district}
          </address>
          <a href={business.routeUrl} target="_blank" rel="noopener noreferrer" className="map__btn" data-reveal="fade">
            <span className="map__btn-icon">
              <PinIcon />
            </span>
            <span>
              <small>Mit Google Maps</small>
              <strong>Route anzeigen</strong>
            </span>
          </a>
        </div>

        <div className="map__frame" data-reveal="fade">
          {live ? (
            <iframe
              title={`Karte: ${business.street}, ${business.zip} ${business.city}`}
              src={business.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <a
              href={business.routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="map__placeholder"
              aria-label="Route zum Salon in Google Maps anzeigen"
              data-cursor="Route"
            >
              <canvas ref={canvas} aria-hidden="true" />
              <span className="map__pin" aria-hidden="true">
                <i />
                <i />
                <b>
                  <PinIcon />
                </b>
              </span>
              <span className="map__label">
                <strong>Art of Hair by Simyan</strong>
                <span>{business.street}</span>
              </span>
              <span className="map__tap">Tippen für die Route →</span>
            </a>
          )}
          {!live && !IS_DEMO && (
            <div className="map__consent">
              <button type="button" onClick={() => setLive(true)}>
                Interaktive Karte laden
              </button>
              <p>
                Dabei werden Daten an Google übertragen.{' '}
                <a href={siteUrl('/datenschutz/')} className="link-u">
                  Datenschutz
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

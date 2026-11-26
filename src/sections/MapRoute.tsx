import { useEffect, useRef, useState } from 'react'
import { Img } from '../components/Img'
import { business } from '../data/content'
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from '../data/monogram'
import { onConsentChange, readConsent, saveConsent } from '../lib/consent'
import { siteUrl } from '../lib/site'

/** Gewundene Strecke vom Besucher zum Salon (rein dekorativ, keine echten Straßen). */
const ROUTE = 'M90 380 C 200 380, 190 290, 310 286 S 460 322, 492 236 S 560 120, 680 114'

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l8 18-8-4-8 4 8-18z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)
const WazeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 13.5C4 8.8 7.6 5 12.2 5S20 8.4 20 12.6c0 3.4-2.6 5.6-5.6 5.6H10c-1.6 0-2.6.8-3.4 1.8-.4-1.4-1.2-2.4-2-3.2-.4-.9-.6-2-.6-3.3z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="11" r="1" fill="currentColor" />
    <circle cx="14.5" cy="11" r="1" fill="currentColor" />
  </svg>
)

/**
 * Anfahrt: Foto vom Eingang mit der Adresse (einziger Ort auf der Seite),
 * daneben eine animierte Route zum Salon und die Wahl der Navigations-App.
 * Die echte Google-Karte lädt nur mit Einwilligung (Cookie-Banner).
 */
export function MapRoute() {
  const [live, setLive] = useState(() => readConsent()?.media ?? false)
  useEffect(() => onConsentChange((c) => setLive(c.media)), [])

  // Route zeichnet sich, sobald der Bereich ins Bild kommt
  const stage = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [live])

  return (
    <section id="anfahrt" className="route section" aria-labelledby="map-title">
      <div className="wrap">
        <header className="route__head">
          <p className="eyebrow">Anfahrt</p>
          <h2 id="map-title" className="h-lg" data-reveal="text">
            So finden Sie <em>zu uns.</em>
          </h2>
        </header>

        <div className="route__grid">
          <figure className="route__photo">
            <Img id="salon-front" reveal sizes="(min-width: 900px) 40vw, 100vw" />
            <figcaption className="route__address">
              <small>Ihr Ziel</small>
              <strong>{business.name}</strong>
              <span>
                {business.street} · {business.zip} {business.city}-{business.district}
              </span>
            </figcaption>
          </figure>

          <div className="route__panel">
            <div ref={stage} className={`route__stage ${inView ? 'is-in' : ''}`}>
              {live ? (
                <iframe
                  title={`Karte: ${business.name}`}
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
                  className="route__journey"
                  aria-label="Route zum Salon in Google Maps starten"
                  data-cursor="Route"
                >
                  <svg viewBox="0 0 800 450" aria-hidden="true" focusable="false">
                    <defs>
                      <linearGradient id="routeGold" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0" stopColor="#8d6024" />
                        <stop offset="0.5" stopColor="#f3d998" />
                        <stop offset="1" stopColor="#cfab70" />
                      </linearGradient>
                      <radialGradient id="routeGlow">
                        <stop offset="0" stopColor="#ffe9b8" stopOpacity="1" />
                        <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* angedeutete Straßen */}
                    <g className="route__streets">
                      <path d="M0 120 C 220 140, 420 90, 800 70" />
                      <path d="M0 250 C 160 230, 360 270, 800 225" />
                      <path d="M0 360 C 240 340, 520 380, 800 350" />
                      <path d="M180 0 C 200 150, 150 300, 190 450" />
                      <path d="M400 0 C 380 160, 430 300, 400 450" />
                      <path d="M610 0 C 630 140, 580 300, 620 450" />
                    </g>

                    {/* Strecke */}
                    <path className="route__track" d={ROUTE} />
                    <path className="route__line" d={ROUTE} pathLength={1} />
                    <path className="route__dash" d={ROUTE} />

                    {/* leuchtender Punkt fährt die Strecke ab */}
                    <g className="route__car">
                      <circle r="18" fill="url(#routeGlow)" opacity="0.55" />
                      <circle r="5.5" fill="#fff4d8" />
                      <animateMotion
                        dur="5s"
                        begin="1.6s"
                        repeatCount="indefinite"
                        path={ROUTE}
                        keyPoints="0;1;1"
                        keyTimes="0;0.8;1"
                        calcMode="linear"
                      />
                    </g>

                    {/* Start */}
                    <g className="route__start" transform="translate(90 380)">
                      <circle className="route__ping" r="10" />
                      <circle r="7" fill="#f4efe7" />
                      <circle r="3" fill="#15120f" />
                      <text x="16" y="28">
                        Ihr Standort
                      </text>
                    </g>

                    {/* Ziel: Salon mit AH-Monogramm */}
                    <g className="route__goal" transform="translate(680 114)">
                      <circle className="route__ring route__ring--1" r="34" />
                      <circle className="route__ring route__ring--2" r="34" />
                      <circle r="34" fill="url(#routeGold)" />
                      <circle r="30" fill="#15120f" />
                      <svg x="-19" y="-14" width="38" height="28" viewBox={MONOGRAM_VIEWBOX}>
                        <path d={MONOGRAM_PATH} fill="url(#routeGold)" fillRule="evenodd" />
                      </svg>
                      <text y="62" textAnchor="middle">
                        Art of Hair
                      </text>
                    </g>
                  </svg>
                  <span className="route__tap">
                    Tippen und losfahren <span aria-hidden="true">→</span>
                  </span>
                </a>
              )}
            </div>

            <p className="route__lead">Wählen Sie Ihre Navigations-App – die Route startet sofort.</p>
            <div className="route__apps">
              <a
                href={business.routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="route__app route__app--main"
              >
                <GoogleIcon />
                <span>
                  <small>Route mit</small>Google Maps
                </span>
              </a>
              <a href={business.appleMapsUrl} target="_blank" rel="noopener noreferrer" className="route__app">
                <AppleIcon />
                <span>
                  <small>Route mit</small>Apple Karten
                </span>
              </a>
              <a href={business.wazeUrl} target="_blank" rel="noopener noreferrer" className="route__app">
                <WazeIcon />
                <span>
                  <small>Route mit</small>Waze
                </span>
              </a>
            </div>

            {!live && (
              <p className="route__consent">
                <button type="button" onClick={() => saveConsent(true)} className="link-u">
                  Interaktive Google-Karte anzeigen
                </button>{' '}
                – dabei werden Daten an Google übertragen (
                <a href={siteUrl('/datenschutz/')} className="link-u">
                  Datenschutz
                </a>
                ).
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

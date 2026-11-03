import { useLayoutEffect, useRef } from 'react'
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from '../data/monogram'
import { business, hours } from '../data/content'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { IS_DEMO, siteUrl } from '../lib/site'
import { Button } from './Button'
import { GoldDust } from './GoldDust'

const SUBPATHS = MONOGRAM_PATH.split(/(?=M)/).filter(Boolean)

/** Footer: das Monogramm zeichnet sich beim Scrollen – ein Echo des Intros. */
export function Footer({ home = true }: { home?: boolean }) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>('.footer__mono-stroke')
      paths.forEach((p) => {
        const l = p.getTotalLength()
        gsap.set(p, { strokeDasharray: l, strokeDashoffset: l })
      })
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 10%', scrub: 0.8 },
      })
      tl.to(paths, { strokeDashoffset: 0, ease: 'none', stagger: 0.02 })
        .fromTo('.footer__mono-fill', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0.6)
      gsap.from('.footer__brand-line > span', {
        yPercent: 110,
        duration: 1.4,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.footer__brand', start: 'top 92%', once: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const year = new Date().getFullYear()
  const open = hours.filter((h) => h.value !== 'Geschlossen')

  return (
    <footer ref={root} className="footer on-dark grain">
      <GoldDust density={0.6} />
      <div className="wrap">
        <div className="footer__top">
          <svg className="footer__mono" viewBox={MONOGRAM_VIEWBOX} aria-hidden="true">
            <defs>
              <linearGradient id="ft-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8a6a3c" />
                <stop offset="0.5" stopColor="#e8cf9e" />
                <stop offset="1" stopColor="#8a6a3c" />
              </linearGradient>
            </defs>
            {SUBPATHS.map((d, i) => (
              <path key={i} className="footer__mono-stroke" d={d} fill="none" stroke="url(#ft-gold)" strokeWidth={2.5} />
            ))}
            <path className="footer__mono-fill" d={MONOGRAM_PATH} fill="url(#ft-gold)" fillRule="evenodd" />
          </svg>
          <div className="footer__cta">
            <p className="h-md">
              Bereit für <em>Ihren neuen Look?</em>
            </p>
            <Button href={home ? '#termin' : siteUrl('/#termin')} variant="gold" cursor="Buchen">
              Termin anfragen
            </Button>
          </div>
        </div>

        <div className="footer__cols">
          <div>
            <h3>Adresse</h3>
            <p>
              {business.street}
              <br />
              {business.zip} {business.city}
            </p>
            <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-u">
              Route planen
            </a>
          </div>
          <div>
            <h3>Kontakt</h3>
            <p>
              <a href={business.phoneHref} className="link-u">
                {business.phoneDisplay}
              </a>
              <br />
              <a href={`mailto:${business.email}`} className="link-u">
                {business.email}
              </a>
              <br />
              <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-u">
                Instagram @{business.instagram}
              </a>
            </p>
          </div>
          <div>
            <h3>Öffnungszeiten</h3>
            <p>
              Di – Fr {open[0].value}
              <br />
              Sa {open[open.length - 1].value}
              <br />
              So &amp; Mo geschlossen
            </p>
          </div>
        </div>

        <p className="footer__brand" aria-label="Art of Hair by Simyan">
          <span className="footer__brand-line" aria-hidden="true">
            <span>
              {'Art of Hair'.split('').map((c, i) => (
                <span key={i} className="footer__letter" style={{ ['--i' as string]: i }}>
                  {c === ' ' ? '\u00a0' : c}
                </span>
              ))}
            </span>
          </span>
          <span className="footer__brand-line footer__brand-by" aria-hidden="true">
            <span>
              <i /> by Simyan <i />
            </span>
          </span>
        </p>

        <a
          href={business.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footer__insta"
          aria-label={`Instagram: @${business.instagram}`}
          data-cursor="Instagram"
        >
          <span className="footer__insta-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <span className="footer__insta-text">
            <small>Folgen Sie uns auf Instagram</small>
            <strong>@{business.instagram}</strong>
          </span>
          <span className="footer__insta-arrow" aria-hidden="true">→</span>
        </a>

        <div className="footer__legal">
          <span>© {year} {business.name}</span>
          <nav aria-label="Rechtliches">
            <a href={siteUrl('/impressum/')} className="link-u">
              Impressum
            </a>
            <a href={siteUrl('/datenschutz/')} className="link-u">
              Datenschutz
            </a>
            {IS_DEMO && (
              <a href={siteUrl('/admin/')} className="link-u">
                Inhaber-Login (Demo)
              </a>
            )}
          </nav>
        </div>
      </div>
    </footer>
  )
}

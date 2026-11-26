import { useLayoutEffect, useRef } from 'react'
import { Img } from '../components/Img'
import { Monogram } from '../components/Monogram'
import { gsap, prefersReducedMotion } from '../lib/motion'

const MANIFESTO =
  'Haar ist mehr als eine Frisur. Es ist Ausdruck, Haltung – Ihre persönliche Handschrift. Genau dafür nehmen wir uns Zeit.'

/** Manifest (Wörter leuchten beim Scrollen auf) + Geschichte des Salons. */
export function Salon() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.manifesto__word',
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
        },
      )
      gsap.fromTo(
        '.story__mono',
        { rotate: -8, yPercent: 20 },
        {
          rotate: 4,
          yPercent: -20,
          ease: 'none',
          scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="salon" className="salon" aria-labelledby="salon-title">
      <div className="manifesto wrap">
        <p className="eyebrow">Die Philosophie</p>
        <p className="manifesto__text" aria-label={MANIFESTO}>
          {MANIFESTO.split(' ').map((w, i) => (
            <span key={i} className="manifesto__word" aria-hidden="true">
              {w}{' '}
            </span>
          ))}
        </p>
      </div>

      <div className="story wrap">
        <Monogram className="story__mono" />
        <div className="story__media">
          <Img id="simyan-portrait" className="story__img" reveal parallax={0.18} sizes="(min-width: 900px) 38vw, 90vw" />
          <Img id="ah-wand" className="story__img-small" reveal sizes="(min-width: 900px) 18vw, 45vw" />
        </div>

        <div className="story__text">
          <p className="eyebrow">Der Salon</p>
          <h2 id="salon-title" className="h-lg" data-reveal="text">
            Ein Meisterbetrieb <em>mit eigener Handschrift.</em>
          </h2>
          <div className="story__body" data-stagger>
            <p className="lead">
              2025 hat Friseurmeister <strong>Simyan Chicho</strong> den Salon in der Lützenkirchener Straße
              übernommen – zuvor das Haaratelier Jennifer Hapke – und ihm als <em>Art of Hair by Simyan</em> ein
              neues Gesicht gegeben. Zuvor war er mehrere Jahre im Friseursalon Stephan in Leverkusen-Schlebusch tätig.
            </p>
            <p>
              Wir bieten das komplette Spektrum moderner Friseurleistungen – vom klassischen Damen- und
              Herrenhaarschnitt über professionelle Bartpflege bis hin zu aufwendigen Farbtechniken. Unser
              Schwerpunkt liegt auf Colorationen, Strähnen und Balayage.
            </p>
          </div>
          <dl className="story__facts" data-stagger>
            <div>
              <dt data-count="2025" data-count-from="1990">2025</dt>
              <dd>Neustart als Art of Hair</dd>
            </div>
            <div>
              <dt data-count="6">6</dt>
              <dd>Menschen im Team</dd>
            </div>
            <div>
              <dt>Meister</dt>
              <dd>Friseurmeister-Betrieb</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

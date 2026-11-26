import { useLayoutEffect, useRef } from 'react'
import { Button } from '../components/Button'
import { Img } from '../components/Img'
import { colorWorks } from '../data/content'
import { gsap, prefersReducedMotion } from '../lib/motion'

/**
 * Farbe als Herzstück: Auf dem Desktop wird die Sektion fixiert und die
 * Arbeiten gleiten horizontal vorbei (scroll-gesteuert). Auf Mobile
 * natives Wischen mit Scroll-Snap.
 */
export function Color() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px)', () => {
      const t = track.current
      const section = root.current
      if (!t || !section) return
      const distance = () => t.scrollWidth - innerWidth
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })
      // Jedes Bild bewegt sich innerhalb seines Rahmens (Tiefe)
      gsap.utils.toArray<HTMLElement>('.color__card .img picture').forEach((pic) => {
        gsap.fromTo(
          pic,
          { xPercent: -8, scale: 1.18 },
          {
            xPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: pic,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        )
      })
      gsap.to('.color__progress i', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="color on-dark grain" aria-labelledby="color-title">
      <div ref={track} className="color__track">
        <div className="color__intro">
          <p className="eyebrow">Colorationen · Strähnen · Balayage</p>
          <h2 id="color-title" className="h-xl" data-reveal="text">
            Farbe. <em>Mit Präzision</em> gemacht.
          </h2>
          <p className="lead" data-reveal="fade">
            Colorationen, Strähnen und Balayage sind unser Schwerpunkt. Wir arbeiten Ton für Ton – für Farbe, die
            natürlich fällt, leuchtet und zu Ihrem Typ passt.
          </p>
          <Button href="#termin" variant="gold" cursor="Buchen">
            Farbberatung anfragen
          </Button>
        </div>

        {colorWorks.map((w, i) => (
          <figure key={w.image} className={`color__card color__card--${i % 3}`} data-tilt>
            <Img id={w.image} sizes="(min-width: 900px) 34vw, 80vw" />
            <figcaption>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <strong>{w.title}</strong>
              <span>{w.caption}</span>
            </figcaption>
          </figure>
        ))}

        <div className="color__outro">
          <p className="h-md">
            Balayage <em>ab 100 €</em>
            <br />
            Strähnen <em>ab 60 €</em>
            <br />
            Ombré <em>ab 80 €</em>
          </p>
          <a href="#preise" className="link-u">
            Alle Farbpreise ansehen
          </a>
        </div>
      </div>
      <div className="color__progress" aria-hidden="true">
        <i />
      </div>
    </section>
  )
}

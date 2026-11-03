import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Img } from '../components/Img'
import { services } from '../data/content'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Interaktive Leistungsübersicht: Beim Hover (Desktop) bzw. Tippen (Mobile)
 * wechselt das große Bild, die Zeile verschiebt sich, Nummer & Preis erscheinen.
 */
export function Services() {
  const [active, setActive] = useState(0)
  const root = useRef<HTMLElement>(null)
  const floater = useRef<HTMLDivElement>(null)

  // Vorschaubild folgt dem Cursor leicht (Desktop)
  useEffect(() => {
    const el = root.current
    const f = floater.current
    if (!el || !f || !isFinePointer() || prefersReducedMotion()) return
    const yTo = gsap.quickTo(f, 'y', { duration: 1.2, ease: 'power3.out' })
    const rTo = gsap.quickTo(f, 'rotate', { duration: 1.2, ease: 'power3.out' })
    let lastX = 0
    const move = (e: PointerEvent) => {
      const list = el.querySelector('.services__list')
      if (!list) return
      const r = list.getBoundingClientRect()
      const rel = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1)
      yTo((rel - 0.5) * r.height * 0.35)
      rTo(gsap.utils.clamp(-4, 4, (e.clientX - lastX) * 0.4))
      lastX = e.clientX
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  return (
    <section ref={root} id="leistungen" className="services section" aria-labelledby="services-title">
      <div className="wrap services__head">
        <p className="eyebrow">Leistungen</p>
        <h2 id="services-title" className="h-xl" data-reveal="text">
          Was wir <em>für Sie</em> tun.
        </h2>
      </div>

      <div className="wrap services__body">
        <ol className="services__list">
          {services.map((s, i) => (
            <li key={s.title} className={`service ${i === active ? 'is-active' : ''}`} style={{ ['--i' as string]: i }}>
              <button
                type="button"
                className="service__row"
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={i === active}
                aria-controls={`service-detail-${i}`}
                data-cursor="Mehr"
              >
                <span className="service__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="service__title">{s.title}</span>
                <span className="service__from">{s.from}</span>
              </button>
              <div id={`service-detail-${i}`} className="service__detail">
                <div className={`service__detail-inner ${s.image ? '' : 'is-text'}`}>
                  {s.image && <Img id={s.image} className="service__thumb" sizes="90vw" />}
                  <p>{s.detail}</p>
                </div>
              </div>
              <span className="service__line" data-reveal="line" aria-hidden="true" />
            </li>
          ))}
        </ol>

        <div className="services__visual" aria-hidden="true">
          <div ref={floater} className="services__frame">
            {services.map((s, i) => (
              <div key={s.title} className={`services__img ${i === active ? 'is-active' : ''}`}>
                {s.image ? (
                  <Img id={s.image} sizes="(min-width: 900px) 30vw, 1px" />
                ) : (
                  <div className="services__text-card">
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <strong>{s.title}</strong>
                    <span>{s.detail}</span>
                  </div>
                )}
              </div>
            ))}
            <div className="services__caption">
              <span className="num">{String(active + 1).padStart(2, '0')}</span>
              <span>{services[active].detail}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap services__foot" data-reveal="fade">
        <p className="lead">Alle Leistungen und Preise finden Sie transparent in unserer Preisliste.</p>
        <Button href="#preise" variant="ghost">
          Zur Preisliste
        </Button>
      </div>
    </section>
  )
}

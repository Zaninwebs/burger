import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion'

interface Props {
  items: string[]
  /** Laufrichtung: 1 = nach links, -1 = nach rechts */
  direction?: 1 | -1
  dark?: boolean
}

/**
 * Endlos laufendes Band. Die Geschwindigkeit reagiert auf das Scrollen:
 * schnelleres Scrollen beschleunigt das Band, die Richtung folgt der
 * Scrollrichtung – ein subtiles, lebendiges Detail zwischen den Sektionen.
 */
export function Marquee({ items, direction = 1, dark }: Props) {
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = track.current
    if (!el || prefersReducedMotion()) return
    const tween = gsap.to(el, { xPercent: -50 * direction, duration: 38, ease: 'none', repeat: -1 })
    if (direction === -1) gsap.set(el, { xPercent: -50 })
    let dir = 1
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        if (v !== 0) dir = v > 0 ? 1 : -1
        const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 400)
        gsap.to(tween, { timeScale: dir * boost, duration: 0.2, overwrite: true })
        gsap.to(tween, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' })
      },
    })
    return () => {
      st.kill()
      tween.kill()
    }
  }, [direction])

  const row = items.map((item, i) => (
    <span key={i} className={`marquee__item ${i % 2 ? 'is-italic' : ''}`}>
      {item}
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 0l2.2 7.8L20 10l-7.8 2.2L10 20l-2.2-7.8L0 10l7.8-2.2z" />
      </svg>
    </span>
  ))

  return (
    <div className={`marquee ${dark ? 'on-dark' : ''}`} aria-hidden="true">
      <div ref={track} className="marquee__track">
        <div className="marquee__group">{row}</div>
        <div className="marquee__group">{row}</div>
      </div>
    </div>
  )
}

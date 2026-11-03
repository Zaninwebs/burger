import { useEffect, useRef } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Globale Effekte: goldener Scroll-Fortschritt am oberen Rand,
 * weicher Lichtkegel unter der Maus und 3D-Neigung für [data-tilt].
 */
export function Ambient() {
  const bar = useRef<HTMLDivElement>(null)
  const light = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const b = bar.current
    if (!b) return
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - innerHeight
      b.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const l = light.current
    if (!l || !isFinePointer() || prefersReducedMotion()) return
    l.style.display = 'block'
    const xTo = gsap.quickTo(l, 'x', { duration: 0.9, ease: 'power3.out' })
    const yTo = gsap.quickTo(l, 'y', { duration: 0.9, ease: 'power3.out' })

    let tilted: HTMLElement | null = null
    const reset = (el: HTMLElement) =>
      gsap.to(el, { rotationX: 0, rotationY: 0, scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.5)' })

    const move = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tilt]')
      if (tilted && tilted !== target) reset(tilted)
      tilted = target
      if (target) {
        const r = target.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        gsap.to(target, {
          rotationY: nx * 10,
          rotationX: -ny * 10,
          scale: 1.02,
          transformPerspective: 900,
          duration: 0.6,
          ease: 'power3.out',
        })
      }
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div ref={bar} />
      </div>
      <div ref={light} className="spotlight" aria-hidden="true" style={{ display: 'none' }} />
    </>
  )
}

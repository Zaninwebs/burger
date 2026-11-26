import { useEffect, useRef } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Dezenter Custom Cursor (nur Maus/Trackpad). Über Links wird er größer,
 * Elemente mit data-cursor="Ansehen" o. ä. zeigen ein Label.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    document.documentElement.classList.add('has-custom-cursor')
    el.style.display = 'block'
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' })

    const move = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button, [role="button"], label, select')
      const text = target?.dataset.cursor
      el.classList.toggle('has-label', !!text)
      el.classList.toggle('is-link', !!target && !text)
      if (label.current) label.current.textContent = text ?? ''
      const field = (e.target as HTMLElement).closest('input, textarea')
      el.classList.toggle('is-hidden', !!field)
    }
    const leave = () => el.classList.add('is-hidden')
    const enter = () => el.classList.remove('is-hidden')
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <div ref={ref} className="cursor" style={{ display: 'none' }} aria-hidden="true">
      <div className="cursor__dot">
        <span ref={label} className="cursor__label" />
      </div>
    </div>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { images, type ImageId } from '../data/images.generated'
import { gsap, lockScroll, prefersReducedMotion } from '../lib/motion'
import { Img } from './Img'

interface Props {
  items: ImageId[]
  index: number
  /** Position des angeklickten Vorschaubilds – Startpunkt der Animation. */
  from: DOMRect
  onClose: () => void
}

/** Kinoreife Lightbox: Bild wächst aus dem Vorschaubild, dunkler Hintergrund. */
export function Lightbox({ items, index: startIndex, from, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const lastFocus = useRef<Element | null>(document.activeElement)
  const reduce = prefersReducedMotion()
  const id = items[index]
  const img = images[id]

  // Öffnen: FLIP vom Vorschaubild zur Vollansicht
  useLayoutEffect(() => {
    lockScroll(true)
    const el = frame.current
    if (!el || reduce) return
    const to = el.getBoundingClientRect()
    gsap.fromTo(root.current, { backgroundColor: 'rgba(12,10,8,0)' }, { backgroundColor: 'rgba(12,10,8,0.96)', duration: 0.8, ease: 'power2.out' })
    gsap.fromTo(
      el,
      {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
        transformOrigin: '0 0',
      },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.1, ease: 'expo.inOut' },
    )
    gsap.fromTo('.lightbox__ui', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, delay: 0.7 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true })
    return () => {
      lockScroll(false)
      ;(lastFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true })
    }
  }, [])

  const close = () => {
    if (closing.current) return
    closing.current = true
    if (reduce) return onClose()
    gsap.to(frame.current, { autoAlpha: 0, scale: 0.94, duration: 0.5, ease: 'power3.in' })
    gsap.to(root.current, { backgroundColor: 'rgba(12,10,8,0)', duration: 0.6, delay: 0.15, onComplete: onClose })
    gsap.to('.lightbox__ui', { autoAlpha: 0, duration: 0.3 })
  }

  const go = (dir: 1 | -1) => {
    const next = (index + dir + items.length) % items.length
    if (reduce) return setIndex(next)
    gsap.to(frame.current, {
      xPercent: -dir * 6,
      autoAlpha: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        setIndex(next)
        gsap.fromTo(frame.current, { xPercent: dir * 6, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out' })
      },
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Tab') {
        // Fokus im Dialog halten
        const f = root.current?.querySelectorAll<HTMLElement>('button')
        if (!f?.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  // Wischen auf Touch-Geräten
  const touch = useRef<{ x: number; y: number } | null>(null)

  return createPortal(
    <div
      ref={root}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Galerie: ${img.alt}`}
      onClick={(e) => e.target === e.currentTarget && close()}
      onPointerDown={(e) => (touch.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const t = touch.current
        touch.current = null
        if (!t || e.pointerType === 'mouse') return
        const dx = e.clientX - t.x
        const dy = e.clientY - t.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
        else if (dy > 90) close()
      }}
    >
      <div
        ref={frame}
        className="lightbox__frame"
        style={{ aspectRatio: `${img.width} / ${img.height}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <Img key={id} id={id} priority sizes="(min-width: 900px) 60vw, 100vw" />
      </div>

      <div className="lightbox__ui">
        <p className="lightbox__caption">
          <span className="num">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          {img.alt}
        </p>
        <button type="button" className="lightbox__btn lightbox__prev" onClick={() => go(-1)} aria-label="Vorheriges Bild">
          ←
        </button>
        <button type="button" className="lightbox__btn lightbox__next" onClick={() => go(1)} aria-label="Nächstes Bild">
          →
        </button>
        <button ref={closeBtn} type="button" className="lightbox__close" onClick={close} aria-label="Schließen (Esc)">
          <span />
          <span />
        </button>
      </div>
    </div>,
    document.body,
  )
}

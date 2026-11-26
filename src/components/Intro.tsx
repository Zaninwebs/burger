import { useEffect, useLayoutEffect, useRef } from 'react'
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from '../data/monogram'
import { gsap, lockScroll, prefersReducedMotion } from '../lib/motion'

const SUBPATHS = MONOGRAM_PATH.split(/(?=M)/).filter(Boolean)
const WORD = 'ART OF HAIR'
const [VB_X, VB_Y, VB_W, VB_H] = MONOGRAM_VIEWBOX.split(' ').map(Number)

/** Kommt der Besucher von einer anderen Seite dieser Website? Dann kurzes Intro. */
function isReturningVisit() {
  try {
    return document.referrer !== '' && new URL(document.referrer).origin === location.origin
  } catch {
    return false
  }
}

interface Props {
  /** Wird aufgerufen, sobald sich der Vorhang öffnet (Hero startet). */
  onReveal: () => void
  /** Intro vollständig entfernt. */
  onDone: () => void
}

/**
 * Intro: Das AH-Monogramm zeichnet sich in Gold, füllt sich wie flüssiges
 * Metall, ein Lichtreflex gleitet darüber, der Schriftzug steigt auf –
 * dann öffnet sich der Vorhang nach oben zur Website.
 */
export function Intro({ onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReducedMotion()) {
      onReveal()
      onDone()
      return
    }
    lockScroll(true)
    window.scrollTo(0, 0)
    const short = isReturningVisit()
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      onReveal()
    }

    const ctx = gsap.context(() => {
      const strokes = gsap.utils.toArray<SVGPathElement>('.intro__stroke')
      strokes.forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
      })

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          lockScroll(false)
          onDone()
        },
      })
      tlRef.current = tl

      if (short) {
        tl.set(strokes, { strokeDashoffset: 0, opacity: 0 })
          .set('.intro__fill-rect', { attr: { y: VB_Y, height: VB_H } })
          .from('.intro__mono', { autoAlpha: 0, scale: 0.94, duration: 0.7 })
          .from('.intro__letter', { yPercent: 110, duration: 0.7, stagger: 0.02 }, 0)
          .set('.intro__by-line', { scaleX: 1 }, 0)
          .from('.intro__by', { autoAlpha: 0, duration: 0.6 }, 0.1)
          .add(reveal, 0.55)
          .to(stage.current, { yPercent: -18, autoAlpha: 0, duration: 0.8, ease: 'expo.in' }, 0.5)
          .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.0, ease: 'expo.inOut' }, 0.6)
        return
      }

      tl.from('.intro__glow', { autoAlpha: 0, scale: 0.6, duration: 2.4, ease: 'power2.out' }, 0)
        // 1 — Konturen zeichnen sich
        .to(strokes, { strokeDashoffset: 0, duration: 1.25, ease: 'power2.inOut', stagger: 0.04 }, 0.1)
        // 2 — Gold steigt von unten auf
        .to('.intro__fill-rect', { attr: { y: VB_Y, height: VB_H }, duration: 1.0, ease: 'expo.inOut' }, 0.85)
        .to(strokes, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 1.45)
        .fromTo('.intro__mono', { scale: 1.06 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0)
        // 3 — Schriftzug
        .from('.intro__letter', { yPercent: 115, duration: 1.1, stagger: 0.035 }, 1.0)
        .fromTo('.intro__word', { letterSpacing: '0.62em' }, { letterSpacing: '0.34em', duration: 1.8, ease: 'expo.out' }, 1.0)
        .to('.intro__by-line', { scaleX: 1, duration: 1.0, ease: 'expo.inOut' }, 1.35)
        .from('.intro__by-text', { autoAlpha: 0, y: 8, duration: 0.8 }, 1.55)
        // 4 — Lichtreflex
        .fromTo(
          '.intro__sheen',
          { attr: { x: VB_X - 520 } },
          { attr: { x: VB_X + VB_W + 120 }, duration: 1.1, ease: 'power2.inOut' },
          1.55,
        )
        // 5 — Vorhang öffnet sich
        .add(reveal, 2.55)
        .to(stage.current, { yPercent: -22, autoAlpha: 0, duration: 0.9, ease: 'expo.in' }, 2.4)
        .to('.intro__glow', { autoAlpha: 0, duration: 0.8 }, 2.5)
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, 2.55)
    }, el)

    return () => {
      ctx.revert()
      lockScroll(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Leichte 3D-Neigung und wanderndes Licht mit der Maus
  useEffect(() => {
    const el = root.current
    const st = stage.current
    if (!el || !st || prefersReducedMotion()) return
    const rx = gsap.quickTo(st, 'rotationX', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(st, 'rotationY', { duration: 1.2, ease: 'power3.out' })
    const gx = gsap.quickTo('.intro__glow', 'x', { duration: 1.6, ease: 'power3.out' })
    const gy = gsap.quickTo('.intro__glow', 'y', { duration: 1.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      ry(nx * 14)
      rx(-ny * 10)
      gx(nx * innerWidth * 0.25)
      gy(ny * innerHeight * 0.25)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  const skip = () => {
    const tl = tlRef.current
    if (tl && tl.progress() < 0.8) tl.seek(2.4)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={root} className="intro grain" onClick={skip} aria-hidden="true">
      <div className="intro__glow" />
      <div ref={stage} className="intro__stage">
        <svg className="intro__mono" viewBox={MONOGRAM_VIEWBOX}>
          <defs>
            <linearGradient id="intro-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7d5c30" />
              <stop offset="0.3" stopColor="#c9a364" />
              <stop offset="0.52" stopColor="#f1ddb0" />
              <stop offset="0.7" stopColor="#b48e57" />
              <stop offset="1" stopColor="#6e5028" />
            </linearGradient>
            <linearGradient id="intro-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff8e6" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="intro-fill-mask" maskUnits="userSpaceOnUse" x={VB_X} y={VB_Y} width={VB_W} height={VB_H}>
              <rect className="intro__fill-rect" x={VB_X} y={VB_Y + VB_H} width={VB_W} height={0} fill="#fff" />
            </mask>
            <clipPath id="intro-clip">
              <path d={MONOGRAM_PATH} clipRule="evenodd" />
            </clipPath>
          </defs>
          {SUBPATHS.map((d, i) => (
            <path key={i} className="intro__stroke" d={d} fill="none" stroke="url(#intro-gold)" strokeWidth={3} />
          ))}
          <path d={MONOGRAM_PATH} fill="url(#intro-gold)" fillRule="evenodd" mask="url(#intro-fill-mask)" />
          <g clipPath="url(#intro-clip)">
            <rect
              className="intro__sheen"
              x={VB_X - 520}
              y={VB_Y - 100}
              width={320}
              height={VB_H + 200}
              fill="url(#intro-sheen)"
              transform={`skewX(-20)`}
              style={{ mixBlendMode: 'overlay' }}
            />
          </g>
        </svg>
        <div className="intro__word">
          {WORD.split('').map((ch, i) => (
            <span key={i} className="intro__letter-mask">
              <span className="intro__letter">{ch === ' ' ? ' ' : ch}</span>
            </span>
          ))}
        </div>
        <div className="intro__by">
          <i className="intro__by-line" />
          <span className="intro__by-text">By Simyan</span>
          <i className="intro__by-line" />
        </div>
      </div>
      <button type="button" className="intro__skip" onClick={skip} tabIndex={-1}>
        Überspringen
      </button>
    </div>
  )
}

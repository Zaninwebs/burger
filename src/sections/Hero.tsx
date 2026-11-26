import { useEffect, useLayoutEffect, useRef } from 'react'
import { Button } from '../components/Button'
import { GoldDust } from '../components/GoldDust'
import { business } from '../data/content'
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from '../data/monogram'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Startbereich: das Salon-Logo als Vektorgrafik in Gold auf dunklem
 * Naturstein. Alles wird vom Browser gezeichnet und ist deshalb auf jedem
 * Bildschirm gestochen scharf – vom Handy bis zum 5K-Monitor.
 */
export function Hero({ start }: { start: boolean }) {
  const root = useRef<HTMLElement>(null)

  // Ausgangszustand vor dem ersten Paint setzen
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.set('.hero__spot', { autoAlpha: 0, scale: 0.7 })
      gsap.set('.hero__mono', { autoAlpha: 0, scale: 0.86, y: 30, filter: 'blur(14px)' })
      gsap.set('.hero__word', { clipPath: 'inset(0% 50% 0% 50%)', letterSpacing: '0.32em' })
      gsap.set('.hero__byline span', { autoAlpha: 0, y: 12 })
      gsap.set('.hero__byline i', { scaleX: 0 })
      gsap.set('.hero__fade', { autoAlpha: 0, y: 24 })
      gsap.set('.hero__rule', { scaleX: 0 })
    }, root)
    return () => ctx.revert()
  }, [])

  // Auftritt, sobald sich der Intro-Vorhang öffnet
  useEffect(() => {
    if (!start || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.to('.hero__spot', { autoAlpha: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
        .to('.hero__mono', { autoAlpha: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 2, clearProps: 'filter' }, 0.2)
        .to('.hero__word', { clipPath: 'inset(0% 0% 0% 0%)', letterSpacing: '0.075em', duration: 2.2, ease: 'expo.inOut', clearProps: 'clipPath,letterSpacing' }, 0.7)
        .to('.hero__byline i', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 1.4)
        .to('.hero__byline span', { autoAlpha: 1, y: 0, duration: 1.2 }, 1.6)
        .add(() => root.current?.classList.add('is-shining'), 2.2)
        .to('.hero__rule', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 1.6)
        .to('.hero__fade', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 1.8)

      // Scroll: Logo schwebt langsam weg, Licht verblasst
      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('.hero__logo', { yPercent: 28, scale: 0.92, autoAlpha: 0, ease: 'none', scrollTrigger: st })
      gsap.to('.hero__stone', { yPercent: 10, ease: 'none', scrollTrigger: st })
      gsap.to('.hero__bottom', { autoAlpha: 0, ease: 'none', scrollTrigger: { ...st, end: '60% top' } })
    }, root)
    return () => ctx.revert()
  }, [start])

  // Maus: Logo neigt sich leicht, das Licht folgt (Desktop)
  useEffect(() => {
    const el = root.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    const logo = el.querySelector('.hero__logo-tilt')
    const spot = el.querySelector('.hero__spot')
    if (!logo || !spot) return
    gsap.set(logo, { transformPerspective: 1200 })
    const rx = gsap.quickTo(logo, 'rotationX', { duration: 1.6, ease: 'power3.out' })
    const ry = gsap.quickTo(logo, 'rotationY', { duration: 1.6, ease: 'power3.out' })
    const sx = gsap.quickTo(spot, 'x', { duration: 2.2, ease: 'power3.out' })
    const sy = gsap.quickTo(spot, 'y', { duration: 2.2, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      ry(nx * 8)
      rx(ny * -6)
      sx(nx * 120)
      sy(ny * 80)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  return (
    <section ref={root} id="top" className="hero hero--logo-vector" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__stone" />
        <div className="hero__spot" />
        <div className="hero__vignette" />
      </div>
      <GoldDust />

      <div className="hero__content wrap">
        <p className="hero__kicker hero__fade">
          Friseurmeister-Salon <span aria-hidden="true">·</span> Leverkusen-{business.district}
        </p>

        <h1 id="hero-title" className="hero__logo" aria-label="Art of Hair by Simyan">
          <span className="hero__logo-tilt" aria-hidden="true">
            <svg className="hero__mono" viewBox={MONOGRAM_VIEWBOX} focusable="false">
              <defs>
                {/* Gebürstetes Gold: helle Kanten, dunkleres Band in der Mitte */}
                <linearGradient id="heroGold" x1="0" y1="0" x2="0.35" y2="1">
                  <stop offset="0" stopColor="#fff1c9" />
                  <stop offset="0.18" stopColor="#e9c77f" />
                  <stop offset="0.42" stopColor="#a9782f" />
                  <stop offset="0.55" stopColor="#d6ad62" />
                  <stop offset="0.72" stopColor="#f6dfa3" />
                  <stop offset="1" stopColor="#8d6024" />
                </linearGradient>
                <linearGradient id="heroShine" x1="0" y1="0" x2="1" y2="0.25" gradientTransform="translate(-1 0)">
                  <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
                  <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-1 0; 1 0; 1 0"
                    keyTimes="0; 0.45; 1"
                    dur="7s"
                    begin="3s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <path d={MONOGRAM_PATH} fill="url(#heroGold)" fillRule="evenodd" />
              <path className="hero__mono-shine" d={MONOGRAM_PATH} fill="url(#heroShine)" fillRule="evenodd" />
            </svg>
            <span className="hero__word">Art of Hair</span>
            <span className="hero__byline">
              <i />
              <span>By Simyan</span>
              <i />
            </span>
          </span>
        </h1>

        <div className="hero__bottom">
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__intro hero__fade">
            Schnitt, Farbe und Styling für Damen, Herren und Kinder – mit Ruhe, Präzision und einem
            Auge für das, was wirklich zu Ihnen passt.
          </p>
          <div className="hero__actions hero__fade">
            <Button href="#termin" cursor="Buchen">
              Termin anfragen
            </Button>
            <Button href="#salon" variant="ghost" arrow={false}>
              Entdecke unseren Salon
            </Button>
          </div>
          <a href="#salon" className="hero__scroll hero__fade" aria-label="Weiter nach unten scrollen">
            <span>Scroll</span>
            <i />
          </a>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useLayoutEffect, useRef } from 'react'
import { Button } from '../components/Button'
import { GoldDust } from '../components/GoldDust'
import { Img } from '../components/Img'
import { business } from '../data/content'
import { asset } from '../lib/site'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/**
 * Startbereich: das goldene Logo als hochauflösender Vollbild-Hintergrund.
 * Eine unscharfe Kopie füllt jedes Bildschirmformat, darüber liegt das
 * scharfe Bild mit weich auslaufenden Rändern und einem Lichtschimmer,
 * der nur über die goldenen Buchstaben wandert.
 */
export function Hero({ start }: { start: boolean }) {
  const root = useRef<HTMLElement>(null)

  // Ausgangszustand vor dem ersten Paint setzen
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.set('.hero__bg-main', { scale: 1.28, autoAlpha: 0, filter: 'blur(16px) brightness(0.4)' })
      gsap.set('.hero__bg-fill', { autoAlpha: 0 })
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
      tl.to('.hero__bg-fill', { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0)
        .to('.hero__bg-main', { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 0.1)
        .to('.hero__bg-main', { scale: 1, filter: 'blur(0px) brightness(1)', duration: 3.2 }, 0.1)
        .add(() => root.current?.classList.add('is-shining'), 1.6)
        .to('.hero__rule', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 1.1)
        .to('.hero__fade', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 1.3)

      // Scroll: Hintergrund wandert langsam und zoomt leicht, Inhalt blendet aus
      gsap.to('.hero__bg-move', {
        yPercent: 14,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__content', {
        yPercent: -10,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [start])

  // Maus-Parallax auf dem Logo (Desktop)
  useEffect(() => {
    const el = root.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    const main = el.querySelector('.hero__bg-tilt')
    if (!main) return
    const xTo = gsap.quickTo(main, 'x', { duration: 1.8, ease: 'power3.out' })
    const yTo = gsap.quickTo(main, 'y', { duration: 1.8, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      xTo((e.clientX / innerWidth - 0.5) * -26)
      yTo((e.clientY / innerHeight - 0.5) * -18)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  return (
    <section
      ref={root}
      id="top"
      className="hero hero--cinema"
      aria-labelledby="hero-title"
      style={{ ['--hero-mask' as string]: `url(${asset('img/hero-logo-1200.webp')})` }}
    >
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__bg-move">
          <div className="hero__bg-fill">
            <Img id="hero-logo" sizes="50vw" priority alt="" />
          </div>
          <div className="hero__bg-tilt">
            <div className="hero__bg-main">
              <Img id="hero-logo" priority sizes="(orientation: portrait) 148vw, max(100vw, 151svh)" alt="" />
              <span className="hero__shine" />
            </div>
          </div>
        </div>
        <div className="hero__vignette" />
      </div>
      <GoldDust />

      <div className="hero__content wrap">
        <p className="hero__kicker hero__fade">
          Friseurmeister-Salon <span aria-hidden="true">·</span> Leverkusen-{business.district}
        </p>

        <h1 id="hero-title" className="sr-only">
          Art of Hair by Simyan – Friseur in Leverkusen-{business.district}
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

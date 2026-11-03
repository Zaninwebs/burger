import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { GoldDust } from '../components/GoldDust'
import { Img } from '../components/Img'
import { business } from '../data/content'
import type { ImageId } from '../data/images.generated'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/motion'

/** Zerlegt ein Wort in einzeln animierbare Buchstaben. */
const Chars = ({ text }: { text: string }) => (
  <span aria-hidden="true">
    {text.split('').map((c, i) => (
      <span key={i} className="hero__char">
        {c === ' ' ? '\u00a0' : c}
      </span>
    ))}
  </span>
)

// Reihenfolge wie vom Inhaber gewünscht: Föhnen, Porträt, Bart, Logo
const SLIDES: ImageId[] = ['simyan-foehnen', 'simyan-portrait', 'simyan-bart', 'logo-gold']
/** Querformat-Bilder werden vollständig gezeigt statt beschnitten. */
const CONTAIN: ImageId[] = ['logo-gold']

export function Hero({ start }: { start: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [slide, setSlide] = useState(0)
  // Folgebilder erst laden, kurz bevor sie gebraucht werden (spart mobile Daten)
  const [reached, setReached] = useState(0)
  useEffect(() => setReached((r) => Math.max(r, slide + 1)), [slide])

  // Ausgangszustand vor dem ersten Paint setzen
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.set('.hero__char', { yPercent: 120, rotation: 8 })
      gsap.set('.hero__by', { yPercent: 120 })
      gsap.set('.hero__media', { clipPath: 'inset(18% 12% 18% 12%)' })
      gsap.set('.hero__media-inner', { scale: 1.35 })
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
      tl.to('.hero__media', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0)
        .to('.hero__media-inner', { scale: 1, duration: 2.6 }, 0.2)
        .to('.hero__char', { yPercent: 0, rotation: 0, duration: 1.4, stagger: 0.045 }, 0.35)
        .to('.hero__by', { yPercent: 0, duration: 1.4 }, 0.8)
        .to('.hero__rule', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 0.6)
        .to('.hero__fade', { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.9)

      // Scroll: Bild wandert und zoomt leicht, Headline driftet
      gsap.to('.hero__media-inner', {
        yPercent: 12,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__title', {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [start])

  // Langsamer Bildwechsel (Crossfade + Ken-Burns)
  useEffect(() => {
    if (!start || prefersReducedMotion()) return
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [start])

  // Maus-Parallax auf dem Bild (Desktop)
  useEffect(() => {
    const el = root.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    const media = el.querySelector('.hero__media-move')
    if (!media) return
    const xTo = gsap.quickTo(media, 'x', { duration: 1.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(media, 'y', { duration: 1.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      xTo((e.clientX / innerWidth - 0.5) * -24)
      yTo((e.clientY / innerHeight - 0.5) * -18)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])

  return (
    <section
      ref={root}
      id="top"
      className={`hero ${CONTAIN.includes(SLIDES[slide]) ? 'hero--logo' : ''}`}
      aria-labelledby="hero-title"
    >
      <GoldDust />
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid wrap">
        <p className="hero__kicker hero__fade">
          Friseurmeister-Salon <span aria-hidden="true">·</span> Leverkusen-{business.district}
        </p>

        <h1 id="hero-title" className="hero__title display" aria-label="Art of Hair by Simyan">
          <span className="hero__line">
            <Chars text="Art of" />
          </span>
          <span className="hero__line hero__line--indent">
            <Chars text="Hair" />
          </span>
          <span className="hero__line hero__line--by">
            <span aria-hidden="true" className="hero__by">
              <em>by Simyan</em>
            </span>
          </span>
        </h1>

        <div className="hero__media" aria-hidden="false">
          <div className="hero__media-move">
            <div className="hero__media-inner">
              {SLIDES.map((id, i) => (
                <div key={id} className={`hero__slide ${i === slide ? 'is-active' : ''} ${CONTAIN.includes(id) ? 'hero__slide--contain' : ''}`} aria-hidden={i !== slide}>
                  {i <= reached && <Img id={id} priority={i === 0} sizes="(min-width: 900px) 42vw, 100vw" />}
                </div>
              ))}
            </div>
          </div>
          <div className="hero__counter hero__fade" aria-hidden="true">
            <span>0{slide + 1}</span>
            <i>
              <b key={slide} />
            </i>
            <span>0{SLIDES.length}</span>
          </div>
        </div>

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

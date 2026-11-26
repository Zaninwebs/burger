import { useLayoutEffect, useRef, useState } from 'react'
import { Img } from '../components/Img'
import { Lightbox } from '../components/Lightbox'
import { gallery } from '../data/content'
import { images } from '../data/images.generated'
import { gsap, prefersReducedMotion } from '../lib/motion'

const COLS = 3

/** Asymmetrische Galerie – Spalten bewegen sich unterschiedlich schnell. */
export function Gallery() {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<{ index: number; from: DOMRect } | null>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 700px)', () => {
      const speeds = [-6, 10, -2]
      gsap.utils.toArray<HTMLElement>('.gallery__col').forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: -speeds[i] },
          {
            yPercent: speeds[i],
            ease: 'none',
            scrollTrigger: { trigger: '.gallery__grid', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    })
    return () => mm.revert()
  }, [])

  const columns = Array.from({ length: COLS }, (_, c) => gallery.map((id, i) => ({ id, i })).filter((x) => x.i % COLS === c))

  return (
    <section ref={root} id="galerie" className="gallery section" aria-labelledby="gallery-title">
      <div className="wrap gallery__head">
        <p className="eyebrow">Galerie</p>
        <h2 id="gallery-title" className="h-xl" data-reveal="text">
          Arbeiten, <em>die für sich sprechen.</em>
        </h2>
      </div>

      <div className="wrap gallery__grid">
        {columns.map((col, c) => (
          <div key={c} className="gallery__col">
            {col.map(({ id, i }) => (
              <button
                key={id}
                type="button"
                className="gallery__item"
                data-tilt
                data-cursor="Ansehen"
                aria-label={`Bild vergrößern: ${images[id].alt}`}
                onClick={(e) => setOpen({ index: i, from: e.currentTarget.getBoundingClientRect() })}
              >
                <Img id={id} reveal sizes="(min-width: 700px) 30vw, 48vw" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="wrap gallery__foot" data-reveal="fade">
        <a href="https://www.instagram.com/artofhair_bysimyan/" target="_blank" rel="noopener noreferrer" className="link-u">
          Mehr auf Instagram @artofhair_bysimyan
        </a>
      </div>

      {open && <Lightbox items={gallery} index={open.index} from={open.from} onClose={() => setOpen(null)} />}
    </section>
  )
}

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../components/Button'
import { priceCategories } from '../data/content'
import { gsap, prefersReducedMotion } from '../lib/motion'

/** Preisliste mit Kategorie-Tabs (Desktop) bzw. Akkordeon-artigem Wechsel. */
export function Prices() {
  const [active, setActive] = useState(0)
  const tabs = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    const list = tabs.current
    const ind = indicator.current
    const btn = list?.querySelectorAll<HTMLElement>('[role="tab"]')[active]
    if (!btn || !ind) return
    const reduce = prefersReducedMotion()
    gsap.to(ind, { x: btn.offsetLeft, width: btn.offsetWidth, duration: reduce || first.current ? 0 : 0.8, ease: 'expo.out' })
    // Aktiven Tab auf Mobile in Sicht scrollen
    list?.scrollTo({ left: btn.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' })
    if (!first.current && !reduce && panel.current) {
      gsap.fromTo(
        panel.current.querySelectorAll('.price-row, .prices__intro'),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out' },
      )
    }
    first.current = false
  }, [active])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + priceCategories.length) % priceCategories.length
      setActive(next)
      tabs.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
    }
  }

  const cat = priceCategories[active]

  return (
    <section id="preise" className="prices section" aria-labelledby="prices-title">
      <div className="wrap prices__layout">
        <div className="prices__head">
          <p className="eyebrow">Preise</p>
          <h2 id="prices-title" className="h-xl" data-reveal="text">
            Klar. <em>Transparent.</em>
          </h2>
          <p className="lead" data-reveal="fade">
            Preise in Euro. Bei „ab“-Preisen richtet sich der Endpreis nach Haarlänge und Aufwand – wir besprechen
            ihn vorab mit Ihnen.
          </p>
          <div data-reveal="fade">
            <Button href="#termin" cursor="Buchen">
              Termin anfragen
            </Button>
          </div>
        </div>

        <div className="prices__body">
          <div ref={tabs} className="prices__tabs" role="tablist" aria-label="Preiskategorien" onKeyDown={onKey}>
            {priceCategories.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={i === active}
                aria-controls={`panel-${c.id}`}
                tabIndex={i === active ? 0 : -1}
                className={i === active ? 'is-active' : ''}
                onClick={() => setActive(i)}
              >
                {c.title}
              </button>
            ))}
            <span ref={indicator} className="prices__indicator" aria-hidden="true" />
          </div>

          <div
            ref={panel}
            id={`panel-${cat.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${cat.id}`}
            className="prices__panel"
            tabIndex={0}
          >
            {cat.intro && <p className="prices__intro">{cat.intro}</p>}
            {cat.rows.map((row) => (
              <div key={row.name} className="price-row">
                <div className="price-row__name">
                  <h3>{row.name}</h3>
                  {row.note && <p>{row.note}</p>}
                </div>
                <dl className="price-row__values">
                  {row.prices.map((p, i) => (
                    <div key={i}>
                      {p.label && <dt>{p.label}</dt>}
                      {!p.label && <dt className="sr-only">Preis</dt>}
                      <dd>{p.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

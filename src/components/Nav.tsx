import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { business, hours, nav } from '../data/content'
import { gsap, lockScroll, prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { siteUrl } from '../lib/site'
import { Arrow } from './Arrow'
import { Magnetic } from './Magnetic'
import { Monogram } from './Monogram'

interface Props {
  /** Auf Unterseiten (Impressum etc.) führen Links zur Startseite. */
  home?: boolean
}

export function Nav({ home = true }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [dark, setDark] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Hintergrund beim Scrollen, beim Runterscrollen ausblenden
  useEffect(() => {
    let last = scrollY
    const onScroll = () => {
      const y = scrollY
      setScrolled(y > 40)
      setHidden(y > last && y > innerHeight * 0.9)
      last = y
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Über dunklen Sektionen wechselt die Navigation auf helle Schrift
  useEffect(() => {
    const darkSections = Array.from(document.querySelectorAll<HTMLElement>('main .on-dark, footer.on-dark'))
    const visible = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
        setDark(visible.size > 0)
      },
      { rootMargin: `0px 0px -${Math.max(innerHeight - 40, 0)}px 0px` },
    )
    darkSections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // Aktive Sektion ermitteln
  useEffect(() => {
    if (!home) return
    const sections = nav.map((n) => document.getElementById(n.id)).filter((s): s is HTMLElement => !!s)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [home])

  // Gleitender Indikator unter dem aktiven Link
  useEffect(() => {
    const list = listRef.current
    const ind = indicator.current
    if (!list || !ind) return
    const link = active ? list.querySelector<HTMLElement>(`[data-id="${active}"]`) : null
    if (!link) {
      gsap.to(ind, { autoAlpha: 0, duration: 0.3 })
      return
    }
    gsap.to(ind, {
      x: link.offsetLeft,
      width: link.offsetWidth,
      autoAlpha: 1,
      duration: 0.8,
      ease: 'expo.out',
    })
  }, [active])

  // Vollbild-Menü (Mobile)
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    lockScroll(open)
    const reduce = prefersReducedMotion()
    if (open) {
      gsap.set(menu, { visibility: 'visible' })
      gsap.fromTo(
        menu,
        { clipPath: 'circle(0% at calc(100% - 44px) 38px)' },
        { clipPath: 'circle(150% at calc(100% - 44px) 38px)', duration: reduce ? 0 : 1.1, ease: 'expo.inOut' },
      )
      gsap.fromTo(
        menu.querySelectorAll('.menu__item > *'),
        { yPercent: 110 },
        { yPercent: 0, duration: reduce ? 0 : 1, stagger: 0.05, delay: reduce ? 0 : 0.35, ease: 'expo.out' },
      )
      gsap.fromTo(menu.querySelectorAll('.menu__meta'), { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.7, duration: 0.8 })
      menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
      addEventListener('keydown', onKey)
      return () => removeEventListener('keydown', onKey)
    } else if (menu.style.visibility === 'visible') {
      gsap.to(menu, {
        clipPath: 'circle(0% at calc(100% - 44px) 38px)',
        duration: reduce ? 0 : 0.8,
        ease: 'expo.inOut',
        onComplete: () => {
          gsap.set(menu, { visibility: 'hidden' })
        },
      })
      toggleRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  const go = (e: MouseEvent, id: string) => {
    if (!home) return
    e.preventDefault()
    setOpen(false)
    setTimeout(() => scrollToTarget(`#${id}`), open ? 500 : 0)
    history.replaceState(null, '', `#${id}`)
  }

  const href = (id: string) => (home ? `#${id}` : siteUrl(`/#${id}`))
  const today = new Date().getDay()
  const todayHours = hours.find((h) => h.weekday === today)

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${dark ? 'is-dark' : ''} ${hidden && !open ? 'is-hidden' : ''} ${open ? 'is-open' : ''}`}>
        <div className="nav__inner">
          <a href={home ? '#top' : siteUrl('/')} className="nav__brand" onClick={(e) => go(e, 'top')} aria-label="Art of Hair by Simyan – zur Startseite">
            <Monogram className="nav__mono" />
            <span className="nav__word">
              <span>Art of Hair</span>
              <small>by Simyan</small>
            </span>
          </a>

          <nav aria-label="Hauptnavigation" className="nav__links">
            <ul ref={listRef}>
              {nav.map((n) => (
                <li key={n.id}>
                  <a
                    href={href(n.id)}
                    data-id={n.id}
                    onClick={(e) => go(e, n.id)}
                    aria-current={active === n.id ? 'true' : undefined}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <span ref={indicator} className="nav__indicator" aria-hidden="true" />
            </ul>
          </nav>

          <div className="nav__cta">
            <Magnetic>
              <a href={href('termin')} className="btn btn--small" onClick={(e) => go(e, 'termin')} data-cursor="Buchen">
                <span>Termin anfragen</span>
                <span className="btn-arrow">
                  <Arrow />
                </span>
              </a>
            </Magnetic>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="menu" ref={menuRef} className="menu grain" style={{ visibility: 'hidden' }} aria-hidden={!open}>
        <div className="menu__inner">
          <ul>
            {nav.map((n, i) => (
              <li key={n.id} className="menu__item">
                <a href={href(n.id)} onClick={(e) => go(e, n.id)} tabIndex={open ? 0 : -1}>
                  <span className="num">0{i + 1}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="menu__meta">
            <a href={business.phoneHref} tabIndex={open ? 0 : -1}>
              {business.phoneDisplay}
            </a>
            <span>
              Heute: {todayHours?.value}
            </span>
            <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

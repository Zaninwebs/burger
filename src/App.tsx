import { useCallback, useEffect, useRef, useState } from 'react'
import { Ambient } from './components/Ambient'
import { Cursor } from './components/Cursor'
import { Footer } from './components/Footer'
import { Intro } from './components/Intro'
import { Marquee } from './components/Marquee'
import { MobileCta } from './components/MobileCta'
import { Nav } from './components/Nav'
import { initSmoothScroll, ScrollTrigger } from './lib/motion'
import { useScrollAnimations } from './lib/useScrollAnimations'
import { Booking } from './sections/Booking'
import { Color } from './sections/Color'
import { Gallery } from './sections/Gallery'
import { Hero } from './sections/Hero'
import { Instagram } from './sections/Instagram'
import { MapRoute } from './sections/MapRoute'
import { KevinMurphy } from './sections/KevinMurphy'
import { Prices } from './sections/Prices'
import { Salon } from './sections/Salon'
import { Services } from './sections/Services'
import { Team } from './sections/Team'
import { Visit } from './sections/Visit'

export function App() {
  const main = useRef<HTMLElement>(null)
  const [heroStart, setHeroStart] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  useScrollAnimations(main)

  useEffect(() => {
    initSmoothScroll()
  }, [])

  // Nach dem Intro: Positionen neu berechnen und ggf. zum Anker springen
  useEffect(() => {
    if (!introDone) return
    ScrollTrigger.refresh()
    if (location.hash.length > 1) {
      document.querySelector(location.hash)?.scrollIntoView()
    }
  }, [introDone])

  const onReveal = useCallback(() => setHeroStart(true), [])
  const onDone = useCallback(() => setIntroDone(true), [])

  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      {!introDone && <Intro onReveal={onReveal} onDone={onDone} />}
      <Cursor />
      <Ambient />
      <Nav />
      <main id="main" ref={main}>
        <Hero start={heroStart} />
        <Salon />
        <Marquee items={['Schnitt', 'Coloration', 'Balayage', 'Strähnen', 'Styling', 'Brautfrisuren', 'Bart', 'Kevin.Murphy']} />
        <Services />
        <Color />
        <Gallery />
        <KevinMurphy />
        <Team />
        <Prices />
        <Booking />
        <Marquee items={['Leverkusen', 'Lützenkirchen', 'Di – Fr 9 – 18', 'Sa 9 – 14', 'Art of Hair']} direction={-1} />
        <Visit />
        <Instagram />
        <MapRoute />
      </main>
      <Footer />
      <MobileCta />
    </>
  )
}

import { useEffect, useState } from 'react'
import { business } from '../data/content'
import { scrollToTarget } from '../lib/motion'

/** Sticky-CTA am unteren Rand (nur Mobile), verschwindet im Terminbereich. */
export function MobileCta() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const booking = document.getElementById('termin')
    let inBooking = false
    const update = () => setShow(scrollY > innerHeight * 0.8 && !inBooking)
    const io = new IntersectionObserver(([e]) => {
      inBooking = e.isIntersecting
      update()
    })
    if (booking) io.observe(booking)
    addEventListener('scroll', update, { passive: true })
    return () => {
      io.disconnect()
      removeEventListener('scroll', update)
    }
  }, [])

  return (
    <div className={`mobile-cta ${show ? 'is-visible' : ''}`} aria-hidden={!show}>
      <a href={business.phoneHref} className="mobile-cta__call" tabIndex={show ? 0 : -1} aria-label={`Anrufen: ${business.phoneDisplay}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </a>
      <a
        href="#termin"
        className="mobile-cta__book"
        tabIndex={show ? 0 : -1}
        onClick={(e) => {
          e.preventDefault()
          scrollToTarget('#termin')
        }}
      >
        Termin anfragen
      </a>
    </div>
  )
}

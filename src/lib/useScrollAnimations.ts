import { useLayoutEffect, type RefObject } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion'
import { splitWords } from './split'

/**
 * Zentrales Motion-System. Elemente werden über data-Attribute gesteuert:
 *
 *   data-reveal="text"    Wörter gleiten aus einer Maske nach oben
 *   data-reveal="fade"    sanftes Einblenden von unten
 *   data-reveal="image"   goldener Wischer gibt das Bild frei, Inhalt zoomt zurück
 *   data-count="6"       Zahl zählt beim Erscheinen hoch
 *   data-reveal="line"    Linie zeichnet sich von links nach rechts
 *   data-stagger          Kinder erscheinen nacheinander
 *   data-parallax="0.2"   Parallax beim Scrollen (Anteil der Höhe)
 */
export function useScrollAnimations(root: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-reveal="text"]').forEach((node) => {
        const words = splitWords(node)
        gsap.from(words, {
          yPercent: 115,
          rotation: 2,
          duration: 1.3,
          stagger: 0.035,
          ease: 'expo.out',
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((node) => {
        gsap.from(node, {
          y: 36,
          autoAlpha: 0,
          duration: 1.2,
          delay: Number(node.dataset.delay ?? 0),
          scrollTrigger: { trigger: node, start: 'top 90%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-reveal="image"]').forEach((node) => {
        const inner = node.querySelector('picture, img')
        // Goldener Wischer läuft vor dem Bild durch
        let wipe = node.querySelector<HTMLElement>(':scope > .reveal-wipe')
        if (!wipe) {
          wipe = document.createElement('span')
          wipe.className = 'reveal-wipe'
          wipe.setAttribute('aria-hidden', 'true')
          node.appendChild(wipe)
        }
        const media = node.querySelectorAll(':scope > picture, :scope > .img__parallax')
        gsap.set(media, { autoAlpha: 0 })
        node.dataset.veiled = ''
        const tl = gsap.timeline({ scrollTrigger: { trigger: node, start: 'top 85%', once: true } })
        tl.fromTo(wipe, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.75, ease: 'expo.inOut' })
          .set(media, { autoAlpha: 1 })
          .call(() => delete node.dataset.veiled)
          .set(wipe, { transformOrigin: '50% 0%' })
          .to(wipe, { scaleY: 0, duration: 1, ease: 'expo.inOut' })
        if (inner) tl.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.75)
      })

      el.querySelectorAll<HTMLElement>('[data-count]').forEach((node) => {
        const target = Number(node.dataset.count)
        const from = Number(node.dataset.countFrom ?? 0)
        const obj = { v: from }
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: 'expo.out',
          onUpdate: () => (node.textContent = String(Math.round(obj.v))),
          scrollTrigger: { trigger: node, start: 'top 90%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-reveal="line"]').forEach((node) => {
        gsap.from(node, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.6,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-stagger]').forEach((node) => {
        gsap.from(node.children, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.08,
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        })
      })

      el.querySelectorAll<HTMLElement>('[data-parallax]').forEach((node) => {
        const amount = Number(node.dataset.parallax) || 0.15
        gsap.fromTo(
          node,
          { yPercent: -amount * 50 },
          {
            yPercent: amount * 50,
            ease: 'none',
            scrollTrigger: { trigger: node.parentElement ?? node, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    }, el)

    // Nach dem Laden von Schriften/Bildern Positionen neu berechnen
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

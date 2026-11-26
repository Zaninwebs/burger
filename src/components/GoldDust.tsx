import { useEffect, useRef } from 'react'
import { isFinePointer, prefersReducedMotion } from '../lib/motion'

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  a: number
  tw: number
}

/**
 * Schwebender Goldstaub auf Canvas. Partikel weichen der Maus sanft aus,
 * pausieren außerhalb des Sichtbereichs und entfallen bei reduzierter Bewegung.
 */
export function GoldDust({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || prefersReducedMotion()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let particles: Particle[] = []
    let raf = 0
    let visible = true
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(((w * h) / (isFinePointer() ? 16000 : 26000)) * density)
      particles = Array.from({ length: Math.min(count, 140) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.25 - 0.05,
        a: Math.random() * 0.6 + 0.15,
        tw: Math.random() * Math.PI * 2,
      }))
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < 14000) {
          const f = (1 - d2 / 14000) * 0.6
          p.vx += (dx / Math.sqrt(d2 + 1)) * f * 0.15
          p.vy += (dy / Math.sqrt(d2 + 1)) * f * 0.15
        }
        p.vx *= 0.985
        p.vy = p.vy * 0.985 - 0.004
        p.x += p.vx
        p.y += p.vy
        p.tw += 0.03
        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        const alpha = p.a * (0.55 + Math.sin(p.tw) * 0.45)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        g.addColorStop(0, `rgba(240, 214, 160, ${alpha})`)
        g.addColorStop(1, 'rgba(207, 171, 112, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(canvas)
    resize()
    tick()
    addEventListener('resize', resize)
    addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onMove)
    }
  }, [density])

  return <canvas ref={ref} className="gold-dust" aria-hidden="true" />
}

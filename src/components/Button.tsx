import type { MouseEvent, ReactNode } from 'react'
import { scrollToTarget } from '../lib/motion'
import { Arrow } from './Arrow'
import { Magnetic } from './Magnetic'

interface Props {
  href: string
  children: ReactNode
  variant?: 'solid' | 'ghost' | 'gold' | 'ghost-light'
  arrow?: boolean
  cursor?: string
  className?: string
}

/** Magnetischer Button mit einfahrender Füllung und Pfeil-Animation. */
export function Button({ href, children, variant = 'solid', arrow = true, cursor, className = '' }: Props) {
  const isHash = href.startsWith('#')
  const onClick = (e: MouseEvent) => {
    if (!isHash) return
    e.preventDefault()
    scrollToTarget(href)
    history.replaceState(null, '', href)
  }
  const cls = `btn ${variant === 'solid' ? '' : `btn--${variant}`} ${className}`
  return (
    <Magnetic>
      <a href={href} className={cls} onClick={onClick} data-cursor={cursor}>
        <span>{children}</span>
        {arrow && (
          <span className="btn-arrow">
            <Arrow />
          </span>
        )}
      </a>
    </Magnetic>
  )
}

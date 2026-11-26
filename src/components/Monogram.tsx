import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from '../data/monogram'

interface Props {
  className?: string
  /** Zugänglicher Name; ohne Titel ist die Grafik rein dekorativ. */
  title?: string
  fill?: string
}

/** Das AH-Monogramm aus dem Salon-Logo als skalierbare Vektorgrafik. */
export function Monogram({ className, title, fill = 'currentColor' }: Props) {
  return (
    <svg
      className={className}
      viewBox={MONOGRAM_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={MONOGRAM_PATH} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

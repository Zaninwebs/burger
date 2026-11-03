import { useState, type CSSProperties } from 'react'
import { images, type ImageId } from '../data/images.generated'
import { asset } from '../lib/site'

interface Props {
  id: ImageId
  className?: string
  /** CSS sizes-Attribut, z. B. "(min-width: 900px) 40vw, 100vw" */
  sizes?: string
  priority?: boolean
  alt?: string
  style?: CSSProperties
  /** Überschreibt den Bildfokus (object-position). */
  focus?: string
  reveal?: boolean
  parallax?: number
  /** 3D-Neigung bei Mausbewegung */
  tilt?: boolean
}

const srcSet = (id: string, widths: number[], ext: string) => widths.map((w) => `${asset(`img/${id}-${w}.${ext}`)} ${w}w`).join(', ')

/** Responsives Bild mit AVIF/WebP, Unschärfe-Platzhalter und Lazy Loading. */
export function Img({ id, className = '', sizes = '100vw', priority, alt, style, focus, reveal, parallax, tilt }: Props) {
  const img = images[id]
  const [loaded, setLoaded] = useState(false)
  const largest = img.widths[img.widths.length - 1]
  const picture = (
    <picture>
      <source type="image/avif" srcSet={srcSet(img.id, img.widths, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(img.id, img.widths, 'webp')} sizes={sizes} />
      <img
        src={asset(`img/${img.id}-${largest}.webp`)}
        width={img.width}
        height={img.height}
        alt={alt ?? img.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={loaded ? 'is-loaded' : ''}
        style={{ objectPosition: focus ?? img.focus }}
        onLoad={() => setLoaded(true)}
        ref={(node) => {
          if (node?.complete && node.naturalWidth && !loaded) setLoaded(true)
        }}
      />
    </picture>
  )
  return (
    <div
      className={`img ${className}`}
      style={{ backgroundImage: loaded ? undefined : `url(${img.lqip})`, ...style }}
      data-reveal={reveal ? 'image' : undefined}
      data-tilt={tilt ? '' : undefined}
    >
      {parallax ? (
        <div className="img__parallax" data-parallax={parallax}>
          {picture}
        </div>
      ) : (
        picture
      )}
    </div>
  )
}

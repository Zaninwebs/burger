import { Img } from '../components/Img'
import { business } from '../data/content'
import type { ImageId } from '../data/images.generated'

const PREVIEW: ImageId[] = ['balayage-blond', 'herren-taper', 'braut-halfup', 'damen-locken-blond', 'herren-mid-fade', 'damen-bob']

const InstaIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" />
  </svg>
)

/** Großer Instagram-Abschluss: ein Klick führt direkt auf das Profil. */
export function Instagram() {
  return (
    <section className="insta section on-dark grain" aria-labelledby="insta-title">
      <div className="wrap insta__grid">
        <div className="insta__text">
          <p className="eyebrow">Instagram</p>
          <h2 id="insta-title" className="h-lg" data-reveal="text">
            Mehr von uns <em>auf Instagram.</em>
          </h2>
          <p className="lead" data-reveal="fade">
            Aktuelle Arbeiten, Farben und Einblicke in den Salon finden Sie auf unserem Instagram-Profil.
          </p>
          <a
            href={business.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="insta__btn"
            data-cursor="Folgen"
            data-reveal="fade"
          >
            <span className="insta__btn-icon">
              <InstaIcon />
            </span>
            <span>
              <small>Folgen Sie uns auf Instagram</small>
              <strong>@{business.instagram}</strong>
            </span>
          </a>
        </div>

        <a
          href={business.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="insta__wall"
          aria-label={`Instagram-Profil @${business.instagram} öffnen`}
          data-cursor="Instagram"
        >
          {PREVIEW.map((id, i) => (
            <span key={id} className="insta__tile" style={{ ['--i' as string]: i }}>
              <Img id={id} sizes="(min-width: 900px) 16vw, 33vw" />
              <span className="insta__hover" aria-hidden="true">
                <InstaIcon size={30} />
              </span>
            </span>
          ))}
        </a>
      </div>
    </section>
  )
}

import { Img } from '../components/Img'

const POINTS = [
  { title: 'Sulfat- & parabenfrei', text: 'Pflege, die Haar und Kopfhaut respektiert.' },
  { title: 'Ohne Tierversuche', text: 'Cruelty free – verantwortungsvoll hergestellt.' },
  { title: 'Nachhaltige Inhaltsstoffe', text: 'Für sichtbar gesundes Haar – für jeden Haartyp.' },
  { title: 'Color.Me', text: 'Unsere Colorationen entstehen mit COLOR.ME by Kevin.Murphy.' },
]

/**
 * Produktwelt Kevin.Murphy. Weitere Produktbilder: in scripts/images.mjs
 * eintragen und hier als <Img id="…" /> ergänzen.
 */
export function KevinMurphy() {
  return (
    <section className="km section" aria-labelledby="km-title">
      <div className="wrap km__grid">
        <div className="km__media">
          <Img id="km-regal" className="km__main" tilt reveal parallax={0.14} sizes="(min-width: 900px) 44vw, 92vw" />
          <Img id="km-acryl" className="km__second" tilt reveal sizes="(min-width: 900px) 22vw, 50vw" />
          <span className="km__tag" aria-hidden="true">
            KEVIN.MURPHY
          </span>
        </div>

        <div className="km__text">
          <p className="eyebrow">Unsere Pflege</p>
          <h2 id="km-title" className="h-lg" data-reveal="text">
            Pflege, die <em>den Look vollendet.</em>
          </h2>
          <p className="lead" data-reveal="fade">
            Ein Highlight unseres Salons sind die hochwertigen Produkte von Kevin.Murphy – passende Pflege für jeden
            Haartyp, mit hervorragender Qualität und nachhaltigen Inhaltsstoffen für sichtbar gesundes Haar.
          </p>
          <ul className="km__points" data-stagger>
            {POINTS.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
          <p className="km__note" data-reveal="fade">
            Erhältlich direkt bei uns im Salon.
          </p>
        </div>
      </div>
    </section>
  )
}

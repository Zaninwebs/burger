import { Img } from '../components/Img'
import { business, hours } from '../data/content'

/** Besuch & Kontakt: Adresse, Öffnungszeiten (heute hervorgehoben), Anfahrt. */
export function Visit() {
  const today = new Date().getDay()
  return (
    <section id="kontakt" className="visit section" aria-labelledby="visit-title">
      <div className="wrap visit__grid">
        <Img id="salon-aussen" className="visit__img" reveal sizes="(min-width: 900px) 50vw, 100vw" />

        <div className="visit__text">
          <p className="eyebrow">Besuchen Sie uns</p>
          <h2 id="visit-title" className="h-lg" data-reveal="text">
            Mitten in <em>Lützenkirchen.</em>
          </h2>

          <address className="visit__address" data-reveal="fade">
            {business.name}
            <br />
            {business.street}
            <br />
            {business.zip} {business.city}
          </address>

          <div className="visit__links" data-stagger>
            <a href={business.phoneHref} className="link-u">
              {business.phoneDisplay}
            </a>
            <a href={`mailto:${business.email}`} className="link-u">
              {business.email}
            </a>
            <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-u">
              @{business.instagram}
            </a>
            <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-u">
              Route planen (Google Maps)
            </a>
          </div>

          <table className="hours" aria-label="Öffnungszeiten">
            <tbody>
              {hours.map((h) => (
                <tr key={h.day} className={h.weekday === today ? 'is-today' : ''}>
                  <th scope="row">
                    {h.day}
                    {h.weekday === today && <span className="hours__today">Heute</span>}
                  </th>
                  <td>{h.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

import { business, hours } from '../data/content'

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PIN = 'M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'
const PHONE = 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2'
const MAIL = 'M4 6h16v12H4zM4 7l8 6 8-6'
const ROUTE = 'M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2zM9 4v14M15 6v14'

/** Besuch & Kontakt: Adresse, Kontakt und Öffnungszeiten kompakt in einer Karte. */
export function Visit() {
  const today = new Date().getDay()
  return (
    <section id="kontakt" className="visit visit--card section" aria-labelledby="visit-title">
      <div className="wrap">
        <div className="visit__card" data-reveal="fade">
          <header className="visit__head">
            <p className="eyebrow">Besuchen Sie uns</p>
            <h2 id="visit-title" className="h-lg" data-reveal="text">
              Mitten in <em>Lützenkirchen.</em>
            </h2>
          </header>

          <div className="visit__cols">
            <div className="visit__col">
              <h3 className="visit__label">Adresse &amp; Kontakt</h3>
              <address className="visit__address">
                <Icon d={PIN} />
                <span>
                  {business.street}
                  <br />
                  {business.zip} {business.city}
                </span>
              </address>
              <ul className="visit__contact">
                <li>
                  <a href={business.phoneHref}>
                    <Icon d={PHONE} />
                    {business.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${business.email}`}>
                    <Icon d={MAIL} />
                    {business.email}
                  </a>
                </li>
                <li>
                  <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Icon d={ROUTE} />
                    Route planen
                  </a>
                </li>
              </ul>
            </div>

            <div className="visit__col">
              <h3 className="visit__label">Öffnungszeiten</h3>
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
        </div>
      </div>
    </section>
  )
}

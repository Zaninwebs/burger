import { business, hours } from '../data/content'

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PHONE = 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2'
const MAIL = 'M4 6h16v12H4zM4 7l8 6 8-6'

/** Besuch & Kontakt: Kontakt und Öffnungszeiten kompakt (Adresse steht bei „Anfahrt“) in einer Karte. */
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
              <h3 className="visit__label">Kontakt</h3>
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

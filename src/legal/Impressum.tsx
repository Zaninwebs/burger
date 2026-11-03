import { business } from '../data/content'

// Hinweis: Die vollständigen Pflichtangaben der bisherigen Website
// (art-of-hair-by-simyan.de/impressum) konnten beim Umbau nicht automatisch
// übernommen werden. Gelb markierte Stellen bitte mit dem bisherigen Text abgleichen.
export function Impressum() {
  return (
    <article>
      <p className="eyebrow">Rechtliches</p>
      <h1 className="h-lg">Impressum</h1>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {business.name}
        <br />
        Inhaber: {business.owner}
        <br />
        {business.street}
        <br />
        {business.zip} {business.city}
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: <a href={business.phoneHref}>{business.phoneDisplay}</a>
        <br />
        E-Mail: <a href={`mailto:${business.email}`}>{business.email}</a>
      </p>

      <h2>Berufsbezeichnung und berufsrechtliche Regelungen</h2>
      <p>
        Berufsbezeichnung: Friseurmeister (verliehen in der Bundesrepublik Deutschland)
        <br />
        Zuständige Kammer: <span className="todo">[bitte ergänzen – zuständige Handwerkskammer]</span>
        <br />
        Berufsrechtliche Regelungen: Handwerksordnung (HwO)
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        <span className="todo">[bitte ergänzen – Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG, falls vorhanden]</span>
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Bildnachweis</h2>
      <p>Fotos: {business.name}. Produktabbildungen: Kevin.Murphy-Produkte im Salon.</p>
    </article>
  )
}

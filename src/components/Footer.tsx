import { site, dayNames, weekOrder } from "../data/site";
import { brand } from "../data/images";
import { formatSlots } from "../lib/hours";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  // Collapse identical days into one line ("Montag – Sonntag").
  const allSame = weekOrder.every((d) => formatSlots(d) === formatSlots(weekOrder[0]));

  return (
    <footer className="footer on-dark">
      <div className="container footer__grid">
        <div className="footer__brand">
          <img src={brand.badge.src} alt="" width={88} height={88} loading="lazy" decoding="async" />
          <p className="footer__name">{site.name}</p>
          <p className="footer__tag">Pizza, Pasta &amp; Grill in Leichlingen-Witzhelden.</p>
        </div>

        <div>
          <h2 className="footer__heading">Kontakt</h2>
          <address className="footer__address">
            {site.address.street}
            <br />
            {site.address.postalCode} {site.address.city}-{site.address.district}
            <br />
            <a href={site.phoneHref}>{site.phoneDisplay}</a>
            <br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </address>
        </div>

        <div>
          <h2 className="footer__heading">Öffnungszeiten</h2>
          {allSame ? (
            <p className="footer__text">
              {dayNames[weekOrder[0]]} – {dayNames[weekOrder[6]]}
              <br />
              {formatSlots(weekOrder[0])} Uhr
            </p>
          ) : (
            <ul className="footer__list">
              {weekOrder.map((d) => (
                <li key={d}>
                  {dayNames[d].slice(0, 2)}. {formatSlots(d)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer-Navigation">
          <h2 className="footer__heading">Navigation</h2>
          <ul className="footer__list">
            <li>
              <a href="/speisekarte/">Speisekarte</a>
            </li>
            <li>
              <a href="/#bestellen">Bestellen</a>
            </li>
            <li>
              <a href="/#bewertungen">Bewertungen</a>
            </li>
            <li>
              <a href="/#standort">Anfahrt</a>
            </li>
            {site.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container footer__bottom">
        <p>
          © {year} {site.name}
        </p>
        <ul className="footer__legal">
          <li>
            <a href="/impressum/">Impressum</a>
          </li>
          <li>
            <a href="/datenschutz/">Datenschutz</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

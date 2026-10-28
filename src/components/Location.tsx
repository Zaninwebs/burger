import { useState } from "react";
import { site, dayNames, weekOrder } from "../data/site";
import { formatSlots, hoursSummary } from "../lib/hours";
import { useOpenStatus } from "../hooks/useOpenStatus";
import Icon from "./Icon";
import "./Location.css";

export default function Location() {
  const status = useOpenStatus();
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <section id="standort" className="section location" aria-labelledby="location-title">
      <div className="container location__grid">
        <div className="location__info">
          <p className="eyebrow" data-index="05" data-reveal>
            Standort &amp; Öffnungszeiten
          </p>
          <h2 id="location-title" className="section-title" data-reveal>
            Hauptstraße 19,
            <br />
            <em>Witzhelden.</em>
          </h2>

          <p className={`location__status${status?.isOpen ? " is-open" : ""}`} data-reveal>
            <span className="location__dot" aria-hidden="true" />
            {status ? status.label : hoursSummary}
          </p>

          <table className="hours" data-reveal>
            <caption className="sr-only">Öffnungszeiten</caption>
            <tbody>
              {weekOrder.map((d) => (
                <tr key={d} className={d === status?.today ? "is-today" : undefined} aria-current={d === status?.today ? "date" : undefined}>
                  <th scope="row">
                    {dayNames[d]}
                    {d === status?.today && <span className="hours__today">Heute</span>}
                  </th>
                  <td>{formatSlots(d)} Uhr</td>
                </tr>
              ))}
            </tbody>
          </table>

          <address className="location__address" data-reveal>
            <strong>{site.name}</strong>
            <br />
            {site.address.street}
            <br />
            {site.address.postalCode} {site.address.city}-{site.address.district}
            <br />
            <a href={site.phoneHref}>{site.phoneDisplay}</a>
            <br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </address>

          <div className="location__actions" data-reveal>
            <a className="btn" href={site.directionsUrl} target="_blank" rel="noopener">
              <Icon name="route" /> Route planen
              <span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
            </a>
            <a className="btn btn--ghost" href={site.phoneHref}>
              <Icon name="phone" /> Anrufen
            </a>
          </div>
        </div>

        <div className="location__map" data-reveal="mask">
          {mapLoaded ? (
            <iframe
              title={`Karte: ${site.name}, ${site.address.street}, ${site.address.city}`}
              src={site.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="map-consent">
              <svg className="map-consent__art" viewBox="0 0 400 300" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
                <path d="M-20 210 C 80 170, 140 240, 230 190 S 380 120, 430 150" />
                <path d="M-20 90 C 60 120, 160 60, 250 100 S 360 200, 430 170" />
                <path d="M120 -20 C 140 80, 100 180, 150 320" />
                <path d="M300 -20 C 280 90, 330 200, 290 320" />
              </svg>
              <span className="map-consent__pin" aria-hidden="true">
                <Icon name="pin" />
              </span>
              <div className="map-consent__box">
                <p className="map-consent__title">Karte anzeigen?</p>
                <p className="map-consent__text">
                  Beim Laden der Karte werden Daten an Google übertragen. Mehr dazu in der{" "}
                  <a href="/datenschutz/">Datenschutzerklärung</a>.
                </p>
                <div className="map-consent__actions">
                  <button type="button" className="btn btn--sm" onClick={() => setMapLoaded(true)}>
                    Google Maps laden
                  </button>
                  <a className="text-link" href={site.mapsUrl} target="_blank" rel="noopener">
                    In Google Maps öffnen <Icon name="external" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import type { CSSProperties } from "react";
import { site } from "../data/site";
import Icon from "./Icon";
import "./OrderSection.css";

const steps = [
  { title: "Aussuchen", text: "Gericht in der Speisekarte finden und die Nummer merken." },
  { title: "Anrufen", text: `Unter ${site.phoneDisplay} bestellen – bei Pizza mit Größe.` },
  { title: "Genießen", text: "Guten Appetit!" },
];

export default function OrderSection() {
  return (
    <section id="bestellen" className="section order on-dark" aria-labelledby="order-title">
      <div className="container">
        <p className="eyebrow" data-index="05" data-reveal>
          Bestellung &amp; Kontakt
        </p>
        <h2 id="order-title" className="section-title order__title" data-reveal>
          Hunger? <em>Rufen Sie an.</em>
        </h2>

        <a className="order__phone" href={site.phoneHref} data-reveal>
          <span className="order__phone-label">Telefonisch bestellen</span>
          <span className="order__phone-number">{site.phoneDisplay}</span>
          <span className="order__phone-cta">
            <Icon name="phone" /> Jetzt anrufen
          </span>
        </a>

        <ol className="order__steps">
          {steps.map((s, idx) => (
            <li key={s.title} data-reveal style={{ "--reveal-delay": idx * 90 } as CSSProperties}>
              <span className="order__step-no">0{idx + 1}</span>
              <p className="order__step-title">{s.title}</p>
              <p className="order__step-text">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="order__options">
          {site.onlineOrder && (
            <a className="order__option" href={site.onlineOrder.url} target="_blank" rel="noopener" data-reveal>
              <Icon name="bag" />
              <span>
                <span className="order__option-title">Online bestellen</span>
                <span className="order__option-text">über {site.onlineOrder.label}</span>
              </span>
              <Icon name="external" className="order__option-arrow" />
              <span className="sr-only"> (öffnet in neuem Tab)</span>
            </a>
          )}
          <a className="order__option" href={site.directionsUrl} target="_blank" rel="noopener" data-reveal>
            <Icon name="route" />
            <span>
              <span className="order__option-title">Route planen</span>
              <span className="order__option-text">
                {site.address.street}, {site.address.district}
              </span>
            </span>
            <Icon name="external" className="order__option-arrow" />
            <span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
          </a>
          <a className="order__option" href={site.mapsUrl} target="_blank" rel="noopener" data-reveal>
            <Icon name="pin" />
            <span>
              <span className="order__option-title">Standort öffnen</span>
              <span className="order__option-text">in Google Maps</span>
            </span>
            <Icon name="external" className="order__option-arrow" />
            <span className="sr-only"> (öffnet in neuem Tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

import type { CSSProperties } from "react";
import { images, type SiteImage } from "../data/images";
import { findItem, formatPrice } from "../data/menu";
import "./Highlights.css";

interface Highlight {
  no: string;
  kicker: string;
  image: SiteImage;
  category: string;
  layout: "feature" | "tall" | "wide" | "small";
}

/** Real dishes from the menu; the photo for each matches what the dish contains. */
const highlights: Highlight[] = [
  { no: "37b", kicker: "Pizza", image: images.pizzaGarnelen, category: "pizza", layout: "feature" },
  { no: "99", kicker: "Döner & Grill", image: images.doenerTeller, category: "doener", layout: "tall" },
  { no: "61", kicker: "Pizzabrötchen", image: images.pizzabroetchen, category: "pizzabroetchen", layout: "small" },
  { no: "135", kicker: "Schnitzel", image: images.schnitzel, category: "schnitzel", layout: "small" },
  { no: "112", kicker: "Türkische Pizza", image: images.tuerkischePizza, category: "doener", layout: "wide" },
];

export default function Highlights() {
  return (
    <section id="highlights" className="section highlights" aria-labelledby="highlights-title">
      <div className="container">
        <header className="highlights__head">
          <div>
            <p className="eyebrow" data-index="01" data-reveal>
              Kulinarische Highlights
            </p>
            <h2 id="highlights-title" className="section-title" data-reveal style={{ "--reveal-delay": 80 } as CSSProperties}>
              Von der Pizza Burscheid
              <br /> bis zum <em>Döner Teller.</em>
            </h2>
          </div>
          <p className="lead" data-reveal style={{ "--reveal-delay": 160 } as CSSProperties}>
            Eine Auswahl aus unserer Karte – mit Nummer, damit Sie am Telefon einfach sagen können, was es sein soll.
          </p>
        </header>

        <div className="highlights__grid">
          {highlights.map((h, idx) => {
            const item = findItem(h.no);
            if (!item) return null;
            return (
              <article
                key={h.no}
                className={`dish dish--${h.layout}`}
                data-reveal
                style={{ "--reveal-delay": idx * 90 } as CSSProperties}
              >
                <a href={`#kategorie-${h.category}`} className="dish__link" aria-label={`${item.name} in der Speisekarte ansehen`}>
                  <div className={`food-tile dish__media${h.image.flushBottom ? " food-tile--flush-bottom" : ""}`}>
                    <img src={h.image.src} alt={h.image.alt} width={h.image.width} height={h.image.height} loading="lazy" decoding="async" />
                  </div>
                  <div className="dish__body">
                    <p className="dish__kicker">
                      <span>Nr. {item.no}</span> {h.kicker}
                    </p>
                    <h3 className="dish__name">{item.name}</h3>
                    {item.desc && <p className="dish__desc">{item.desc}</p>}
                    <p className="dish__price price">
                      {item.prices.length > 1 ? "ab " : ""}
                      {formatPrice(item.prices[0])} €
                    </p>
                  </div>
                </a>
              </article>
            );
          })}
        </div>
        <p className="highlights__note">Abbildungen sind Serviervorschläge.</p>
      </div>
    </section>
  );
}

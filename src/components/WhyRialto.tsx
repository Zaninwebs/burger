import type { CSSProperties } from "react";
import { dishCount, findItem } from "../data/menu";
import { brand } from "../data/images";
import "./WhyRialto.css";

const localPizzas = ["37", "37c", "37a", "37b"].map((no) => findItem(no)).filter(Boolean);

const facts = [
  {
    figure: String(dishCount),
    label: "Gerichte auf der Karte",
    text: "Pizza und Pasta, Döner und Falafel, Schnitzel, Burger, Aufläufe, Baguettes und Salate – für jeden am Tisch etwas dabei.",
  },
  {
    figure: "3",
    label: "Pizzagrößen",
    text: "Jede Pizza gibt es in 24, 28 oder 32 cm – für den kleinen Hunger oder zum Teilen.",
  },
  {
    figure: "180 g",
    label: "Rindfleischpatty",
    text: "Unsere Rindfleisch-Burger: 100 % Rind im Brioche-Bun mit Eisbergsalat, Gurken, roten Zwiebeln und Tomaten.",
  },
  {
    figure: "6",
    label: "Kiddy Boxen",
    text: "Jede Kiddy Box mit einem Menü nach Wahl, einer Überraschung und einem Softgetränk.",
  },
];

export default function WhyRialto() {
  return (
    <section className="section why on-dark" aria-labelledby="why-title">
      <div className="container why__grid">
        <div className="why__intro">
          <p className="eyebrow" data-index="03" data-reveal>
            Warum Rialto?
          </p>
          <h2 id="why-title" className="section-title" data-reveal>
            Große Auswahl.
            <br />
            <em>Kurze Wege.</em>
          </h2>
          <p className="lead" data-reveal>
            Rialto ist Ihre Grill &amp; Pizzeria an der Hauptstraße in Witzhelden – mit einer Karte, die von der Margherita bis
            zum Taxi Teller reicht.
          </p>
          <figure className="why__badge" data-reveal>
            <img src={brand.badge.src} alt={brand.badge.alt} width={320} height={320} loading="lazy" decoding="async" />
          </figure>
        </div>

        <div>
          <ol className="why__facts">
            {facts.map((f, idx) => (
              <li key={f.label} className="why__fact" data-reveal style={{ "--reveal-delay": idx * 80 } as CSSProperties}>
                <p className="why__figure">{f.figure}</p>
                <div>
                  <h3 className="why__label">{f.label}</h3>
                  <p className="why__text">{f.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="why__local" data-reveal>
            <p className="why__local-kicker">Von hier, für hier</p>
            <p className="why__local-title">Pizzen, benannt nach der Nachbarschaft:</p>
            <ul className="why__local-list">
              {localPizzas.map((p) => (
                <li key={p!.no}>
                  <a href="#kategorie-pizza">
                    <span>{p!.name}</span>
                    <span className="why__local-desc">{p!.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

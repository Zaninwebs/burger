import { useRef, type CSSProperties } from "react";
import { images, type SiteImage } from "../data/images";
import Icon from "./Icon";
import "./Gallery.css";

const tiles: { image: SiteImage; caption: string; category: string }[] = [
  { image: images.pizzaGarnelen, caption: "Pizza", category: "pizza" },
  { image: images.doenerTasche, caption: "Döner Tasche", category: "doener" },
  { image: images.burger, caption: "Burger", category: "burger" },
  { image: images.spaghetti, caption: "Pasta", category: "pasta" },
  { image: images.doenerUeberbacken, caption: "Döner überbacken", category: "doener" },
  { image: images.falafel, caption: "Falafel", category: "falafel" },
  { image: images.nuggets, caption: "Nuggets & Wings", category: "nuggets-wings" },
  { image: images.pizzabroetchen, caption: "Pizzabrötchen", category: "pizzabroetchen" },
  { image: images.schnitzel, caption: "Schnitzel", category: "schnitzel" },
];

export default function Gallery() {
  const railRef = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section className="section gallery" aria-labelledby="gallery-title">
      <div className="container gallery__head">
        <div>
          <p className="eyebrow" data-index="05" data-reveal>
            Galerie
          </p>
          <h2 id="gallery-title" className="section-title" data-reveal>
            Aus unserer <em>Küche.</em>
          </h2>
        </div>
        <div className="gallery__controls">
          <button type="button" className="gallery__btn" onClick={() => scrollBy(-1)} aria-label="Zurück blättern">
            <Icon name="arrow" className="flip" />
          </button>
          <button type="button" className="gallery__btn" onClick={() => scrollBy(1)} aria-label="Weiter blättern">
            <Icon name="arrow" />
          </button>
        </div>
      </div>

      <ul className="gallery__rail" ref={railRef} aria-label="Gerichte aus der Speisekarte">
        {tiles.map((t, idx) => (
          <li key={t.caption} className="gallery__item" data-reveal style={{ "--reveal-delay": Math.min(idx, 4) * 70 } as CSSProperties}>
            <a href={`#kategorie-${t.category}`} className="gallery__link">
              <div className={`food-tile gallery__media${t.image.flushBottom ? " food-tile--flush-bottom" : ""}`}>
                <img src={t.image.src} alt={t.image.alt} width={t.image.width} height={t.image.height} loading="lazy" decoding="async" />
              </div>
              <span className="gallery__caption">
                {t.caption}
                <Icon name="arrow" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

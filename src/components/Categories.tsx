import type { CSSProperties } from "react";
import { menu, formatPrice } from "../data/menu";
import { categoryPhotos } from "../data/images";
import FoodIcon, { type FoodIconName } from "./FoodIcon";
import Icon from "./Icon";
import "./Categories.css";

const shown: { id: string; icon: FoodIconName }[] = [
  { id: "pizza", icon: "pizza" },
  { id: "doener", icon: "doener" },
  { id: "burger", icon: "burger" },
  { id: "pasta", icon: "pasta" },
  { id: "schnitzel", icon: "schnitzel" },
  { id: "pizzabroetchen", icon: "pizzabroetchen" },
  { id: "auflaeufe", icon: "auflaeufe" },
  { id: "salate", icon: "salate" },
];

const stats = (id: string) => {
  const cat = menu.find((c) => c.id === id)!;
  const items = cat.sections.flatMap((s) => s.items);
  const min = Math.min(...items.map((i) => i.prices[0]));
  return { title: cat.title, count: items.length, min };
};

export default function Categories() {
  // With photos, show only the photographed categories plus an "all" tile (6 tiles, 2×3 on phones).
  const withPhotos = shown.filter((c) => categoryPhotos[c.id]);
  const photoMode = withPhotos.length >= 4;
  const list = photoMode ? withPhotos : shown;
  const totalCategories = menu.filter((c) => c.id !== "getraenke").length;

  return (
    <section id="kategorien" className="section categories" aria-labelledby="categories-title">
      <div className="container">
        <header className="categories__head">
          <p className="eyebrow" data-index="01" data-reveal>
            Was darf's sein?
          </p>
          <h2 id="categories-title" className="section-title" data-reveal>
            Wählen Sie Ihre <em>Lieblingsküche.</em>
          </h2>
        </header>

        <ul className="categories__grid">
          {list.map((c, idx) => {
            const s = stats(c.id);
            const photo = categoryPhotos[c.id];
            return (
              <li key={c.id} data-reveal style={{ "--reveal-delay": (idx % 4) * 80 } as CSSProperties}>
                <a className={`cat-card${photo ? " cat-card--photo" : ""}`} href={`/speisekarte/#kategorie-${c.id}`}>
                  {photo ? (
                    <span className="cat-card__photo">
                      <img src={photo.src} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" />
                    </span>
                  ) : (
                    <span className="cat-card__icon">
                      <FoodIcon name={c.icon} />
                    </span>
                  )}
                  <span className="cat-card__title">{s.title}</span>
                  <span className="cat-card__meta">
                    <span>{s.count} Gerichte</span>
                    <span className="cat-card__price">ab {formatPrice(s.min)} €</span>
                  </span>
                  <span className="cat-card__arrow" aria-hidden="true">
                    <Icon name="arrow" />
                  </span>
                </a>
              </li>
            );
          })}
          {photoMode && (
            <li data-reveal style={{ "--reveal-delay": (list.length % 4) * 80 } as CSSProperties}>
              <a className="cat-card cat-card--all" href="/speisekarte/">
                <span className="cat-card__icon">
                  <FoodIcon name="oven" />
                </span>
                <span className="cat-card__title">Ganze Speisekarte</span>
                <span className="cat-card__meta">
                  <span>{totalCategories} Kategorien</span>
                  <span className="cat-card__price">alle Preise</span>
                </span>
                <span className="cat-card__arrow" aria-hidden="true">
                  <Icon name="arrow" />
                </span>
              </a>
            </li>
          )}
        </ul>

        <div className="categories__all" data-reveal>
          <a className="btn btn--ghost btn--lg" href="/speisekarte/">
            Ganze Speisekarte ansehen
            <Icon name="arrow" className="btn-arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { menu, formatPrice, type MenuCategory, type MenuItem } from "../data/menu";
import { images, type SiteImage } from "../data/images";
import { site } from "../data/site";
import Icon from "./Icon";
import "./Menu.css";

const categoryImages: Partial<Record<string, SiteImage>> = {
  pizza: images.pizzaGarnelen,
  pizzabroetchen: images.pizzabroetchen,
  pasta: images.spaghetti,
  doener: images.doenerTasche,
  falafel: images.falafel,
  schnitzel: images.schnitzel,
  burger: images.burger,
  "nuggets-wings": images.nuggets,
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");

function matches(item: MenuItem, q: string) {
  if (!q) return true;
  return normalize(`${item.no} ${item.name} ${item.desc ?? ""}`).includes(q);
}

function filterMenu(query: string): MenuCategory[] {
  const q = normalize(query.trim());
  if (!q) return menu;
  return menu
    .map((c) => ({
      ...c,
      sections: c.sections
        .map((s) => ({ ...s, items: s.items.filter((it) => matches(it, q) || normalize(c.title).includes(q)) }))
        .filter((s) => s.items.length > 0),
    }))
    .filter((c) => c.sections.length > 0);
}

export default function Menu() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(() => filterMenu(deferredQuery), [deferredQuery]);
  const resultCount = categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0);
  const [active, setActive] = useState(menu[0].id);
  const barRef = useRef<HTMLDivElement>(null);

  // Scroll spy: the active category is the last one whose top has passed the sticky toolbar.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const sections = document.querySelectorAll<HTMLElement>("[data-menu-category]");
      const line = (barRef.current?.getBoundingClientRect().bottom ?? 0) + 48;
      let current = sections[0]?.dataset.menuCategory;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.dataset.menuCategory;
        else break;
      }
      if (current) setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [categories]);

  // Keep the active chip visible inside the horizontal bar without moving the page.
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2;
    bar.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);

  return (
    <section id="speisekarte" className="section menu" aria-labelledby="menu-title">
      <div className="container">
        <header className="menu__head">
          <p className="eyebrow" data-index="02" data-reveal>
            Speisekarte
          </p>
          <h2 id="menu-title" className="section-title" data-reveal>
            Unsere ganze Karte. <em>Ein Anruf genügt.</em>
          </h2>
          <p className="lead menu__lead" data-reveal>
            Suchen Sie nach Gericht, Zutat oder Nummer – und nennen Sie beim Bestellen einfach die Nummer.
          </p>
        </header>
      </div>

      <div className="menu__toolbar">
        <div className="container menu__toolbar-inner">
          <div className="menu__search">
            <Icon name="search" />
            <label htmlFor="menu-search" className="sr-only">
              Speisekarte durchsuchen
            </label>
            <input
              id="menu-search"
              type="search"
              placeholder="Suchen: z. B. Hollandaise, Thunfisch, 25a"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button type="button" className="menu__clear" onClick={() => setQuery("")} aria-label="Suche löschen">
                <Icon name="close" />
              </button>
            )}
          </div>
          <nav className="menu__chips" aria-label="Kategorien der Speisekarte" ref={barRef}>
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#kategorie-${c.id}`}
                data-chip={c.id}
                className={`menu__chip${active === c.id ? " is-active" : ""}`}
                aria-current={active === c.id ? "true" : undefined}
              >
                {c.title}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="container">
        <p className="sr-only" role="status" aria-live="polite">
          {deferredQuery ? `${resultCount} Treffer für „${deferredQuery}“` : ""}
        </p>

        {categories.length === 0 && (
          <div className="menu__empty">
            <p className="menu__empty-title">Keine Treffer für „{deferredQuery}“.</p>
            <p>
              Fragen Sie uns gerne direkt: <a href={site.phoneHref}>{site.phoneDisplay}</a>
            </p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setQuery("")}>
              Suche zurücksetzen
            </button>
          </div>
        )}

        {categories.map((c) => (
          <CategoryBlock key={c.id} category={c} image={deferredQuery ? undefined : categoryImages[c.id]} />
        ))}

        <aside className="menu__order on-dark" aria-label="Bestellen">
          <div>
            <p className="menu__order-title">Etwas gefunden?</p>
            <p className="menu__order-text">Rufen Sie an und nennen Sie die Nummer Ihres Gerichts – bei Pizza auch die Größe.</p>
          </div>
          <div className="menu__order-actions">
            <a className="btn" href={site.phoneHref}>
              <Icon name="phone" /> {site.phoneDisplay}
            </a>
            {site.onlineOrder && (
              <a className="btn btn--ghost" href={site.onlineOrder.url} target="_blank" rel="noopener">
                Online bei {site.onlineOrder.label}
                <Icon name="external" />
                <span className="sr-only"> (öffnet in neuem Tab)</span>
              </a>
            )}
          </div>
        </aside>
        <p className="menu__legal">
          Alle Preise in Euro inkl. MwSt. Fragen zu Allergenen und Zusatzstoffen beantworten wir Ihnen gerne telefonisch.
        </p>
      </div>
    </section>
  );
}

function CategoryBlock({ category, image }: { category: MenuCategory; image?: SiteImage }) {
  const labels = category.priceLabels;
  return (
    <section
      id={`kategorie-${category.id}`}
      data-menu-category={category.id}
      className={`menu-cat${image ? " menu-cat--with-image" : ""}`}
      aria-labelledby={`cat-${category.id}`}
    >
      <header className="menu-cat__head">
        <div className="menu-cat__titles">
          <h3 id={`cat-${category.id}`} className="menu-cat__title">
            {category.title}
          </h3>
          {category.note && <p className="menu-cat__note">{category.note}</p>}
        </div>
        {image && (
          <div className={`food-tile menu-cat__image${image.flushBottom ? " food-tile--flush-bottom" : ""}`}>
            <img src={image.src} alt="" width={image.width} height={image.height} loading="lazy" decoding="async" />
          </div>
        )}
      </header>

      {category.sections.map((section, idx) => (
        <div className="menu-sec" key={section.title ?? idx}>
          {section.title && <h4 className="menu-sec__title">{section.title}</h4>}
          {labels && (
            <div className="menu-sec__labels" aria-hidden="true">
              {labels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}
          <ul className="menu-list">
            {section.items.map((item, i) => (
              <li className="menu-item" key={`${item.no}-${i}`}>
                {item.no && <span className="menu-item__no">{item.no}</span>}
                <div className="menu-item__text">
                  <p className="menu-item__name">
                    {item.name}
                    {item.unit && <span className="menu-item__unit">{item.unit}</span>}
                  </p>
                  {item.desc && <p className="menu-item__desc">{item.desc}</p>}
                </div>
                <div className={`menu-item__prices${labels && item.prices.length > 1 ? " is-multi" : ""}`}>
                  {item.prices.map((p, pi) => (
                    <span className="menu-item__price" key={pi}>
                      {labels && item.prices.length > 1 && <span className="menu-item__size">{labels[pi]}</span>}
                      <span className="price">
                        {formatPrice(p)}
                        <span className="sr-only"> Euro</span>
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

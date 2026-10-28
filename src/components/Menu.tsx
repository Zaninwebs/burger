import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { menu, formatPrice, type MenuCategory, type MenuItem } from "../data/menu";
import { site } from "../data/site";
import Icon from "./Icon";
import FoodIcon, { type FoodIconName } from "./FoodIcon";
import "./Menu.css";

const categoryIcons: Partial<Record<string, FoodIconName>> = {
  pizza: "pizza",
  pizzabroetchen: "pizzabroetchen",
  pasta: "pasta",
  doener: "doener",
  schnitzel: "schnitzel",
  burger: "burger",
  auflaeufe: "auflaeufe",
  salate: "salate",
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
  const searching = deferredQuery.trim().length > 0;
  const categories = useMemo(() => filterMenu(deferredQuery), [deferredQuery]);
  const resultCount = categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0);
  const [active, setActive] = useState(menu[0].id);
  const barRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  /** Scroll so the active panel starts right below the sticky nav + toolbar. */
  const revealPanels = (force = false) => {
    const panels = panelsRef.current;
    const bar = barRef.current?.closest<HTMLElement>(".menu__toolbar");
    if (!panels || !bar) return;
    const navHeight = document.querySelector<HTMLElement>(".nav")?.offsetHeight ?? 0;
    const stuckBottom = navHeight + bar.offsetHeight;
    const top = panels.getBoundingClientRect().top;
    if (force || top < stuckBottom) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + top - stuckBottom - 8, behavior: reduced ? "auto" : "smooth" });
    }
  };

  const selectCategory = (id: string, scroll = true) => {
    setQuery("");
    setActive(id);
    if (scroll) requestAnimationFrame(() => revealPanels());
  };

  // Links like "#kategorie-burger" anywhere on the page open the matching tab.
  useEffect(() => {
    const open = (id: string) => {
      if (!menu.some((c) => c.id === id)) return false;
      setQuery("");
      setActive(id);
      requestAnimationFrame(() => revealPanels(true));
      return true;
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#kategorie-"]');
      if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      if (open(link.getAttribute("href")!.slice("#kategorie-".length))) {
        e.preventDefault();
        history.replaceState(null, "", "#speisekarte");
      }
    };
    if (location.hash.startsWith("#kategorie-")) open(location.hash.slice("#kategorie-".length));
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Keep the active tab visible inside the horizontal bar without moving the page.
  useEffect(() => {
    const bar = barRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2;
    bar.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);

  // WAI-ARIA tabs: arrow keys move between tabs, Home/End jump to the ends.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next = -1;
    if (e.key in keys) next = (index + keys[e.key] + menu.length) % menu.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = menu.length - 1;
    if (next < 0) return;
    e.preventDefault();
    selectCategory(menu[next].id, false);
    barRef.current?.querySelector<HTMLButtonElement>(`[data-chip="${menu[next].id}"]`)?.focus();
  };

  return (
    <section id="speisekarte" className="section menu" aria-labelledby="menu-title">
      <div className="container">
        <header className="menu__head">
          <p className="eyebrow" data-reveal>
            Speisekarte
          </p>
          <h1 id="menu-title" className="section-title menu__title" data-reveal>
            Kategorie wählen. <em>Nummer nennen.</em>
          </h1>
          <p className="lead menu__lead" data-reveal>
            Tippen Sie auf eine Kategorie oder suchen Sie nach Gericht, Zutat oder Nummer.
          </p>
        </header>
      </div>

      <div className="menu__toolbar" id="speisekarte-tabs">
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
          <div className="menu__chips" role="tablist" aria-label="Kategorien der Speisekarte" ref={barRef}>
            {menu.map((c, idx) => {
              const selected = !searching && active === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  id={`tab-${c.id}`}
                  data-chip={c.id}
                  aria-selected={selected}
                  aria-controls={`kategorie-${c.id}`}
                  tabIndex={selected || (searching && idx === 0) ? 0 : -1}
                  className={`menu__chip${selected ? " is-active" : ""}`}
                  onClick={() => selectCategory(c.id)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container" ref={panelsRef}>
        <p className="sr-only" role="status" aria-live="polite">
          {searching ? `${resultCount} Treffer für „${deferredQuery}“` : ""}
        </p>

        {searching && categories.length === 0 && (
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

        {(searching ? categories : menu).map((c) => (
          <CategoryBlock
            key={c.id}
            category={c}
            icon={searching ? undefined : categoryIcons[c.id]}
            hidden={!searching && c.id !== active}
            asTabPanel={!searching}
          />
        ))}

        <aside className="menu__order" aria-label="Bestellen">
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

function CategoryBlock({
  category,
  icon,
  hidden,
  asTabPanel,
}: {
  category: MenuCategory;
  icon?: FoodIconName;
  hidden: boolean;
  asTabPanel: boolean;
}) {
  let itemIndex = 0;
  const labels = category.priceLabels;
  return (
    <section
      id={`kategorie-${category.id}`}
      className="menu-cat"
      role={asTabPanel ? "tabpanel" : undefined}
      aria-labelledby={asTabPanel ? `tab-${category.id}` : `cat-${category.id}`}
      hidden={hidden}
      tabIndex={asTabPanel ? 0 : undefined}
    >
      <header className="menu-cat__head">
        <div className="menu-cat__titles">
          <h3 id={`cat-${category.id}`} className="menu-cat__title">
            {category.title}
          </h3>
          {category.note && <p className="menu-cat__note">{category.note}</p>}
        </div>
        {icon && (
          <span className="menu-cat__icon">
            <FoodIcon name={icon} />
          </span>
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
              <li className="menu-item" key={`${item.no}-${i}`} style={{ "--i": itemIndex++ } as CSSProperties}>
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

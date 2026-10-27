import { useLayoutEffect, useRef, useState } from "react";
import { menu, MENU_NOTE } from "../data/menu";
import { gsap, prefersReducedMotion } from "../lib/motion";
import Emblem from "./Emblem";
import { AddToCart } from "./Order";
import { Button, Lines, revealOnScroll, useGsap } from "./ui";
import "./Menu.css";

export default function Menu() {
  const root = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(menu[0].id);
  const category = menu.find((c) => c.id === active) ?? menu[0];
  const first = useRef(true);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    revealOnScroll(q(".menu-sec__title .line-mask > span"), q(".menu-sec__head")[0]);
    gsap.from(q(".menu-tab"), {
      opacity: 0,
      x: -20,
      stagger: 0.05,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".menu-sec__tabs")[0], start: "top 85%", once: true },
    });
  });

  // animate dishes in: on first scroll into view, then on every category change
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || prefersReducedMotion()) return;
    const initial = first.current;
    first.current = false;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        scrollTrigger: initial ? { trigger: el, start: "top 80%", once: true } : undefined,
      });
      tl.fromTo(".menu-cat__title .line-mask > span", { yPercent: 110 }, { yPercent: 0, duration: 1 })
        .fromTo(
          ".dish",
          { opacity: 0, y: 26, clipPath: "inset(0% 0% 100% 0%)" },
          { opacity: 1, y: 0, clipPath: "inset(0% 0% -20% 0%)", duration: 0.9, stagger: 0.05 },
          "-=0.8",
        )
        .fromTo(".dish__leader", { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.05, ease: "expo.inOut" }, "<");
    }, el);
    return () => ctx.revert();
  }, [active]);

  const select = (id: string) => {
    setActive(id);
    // keep the active tab visible in the horizontal mobile strip
    requestAnimationFrame(() => {
      tabsRef.current
        ?.querySelector<HTMLElement>(`[data-id="${id}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const i = menu.findIndex((c) => c.id === active);
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const c = menu[(next + menu.length) % menu.length];
    select(c.id);
    tabsRef.current?.querySelector<HTMLElement>(`[data-id="${c.id}"]`)?.focus();
  };

  return (
    <section id="speisekarte" ref={root} className="menu-sec" aria-labelledby="menu-title">
      <div className="container menu-sec__grid">
        <div className="menu-sec__side">
          <header className="menu-sec__head">
            <p className="label eyebrow menu-sec__eyebrow">La Carta</p>
            <h2 id="menu-title" className="h2 menu-sec__title">
              <Lines lines={["Die", <em key="s">Speisekarte.</em>]} />
            </h2>
          </header>
          <div className="menu-sec__tabs" role="tablist" aria-label="Kategorien" ref={tabsRef} onKeyDown={onKey}>
            {menu.map((c) => (
              <button
                key={c.id}
                data-id={c.id}
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={c.id === active}
                aria-controls="menu-panel"
                tabIndex={c.id === active ? 0 : -1}
                className={`menu-tab ${c.id === active ? "is-active" : ""}`}
                onClick={() => select(c.id)}
              >
                <span className="menu-tab__label">{c.label}</span>
                <span className="menu-tab__it serif">{c.italian}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          id="menu-panel"
          className="menu-cat"
          role="tabpanel"
          aria-labelledby={`tab-${category.id}`}
          ref={listRef}
          key={category.id}
          tabIndex={0}
        >
          <div className="menu-cat__head">
            <h3 className="menu-cat__title">
              <Lines lines={[<em key="i">{category.italian}</em>]} />
            </h3>
            {category.intro && <p className="muted">{category.intro}</p>}
          </div>
          <ul className="menu-cat__list">
            {category.dishes.map((d) => (
              <li key={d.name} className={`dish ${d.house ? "dish--house" : ""}`}>
                <div className="dish__row">
                  <span className="dish__name">
                    {d.name}
                    {d.house && (
                      <span className="dish__badge label">
                        <Emblem className="dish__lily" title="" sizes="12px" />
                        Della Casa
                      </span>
                    )}
                  </span>
                  <span className="dish__leader" aria-hidden="true" />
                  <span className="dish__price">
                    {d.price ? (
                      <>
                        {d.price}
                        <span className="dish__eur"> €</span>
                      </>
                    ) : (
                      <span className="dish__na" title="Preis auf Anfrage">
                        —<span className="sr-only">Preis im Restaurant erfragen</span>
                      </span>
                    )}
                  </span>
                  <AddToCart category={category.id} name={d.name} />
                </div>
                {d.description && <p className="dish__desc muted">{d.description}</p>}
              </li>
            ))}
          </ul>
          <p className="menu-cat__note">
            Mit <span className="menu-cat__plus" aria-hidden="true">+</span> wählen Sie Gerichte zum Abholen aus. {MENU_NOTE}
          </p>
          <Button href="#reservieren" cursor="Reserve">
            Tisch reservieren
          </Button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { site } from "../data/site";
import { images } from "../data/images";
import { dishCount, formatPrice, findItem } from "../data/menu";
import { formatSlots, hoursSummary } from "../lib/hours";
import { useOpenStatus } from "../hooks/useOpenStatus";
import Icon from "./Icon";
import "./Hero.css";

const cheapestPizza = findItem("01")?.prices[0] ?? 0;

const quickLinks = [
  { id: "pizza", label: "Pizza" },
  { id: "doener", label: "Döner" },
  { id: "burger", label: "Burger" },
  { id: "pasta", label: "Pasta" },
  { id: "schnitzel", label: "Schnitzel" },
];

export default function Hero() {
  const status = useOpenStatus();
  const artRef = useRef<HTMLDivElement>(null);

  // Very light parallax on the food motif — skipped for reduced motion and small screens.
  useEffect(() => {
    const el = artRef.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)");
    if (mq.matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.setProperty("--parallax", `${y * 0.06}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section id="top" className="hero on-dark" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">Grill &amp; Pizzeria · Leichlingen-Witzhelden</p>
          <h1 id="hero-title" className="hero__title display">
            <span className="hero__line"><span>Pizza, Pasta</span></span>
            <span className="hero__line"><span>&amp; Grill –</span></span>
            <span className="hero__line"><span><em>mitten in Witzhelden.</em></span></span>
          </h1>
          <p className="lead hero__lead">
            Pizza, Pasta, Döner, Schnitzel und Burger – {dishCount} Gerichte auf einer Karte. Anrufen, bestellen, genießen.
          </p>

          <div className="hero__ctas">
            <a className="btn btn--lg btn--sheen" href={site.phoneHref}>
              <Icon name="phone" />
              Jetzt bestellen
            </a>
            <a className="btn btn--ghost btn--lg" href="#speisekarte">
              Speisekarte entdecken
              <Icon name="arrow" className="btn-arrow" />
            </a>
          </div>
          <nav className="hero__quick" aria-label="Direkt zur Kategorie">
            {quickLinks.map((q) => (
              <a key={q.id} href={`#kategorie-${q.id}`}>
                {q.label}
              </a>
            ))}
          </nav>
          <p className="hero__alt">
            Telefon <a href={site.phoneHref}>{site.phoneDisplay}</a>
            {site.onlineOrder && (
              <>
                {" "}
                · oder{" "}
                <a href={site.onlineOrder.url} target="_blank" rel="noopener">
                  online bei {site.onlineOrder.label}
                  <span className="sr-only"> (öffnet in neuem Tab)</span>
                </a>
              </>
            )}
          </p>
        </div>

        <div className="hero__art" ref={artRef}>
          <div className="hero__arch-outline" aria-hidden="true" />
          <div className="hero__arch">
            <img
              src={images.pizzaHero.src}
              alt={images.pizzaHero.alt}
              width={images.pizzaHero.width}
              height={images.pizzaHero.height}
              fetchPriority="high"
              decoding="async"
              className="hero__pizza"
            />
          </div>
          <p className={`hero__chip hero__chip--status${status?.isOpen ? " is-open" : ""}`}>
            <span className="hero__dot" aria-hidden="true" />
            {status ? status.label : hoursSummary}
          </p>
          <p className="hero__chip hero__chip--price">
            <span className="hero__chip-label">Pizza · 24, 28 &amp; 32 cm</span>
            <span className="hero__chip-value">ab {formatPrice(cheapestPizza)} €</span>
          </p>
        </div>
      </div>

      <div className="container">
        <ul className="hero__facts">
          <li>
            <Icon name="pin" />
            <a href={site.mapsUrl} target="_blank" rel="noopener">
              {site.address.street}, {site.address.postalCode} {site.address.city}
            </a>
          </li>
          <li>
            <Icon name="clock" />
            <span>{status ? `Heute ${formatSlots(status.today)} Uhr` : hoursSummary}</span>
          </li>
          <li>
            <Icon name="phone" />
            <a href={site.phoneHref}>{site.phoneDisplay}</a>
          </li>
        </ul>
      </div>
    </section>
  );
}

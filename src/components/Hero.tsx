import { useEffect, useRef } from "react";
import { site } from "../data/site";
import { images, brand } from "../data/images";
import { dishCount, formatPrice, findItem } from "../data/menu";
import { formatSlots, hoursSummary } from "../lib/hours";
import { useOpenStatus } from "../hooks/useOpenStatus";
import { LaurelRing, Waves } from "./Ornaments";
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
  const plateRef = useRef<HTMLDivElement>(null);

  // Gentle parallax + tilt of the pizza plate while scrolling (skipped for reduced motion).
  useEffect(() => {
    const el = plateRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.setProperty("--scroll", String(y / window.innerHeight));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__sun" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <figure className="hero__logo">
            <span className="hero__logo-ring" aria-hidden="true" />
            <img src={brand.badge.src} alt={brand.badge.alt} width={220} height={220} fetchPriority="high" />
          </figure>

          <p className="eyebrow hero__eyebrow">Grill &amp; Pizzeria · Leichlingen-Witzhelden</p>
          <h1 id="hero-title" className="hero__title display">
            <span className="hero__line"><span>Pizza, Pasta</span></span>
            <span className="hero__line"><span>&amp; Grill –</span></span>
            <span className="hero__line"><span><em>mitten in Witzhelden.</em></span></span>
          </h1>
          <p className="lead hero__lead">
            {dishCount} Gerichte, von der Margherita bis zum Döner Teller. Anrufen, bestellen, genießen.
          </p>

          <div className="hero__ctas">
            <a className="btn btn--lg btn--sheen" href={site.phoneHref}>
              <Icon name="phone" />
              Jetzt bestellen
            </a>
            <a className="btn btn--ghost btn--lg" href="/speisekarte/">
              Speisekarte
              <Icon name="arrow" className="btn-arrow" />
            </a>
          </div>

          <nav className="hero__quick" aria-label="Direkt zur Kategorie">
            {quickLinks.map((q, i) => (
              <a key={q.id} href={`/speisekarte/#kategorie-${q.id}`} style={{ animationDelay: `${1100 + i * 70}ms` }}>
                {q.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hero__art" ref={plateRef}>
          <LaurelRing className="hero__laurel" />
          <div className="hero__plate">
            <img
              src={images.pizzaHero.src}
              alt={images.pizzaHero.alt}
              width={images.pizzaHero.width}
              height={images.pizzaHero.height}
              decoding="async"
            />
          </div>
          <img className="hero__seal" src={brand.badge.src} alt="" width={120} height={120} aria-hidden="true" />
          <p className={`hero__chip hero__chip--status${status?.isOpen ? " is-open" : ""}`}>
            <span className="hero__dot" aria-hidden="true" />
            {status ? status.label : hoursSummary}
          </p>
          <p className="hero__chip hero__chip--price">
            <span className="hero__chip-label">Pizza · 24 / 28 / 32 cm</span>
            <span className="hero__chip-value">ab {formatPrice(cheapestPizza)} €</span>
          </p>
        </div>
      </div>

      <div className="container">
        <ul className="hero__facts">
          <li>
            <Icon name="pin" />
            <a href={site.mapsUrl} target="_blank" rel="noopener">
              {site.address.street}, {site.address.district}
              <span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
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

      <Waves className="hero__waves" />
    </section>
  );
}

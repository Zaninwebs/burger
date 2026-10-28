import { useEffect, useState, type CSSProperties } from "react";
import { site } from "../data/site";
import { brand } from "../data/images";
import Icon from "./Icon";
import "./Navbar.css";

const links = [
  { href: "/speisekarte/", label: "Speisekarte" },
  { href: "/#bewertungen", label: "Bewertungen" },
  { href: "/#bestellen", label: "Bestellen" },
  { href: "/#standort", label: "Öffnungszeiten & Anfahrt" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`nav on-dark${scrolled ? " nav--scrolled" : ""}${open ? " nav--open" : ""}`}>
      <div className="container nav__inner">
        <a href="/" className="nav__brand" aria-label={`${site.name} – zur Startseite`} onClick={() => setOpen(false)}>
          <img src={brand.badge.src} alt="" width={44} height={44} className="nav__badge" />
          <span className="nav__wordmark">
            <span className="nav__name">Rialto</span>
            <span className="nav__sub">Grill &amp; Pizzeria</span>
          </span>
        </a>

        <nav className="nav__links" aria-label="Hauptnavigation">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <a className="nav__phone" href={site.phoneHref}>
            <Icon name="phone" />
            <span>{site.phoneDisplay}</span>
          </a>
          <a className="btn btn--sm nav__order" href="/#bestellen">
            Bestellen
          </a>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="nav__sheet" hidden={!open}>
        <nav aria-label="Mobile Navigation" className="container">
          <ul>
            {links.map((l, idx) => (
              <li key={l.href} style={{ "--i": idx } as CSSProperties}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav__sheet-actions">
            <a className="btn" href={site.phoneHref}>
              <Icon name="phone" /> {site.phoneDisplay}
            </a>
            <a className="btn btn--ghost" href="/#bestellen" onClick={() => setOpen(false)}>
              Alle Bestellwege
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

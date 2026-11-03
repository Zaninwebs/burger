import { useEffect, useRef, useState } from "react";
import { business, fullAddress, hours, nav } from "../data/content";
import { gsap, prefersReducedMotion, scrollToHash, stopScroll } from "../lib/motion";
import { useI18n } from "../i18n";
import Emblem from "./Emblem";
import LangSwitch from "./LangSwitch";
import { Button } from "./ui";
import "./Header.css";

export default function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // background + hide on scroll down / show on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > window.innerHeight * 0.9 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // active section indicator
  useEffect(() => {
    const ids = nav.map((n) => n.href.slice(1)).concat("reservieren");
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // mobile menu timeline
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" } })
        .set(el, { visibility: "visible" })
        .fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: reduced ? 0.01 : 0.9, ease: "expo.inOut" })
        .from(".menu__link > span", { yPercent: 115, duration: reduced ? 0.01 : 1, stagger: 0.06 }, "-=0.35")
        .from(".menu__foot > *", { opacity: 0, y: 16, duration: reduced ? 0.01 : 0.8, stagger: 0.06 }, "-=0.8");
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!tl.current) return;
    if (open) {
      tl.current.timeScale(1).play();
      stopScroll(true);
      const first = menuRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();
    } else {
      tl.current.timeScale(1.6).reverse();
      stopScroll(false);
    }
  }, [open]);

  // ESC + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && menuRef.current) {
        const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a, button")).concat(toggleRef.current!);
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const wasOpen = open;
    setOpen(false);
    // let the menu start closing before we scroll
    window.setTimeout(() => scrollToHash(href), wasOpen ? 350 : 0);
  };

  const cls = ["header", scrolled && "is-scrolled", hidden && !open && "is-hidden", open && "is-open"]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={cls}>
      <div className="header__bar">
        <a className="brand" href="#top" onClick={go("#top")} aria-label={t("Casa Ducale — zum Seitenanfang")}>
          <Emblem className="brand__lily" title="" sizes="30px" priority />
          <span className="brand__text">
            <span className="brand__name">Casa Ducale</span>
            <span className="brand__sub">Cucina Italiana</span>
          </span>
        </a>

        <nav className="header__nav" aria-label={t("Hauptnavigation")}>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={go(n.href)}
                  className={`nav-link ${active === n.href ? "is-active" : ""}`}
                  aria-current={active === n.href ? "true" : undefined}
                >
                  {t(n.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__cta">
          <Button href="#reservieren" small variant="gold" cursor="Reserve">
            {t("Tisch reservieren")}
          </Button>
        </div>

        <LangSwitch className="header__lang" />

        <button
          ref={toggleRef}
          className="header__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? t("Menü schließen") : t("Menü öffnen")}</span>
          <span className="header__toggle-label" aria-hidden="true">
            {open ? t("Schließen") : t("Menü")}
          </span>
          <span className="header__toggle-icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div id="mobile-menu" ref={menuRef} className="menu theme-dark" aria-hidden={!open} inert={!open}>
        <nav aria-label={t("Mobile Navigation")}>
          <ul className="menu__list">
            {nav.concat({ href: "#reservieren", label: "Reservieren" }).map((n) => (
              <li key={n.href}>
                <a className="menu__link" href={n.href} onClick={go(n.href)}>
                  <span>{t(n.label)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="menu__foot">
          <a className="menu__phone" href={business.phoneHref}>
            {business.phoneDisplay}
          </a>
          <p>{fullAddress}</p>
          <p>
            {hours
              .filter((h) => h.time)
              .map((h) => `${t(h.short)} ${h.time}`)
              .join(" · ")}
          </p>
          <Button href="#reservieren" variant="gold" onClick={() => setOpen(false)}>
            {t("Tisch reservieren")}
          </Button>
        </div>
        <Emblem className="menu__lily" title="" sizes="60vw" />
      </div>
    </header>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageName } from "../data/images.gen";
import { useI18n } from "../i18n";
import { gsap, prefersReducedMotion, stopScroll } from "../lib/motion";
import { Lines, Picture, revealOnScroll, useGsap } from "./ui";
import "./Gallery.css";

type Shot = { name: ImageName; alt: string; caption: string };

const SHOTS: Shot[] = [
  { name: "pizza-burrata", alt: "Pizza mit Burrata, Kirschtomaten und Basilikum", caption: "Dal Forno" },
  { name: "linguine-mare", alt: "Linguine mit Meeresfrüchten", caption: "Dal Mare" },
  { name: "fragole-insegna", alt: "Erdbeer-Dessert vor dem Casa-Ducale-Schild", caption: "Dolce" },
  { name: "antipasti-teller", alt: "Antipasti-Teller mit Parmaschinken und Lachs", caption: "Antipasti" },
  { name: "crepe-fragole", alt: "Crêpe mit frischen Erdbeeren, Erdbeersauce und Vanilleeis", caption: "Crêpe" },
  { name: "matcha", alt: "Geschichteter Matcha-Drink mit Erdbeere im Glas", caption: "Matcha & Fragola" },
  { name: "penne-pesto", alt: "Penne mit Pesto und Parmesan", caption: "Pasta" },
  { name: "fondo", alt: "Brühe mit frischen Kräutern im Topf", caption: "In cucina" },
  { name: "pizze-candela", alt: "Zwei Pizzen bei Kerzenlicht", caption: "Pizze" },
  { name: "salmone-risotto", alt: "Lachs auf Brot mit Salat, dahinter Risotto", caption: "Pranzo" },
  { name: "buffet-frutta", alt: "Obstbuffet für eine Feier", caption: "Catering" },
  { name: "cheesecake-piazza", alt: "Käsekuchen mit Blick auf eine Piazza", caption: "Cheesecake" },
];

// three columns on desktop, each moving at its own speed
const COLUMNS = [SHOTS.filter((_, i) => i % 3 === 0), SHOTS.filter((_, i) => i % 3 === 1), SHOTS.filter((_, i) => i % 3 === 2)];

export default function Gallery() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    revealOnScroll(q(".gallery__title .line-mask > span"), q(".gallery__head")[0]);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      q(".gallery__col").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: [6, -4, 10][i] },
          {
            yPercent: [-10, 6, -16][i],
            ease: "none",
            scrollTrigger: { trigger: q(".gallery__cols")[0], start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    });
    q(".shot").forEach((el) => {
      gsap.fromTo(
        el.querySelector(".pic"),
        { clipPath: "inset(10% 10% 10% 10%)", opacity: 0.2 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    });
    return () => mm.revert();
  });

  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    setIndex(i);
  };
  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);

  return (
    <section id="galerie" ref={root} className="gallery theme-dark" aria-labelledby="gallery-title">
      <div className="container">
        <header className="gallery__head">
          <p className="label eyebrow label--gold">Momenti</p>
          <h2 id="gallery-title" className="h2 gallery__title">
            <Lines lines={[t("Momente"), <em key="c">{t("aus der Casa.")}</em>]} />
          </h2>
        </header>

        <div className="gallery__cols">
          {COLUMNS.map((col, ci) => (
            <ul key={ci} className="gallery__col">
              {col.map((s) => {
                const i = SHOTS.indexOf(s);
                return (
                  <li key={s.name} className="shot">
                    <button
                      type="button"
                      className="shot__btn"
                      data-cursor="View"
                      onClick={(e) => open(i, e.currentTarget)}
                      aria-label={t("{caption} vergrößern", { caption: s.caption })}
                    >
                      <Picture
                        name={s.name}
                        alt={t(s.alt)}
                        sizes="(min-width: 900px) 30vw, 46vw"
                        className="shot__pic"
                      />
                      <span className="shot__meta" aria-hidden="true">
                        <span className="serif">{s.caption}</span>
                        <svg viewBox="0 0 18 18" width="16">
                          <path d="M1 17 17 1M6 1h11v11" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>

      {index !== null && <Lightbox shots={SHOTS} index={index} onIndex={setIndex} onClose={close} />}
    </section>
  );
}

// ------------------------------------------------------------------ Lightbox

function Lightbox({
  shots,
  index,
  onIndex,
  onClose,
}: {
  shots: Shot[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { t } = useI18n();
  const shot = shots[index];
  const go = useCallback((d: number) => onIndex((index + d + shots.length) % shots.length), [index, onIndex, shots.length]);

  const animatedClose = useCallback(() => {
    if (prefersReducedMotion() || !ref.current) return onClose();
    gsap.to(ref.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "expo.inOut", onComplete: onClose });
  }, [onClose]);

  useEffect(() => {
    stopScroll(true);
    closeBtn.current?.focus();
    if (!prefersReducedMotion() && ref.current)
      gsap.fromTo(ref.current, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" });
    return () => stopScroll(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") animatedClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Tab" && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>("button"));
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
  }, [go, animatedClose]);

  // image transition on index change
  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      ref.current!.querySelector(".lightbox__stage .pic"),
      { opacity: 0, scale: 1.04 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "expo.out" },
    );
  }, [index]);

  return (
    <div
      ref={ref}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t("Bild {n} von {total}: {caption}", { n: index + 1, total: shots.length, caption: shot.caption })}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) animatedClose();
        touch.current = null;
      }}
    >
      <div className="lightbox__top">
        <span className="label">
          {String(index + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
        </span>
        <button ref={closeBtn} type="button" className="lightbox__close label" onClick={animatedClose}>
          {t("Schließen")} <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="lightbox__stage" onClick={(e) => e.target === e.currentTarget && animatedClose()}>
        <Picture key={shot.name} name={shot.name} alt={t(shot.alt)} sizes="92vw" className="lightbox__pic" priority />
      </div>
      <div className="lightbox__bottom">
        <button type="button" className="lightbox__nav" onClick={() => go(-1)} aria-label={t("Vorheriges Bild")}>
          <svg viewBox="0 0 24 24" width="22">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <p className="lightbox__caption serif">
          <em>{shot.caption}</em>
        </p>
        <button type="button" className="lightbox__nav" onClick={() => go(1)} aria-label={t("Nächstes Bild")}>
          <svg viewBox="0 0 24 24" width="22">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

import { useRef } from "react";
import type { ImageName } from "../data/images.gen";
import { useI18n } from "../i18n";
import { gsap, ScrollTrigger } from "../lib/motion";
import { Button, Lines, Picture, useGsap } from "./ui";
import "./Kitchen.css";

type Plate = { image: ImageName; italian: string; german: string; line: string; alt: string; shape: "tall" | "wide" | "square" };

// Captions name the category shown, never an unverified dish name.
const PLATES: Plate[] = [
  {
    image: "pizze-candela",
    italian: "Pizze",
    german: "Pizza",
    line: "Knuspriger Rand, nach original italienischem Rezept.",
    alt: "Zwei Pizzen mit Hähnchen, Oliven und Paprika bei Kerzenlicht auf einem Holztisch",
    shape: "tall",
  },
  {
    image: "linguine-mare",
    italian: "Dal Mare",
    german: "Maritime Spezialitäten",
    line: "Muscheln, Garnelen, Tintenfisch — Pasta mit dem Meer.",
    alt: "Linguine mit Miesmuscheln, Garnelen und Tintenfisch auf ovalen Tellern",
    shape: "wide",
  },
  {
    image: "penne-pesto",
    italian: "Pasta",
    german: "Pasta",
    line: "Nach Rezepten, wie man sie in Italien kocht.",
    alt: "Penne in cremiger Sauce mit Pesto und frisch geriebenem Parmesan",
    shape: "tall",
  },
  {
    image: "antipasti-teller",
    italian: "Antipasti",
    german: "Vorspeisen",
    line: "Zum Teilen, zum Ankommen, zum Anfangen.",
    alt: "Antipasti-Teller mit Parmaschinken, Räucherlachs und gegrillten Zucchini-Röllchen",
    shape: "square",
  },
  {
    image: "pizza-burrata",
    italian: "Dal Forno",
    german: "Aus dem Ofen",
    line: "Hauchdünn, mit dunklen Blasen am Rand.",
    alt: "Pizza mit Burrata, Kirschtomaten und Basilikum",
    shape: "tall",
  },
  {
    image: "cheesecake-piazza",
    italian: "Dolci",
    german: "Desserts",
    line: "Der süße Abschluss — oder einfach zum Kaffee.",
    alt: "Gebackener Käsekuchen auf einer Etagere, daneben eine weiße Rose",
    shape: "tall",
  },
];

export default function Kitchen() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    const mm = gsap.matchMedia();

    // desktop: pinned horizontal travel
    mm.add("(min-width: 900px)", () => {
      const track = q(".kitchen__track")[0];
      const distance = () => track.scrollWidth - window.innerWidth;
      const travel = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: q(".kitchen__pin")[0],
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      q(".plate").forEach((plate) => {
        const img = plate.querySelector("img:not(.pic__lqip)");
        gsap.fromTo(
          img,
          { scale: 1.28, xPercent: 6 },
          {
            scale: 1.02,
            xPercent: -6,
            ease: "none",
            scrollTrigger: { trigger: plate, containerAnimation: travel, start: "left right", end: "right left", scrub: true },
          },
        );
        gsap.fromTo(
          plate.querySelector(".plate__frame"),
          { clipPath: "inset(12% 0% 12% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power2.out",
            scrollTrigger: { trigger: plate, containerAnimation: travel, start: "left 95%", end: "left 45%", scrub: true },
          },
        );
        gsap.from(plate.querySelectorAll(".plate__caption > *"), {
          yPercent: 60,
          opacity: 0,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: plate, containerAnimation: travel, start: "left 80%", end: "left 50%", scrub: true },
        });
      });

      gsap.to(q(".kitchen__progress span"), {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: q(".kitchen__pin")[0], start: "top top", end: () => `+=${distance()}`, scrub: true },
      });
      gsap.to(q(".kitchen__ghost"), {
        xPercent: -30,
        ease: "none",
        scrollTrigger: { trigger: q(".kitchen__pin")[0], start: "top top", end: () => `+=${distance()}`, scrub: true },
      });
    });

    // mobile: each plate reveals as it enters
    mm.add("(max-width: 899px)", () => {
      q(".plate").forEach((plate) => {
        gsap.fromTo(
          plate.querySelector(".plate__frame"),
          { clipPath: "inset(20% 8% 20% 8%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power2.out",
            scrollTrigger: { trigger: plate, start: "top 92%", end: "top 40%", scrub: 0.5 },
          },
        );
        gsap.fromTo(
          plate.querySelector("img:not(.pic__lqip)"),
          { scale: 1.25 },
          { scale: 1, ease: "none", scrollTrigger: { trigger: plate, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    });

    gsap.from(q(".kitchen__intro .line-mask > span"), {
      yPercent: 110,
      stagger: 0.1,
      duration: 1.3,
      ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
    });

    // images inside may change layout once loaded
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    return () => {
      mm.revert();
      window.removeEventListener("load", refresh);
    };
  });

  return (
    <section id="kueche" ref={root} className="kitchen theme-dark" aria-labelledby="kitchen-title">
      <div className="kitchen__pin">
        <p className="kitchen__ghost display" aria-hidden="true">
          La Cucina · La Cucina ·
        </p>
        <div className="kitchen__track">
          <header className="kitchen__intro">
            <p className="label eyebrow label--gold">La Cucina</p>
            <h2 id="kitchen-title" className="h2">
              <Lines lines={[t("Was aus"), <em key="k">{t("unserer Küche")}</em>, t("kommt.")]} />
            </h2>
            <p className="muted kitchen__lead">
              {t("Von der Pizza bis zum Dessert. Ein Blick auf die Teller, die jeden Tag den Pass verlassen.")}
            </p>
            <Button href="#speisekarte" variant="ghost" className="on-dark" small>
              {t("Zur Speisekarte")}
            </Button>
          </header>

          {PLATES.map((p) => (
            <figure key={p.image} className={`plate plate--${p.shape}`} data-cursor="View">
              <Picture
                name={p.image}
                className="plate__frame"
                alt={t(p.alt)}
                sizes={p.shape === "wide" ? "(min-width: 900px) 52vw, 92vw" : "(min-width: 900px) 30vw, 92vw"}
              />
              <figcaption className="plate__caption">
                <span className="plate__title serif">
                  <em>{p.italian}</em>
                </span>
                <span className="plate__german label">{t(p.german)}</span>
                <span className="plate__line muted">{t(p.line)}</span>
              </figcaption>
            </figure>
          ))}

          <div className="kitchen__end">
            <p className="h2">
              <em>Buon</em> appetito.
            </p>
            <Button href="#reservieren" variant="gold" cursor="Reserve">
              {t("Tisch reservieren")}
            </Button>
          </div>
        </div>
        <div className="kitchen__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}

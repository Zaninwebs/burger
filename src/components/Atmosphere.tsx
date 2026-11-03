import { useRef } from "react";
import { useI18n } from "../i18n";
import { gsap } from "../lib/motion";
import { Lines, Picture, useGsap } from "./ui";
import "./Atmosphere.css";

/** Pinned image that grows from a small window to the full viewport. */
export default function Atmosphere() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root.current,
        start: "top top",
        end: "+=140%",
        scrub: 0.8,
        pin: q(".atmo__pin")[0],
        anticipatePin: 1,
      },
    });
    tl.fromTo(
      q(".atmo__frame")[0],
      { clipPath: "inset(24% 32% 24% 32% round 999px 999px 0px 0px)" },
      { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "power2.inOut", duration: 1 },
      0,
    )
      .fromTo(q(".atmo__frame img:not(.pic__lqip)"), { scale: 1.35 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
      .to(q(".atmo__word--l"), { xPercent: -40, opacity: 0, ease: "power1.in", duration: 0.6 }, 0)
      .to(q(".atmo__word--r"), { xPercent: 40, opacity: 0, ease: "power1.in", duration: 0.6 }, 0)
      .to(q(".atmo__veil"), { opacity: 1, duration: 0.5 }, 0.55)
      .from(q(".atmo__copy .line-mask > span"), { yPercent: 110, stagger: 0.06, duration: 0.4 }, 0.7)
      .from(q(".atmo__copy .atmo__reveal"), { opacity: 0, y: 20, stagger: 0.06, duration: 0.3 }, 0.85);
  });

  return (
    <section className="atmo theme-dark" ref={root} aria-labelledby="atmo-title">
      <div className="atmo__pin">
        <p className="atmo__word atmo__word--l display" aria-hidden="true">
          L’atmosfera
        </p>
        <p className="atmo__word atmo__word--r display" aria-hidden="true">
          <em>di casa</em>
        </p>
        <div className="atmo__frame">
          <Picture
            name="cheesecake-piazza"
            alt={t("Käsekuchen auf einer Etagere, im Hintergrund das Bild einer italienischen Piazza")}
            sizes="100vw"
            focus="50% 40%"
          />
          <div className="atmo__veil" />
        </div>
        <div className="atmo__copy container">
          <p className="label label--gold atmo__reveal">L’Atmosfera</p>
          <h2 id="atmo-title" className="h2">
            <Lines lines={[t("Ein Stück Piazza,"), <em key="m">{t("mitten in Leverkusen.")}</em>]} />
          </h2>
          <p className="atmo__text atmo__reveal">
            {t("Ein Espresso am Morgen, ein langer Abend mit Freunden — Casa Ducale in den Luminaden am Wiesdorfer Platz ist ein Ort zum Ankommen.")}
          </p>
        </div>
      </div>
    </section>
  );
}

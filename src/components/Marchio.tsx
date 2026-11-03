import { useRef } from "react";
import { useI18n } from "../i18n";
import { gsap } from "../lib/motion";
import Emblem from "./Emblem";
import { Lines, Picture, useGsap } from "./ui";
import "./Marchio.css";

/** Brand stage: the fleur-de-lis drawn in gold, next to the real house sign. */
export default function Marchio() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: q(".marchio__stage")[0], start: "top 70%", once: true },
    });
    tl.fromTo(
      q(".marchio__lily")[0],
      { clipPath: "inset(100% 0% 0% 0%)", scale: 0.9, y: 40 },
      { clipPath: "inset(0% 0% 0% 0%)", scale: 1, y: 0, duration: 1.6, ease: "expo.out", clearProps: "clipPath" },
    )
      .from(q(".marchio__halo"), { opacity: 0, scale: 0.6, duration: 1.8, ease: "expo.out" }, "-=1.4")
      .add(() => root.current?.classList.add("is-shining"), "-=0.4")
      .from(q(".marchio__name .line-mask > span"), { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1 }, "-=1.2")
      .from(q(".marchio__rule"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, "-=1")
      .from(q(".marchio__meta > *"), { opacity: 0, y: 16, stagger: 0.08, duration: 1 }, "-=0.8");

    // slow parallax: lily floats against the sign photo
    gsap.to(q(".marchio__lily-wrap"), {
      yPercent: -14,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.fromTo(
      q(".marchio__photo")[0],
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.6,
        ease: "expo.inOut",
        scrollTrigger: { trigger: q(".marchio__photo")[0], start: "top 85%", once: true },
      },
    );
    gsap.fromTo(
      q(".marchio__photo img:not(.pic__lqip)"),
      { scale: 1.25, yPercent: -6 },
      {
        scale: 1.05,
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: q(".marchio__photo")[0], start: "top bottom", end: "bottom top", scrub: true },
      },
    );

    // pointer tilt on the emblem (desktop)
    const stage = q(".marchio__lily-wrap")[0];
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && stage) {
      const rx = gsap.quickTo(stage, "rotationX", { duration: 1, ease: "power3.out" });
      const ry = gsap.quickTo(stage, "rotationY", { duration: 1, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        const r = root.current!.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 16);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
      };
      root.current!.addEventListener("pointermove", onMove);
      return () => root.current?.removeEventListener("pointermove", onMove);
    }
  });

  return (
    <section className="marchio theme-dark" ref={root} aria-labelledby="marchio-title">
      <div className="marchio__inner container">
        <div className="marchio__stage">
          <div className="marchio__lily-wrap">
            <div className="marchio__halo" aria-hidden="true" />
            <Emblem className="marchio__lily" title={t("Die goldene Lilie von Casa Ducale")} sizes="(min-width: 900px) 260px, 150px" />
            <span className="marchio__shine" aria-hidden="true" />
          </div>
          <h2 id="marchio-title" className="marchio__name">
            <Lines lines={[<em key="n">Casa Ducale</em>]} />
          </h2>
          <span className="marchio__rule" aria-hidden="true" />
          <div className="marchio__meta">
            <p className="label">Cucina Italiana</p>
            <p className="muted">{t("Die goldene Lilie — das Zeichen unseres Hauses.")}</p>
          </div>
        </div>

        <figure className="marchio__figure">
          <Picture
            name="fragole-insegna"
            className="marchio__photo"
            alt={t("Dessert mit frischen Erdbeeren vor dem schwarz-goldenen Schild „Casa Ducale – Cucina Italiana“")}
            sizes="(min-width: 900px) 34vw, 86vw"
          />
          <figcaption className="label marchio__caption">Dolce della casa</figcaption>
        </figure>
      </div>
    </section>
  );
}

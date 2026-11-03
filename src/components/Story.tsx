import { useRef } from "react";
import { story } from "../data/content";
import { useI18n } from "../i18n";
import { gsap } from "../lib/motion";
import { Lines, Picture, revealOnScroll, useGsap, Words } from "./ui";
import "./Story.css";

export default function Story() {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    // manifesto: words light up as you read
    gsap.fromTo(
      q(".story__manifesto .sw > span"),
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: q(".story__manifesto")[0], start: "top 78%", end: "bottom 45%", scrub: true },
      },
    );
    revealOnScroll(q(".story__head .line-mask > span"), q(".story__head")[0]);
    gsap.from(q(".story__copy > *"), {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".story__copy")[0], start: "top 80%", once: true },
    });

    // images: clip reveal + counter-parallax
    q(".story__img").forEach((el, i) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(18% 12% 18% 12%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", end: "top 35%", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        el.querySelector("img:not(.pic__lqip)"),
        { scale: 1.3 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );
      gsap.to(el, {
        yPercent: i === 0 ? -8 : -26,
        ease: "none",
        scrollTrigger: { trigger: q(".story__media")[0], start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // facts: count-up for numeric values
    q(".fact__value[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = String(Math.round(obj.v));
        },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
    gsap.from(q(".fact"), {
      opacity: 0,
      y: 40,
      stagger: 0.12,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".story__facts")[0], start: "top 85%", once: true },
    });
    gsap.from(q(".fact__rule"), {
      scaleX: 0,
      transformOrigin: "left",
      stagger: 0.12,
      duration: 1.4,
      ease: "expo.inOut",
      scrollTrigger: { trigger: q(".story__facts")[0], start: "top 85%", once: true },
    });
    // the manifesto is split into words: rebuild the animation for each language
  }, [lang]);

  return (
    <section id="restaurant" ref={root} className="story" aria-labelledby="story-title">
      <div className="container">
        <p className="label eyebrow story__eyebrow">Il Ristorante</p>
        <p className="story__manifesto display">
          <Words text={t("Ein Ort für gutes Essen.")} />
          <br />
          <em>
            <Words text={t("Für gute Momente.")} />
          </em>
        </p>

        <div className="story__grid">
          <div className="story__text">
            <h2 id="story-title" className="story__head h2">
              <Lines lines={[t("Willkommen"), <em key="c">{t("in der Casa.")}</em>]} />
            </h2>
            <div className="story__copy">
              <p className="lead">{t(story.lead)}</p>
              {story.body.map((p) => (
                <p key={p} className="muted">
                  {t(p)}
                </p>
              ))}
            </div>
          </div>

          <div className="story__media">
            <Picture
              name="fondo"
              className="story__img story__img--a"
              alt={t("Brühe mit frischen Kräutern und Lorbeer in einem Topf in der Küche")}
              sizes="(min-width: 900px) 34vw, 78vw"
            />
            <Picture
              name="salmone-risotto"
              className="story__img story__img--b"
              alt={t("Lachs auf Brot mit Avocado und Salat, dahinter Risotto")}
              sizes="(min-width: 900px) 20vw, 46vw"
            />
          </div>
        </div>

        <ul className="story__facts">
          {story.facts.map((f) => {
            const numeric = /^\d+$/.test(f.value);
            return (
              <li key={f.label} className="fact">
                <span className="fact__rule" aria-hidden="true" />
                <span className="fact__value display" data-count={numeric ? f.value : undefined}>
                  {numeric ? f.value : t(f.value)}
                </span>
                <span className="fact__label label">{t(f.label)}</span>
                <span className="fact__sub muted">{t(f.sub)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

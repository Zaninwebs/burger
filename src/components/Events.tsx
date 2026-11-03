import { useRef } from "react";
import { business, events } from "../data/content";
import { useI18n } from "../i18n";
import { gsap } from "../lib/motion";
import { Button, Lines, Picture, revealOnScroll, useGsap } from "./ui";
import "./Events.css";

export const OCCASION_EVENT = "cd:occasion";

export default function Events() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    revealOnScroll(q(".events__title .line-mask > span"), q(".events__head")[0]);
    gsap.from(q(".occasion"), {
      yPercent: 100,
      opacity: 0,
      stagger: 0.07,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".events__list")[0], start: "top 85%", once: true },
    });
    q(".events__img").forEach((el, i) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.5,
          ease: "expo.inOut",
          delay: i * 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
      gsap.to(el, {
        yPercent: [-6, -16, -10, -22][i % 4],
        ease: "none",
        scrollTrigger: { trigger: q(".events__collage")[0], start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  });

  const requestEvent = () => {
    window.dispatchEvent(new CustomEvent(OCCASION_EVENT, { detail: "Feier / Catering" }));
  };

  return (
    <section id="feiern" ref={root} className="events" aria-labelledby="events-title">
      <div className="container events__grid">
        <div className="events__head">
          <p className="label eyebrow events__eyebrow">{t("Feste & Catering")}</p>
          <h2 id="events-title" className="h2 events__title">
            <Lines lines={[t("Feiern bei"), <em key="c">Casa Ducale.</em>]} />
          </h2>
          <p className="lead events__lead">{t(events.lead)}</p>
          <ul className="events__list" aria-label={t("Anlässe")}>
            {events.occasions.map((o) => (
              <li key={o} className="occasion">
                <span className="occasion__dot" aria-hidden="true" />
                {t(o)}
              </li>
            ))}
          </ul>
          <div className="events__ctas">
            <Button href="#reservieren" onClick={requestEvent} cursor="Reserve">
              {t("Feier anfragen")}
            </Button>
            <a className="link link--static events__phone" href={business.phoneHref}>
              {t("oder anrufen:")} {business.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="events__collage">
          <Picture
            name="buffet-frutta"
            className="events__img events__img--a"
            alt={t("Festlich angerichtetes Obstbuffet mit Windlichtern vor dem Wandbild einer italienischen Piazza")}
            sizes="(min-width: 900px) 26vw, 56vw"
          />
          <Picture
            name="buffet-antipasti"
            className="events__img events__img--b"
            alt={t("Catering-Buffet mit Lachs-Crostini, Caprese-Spießen, Salaten, Käse und Aufschnitt")}
            sizes="(min-width: 900px) 22vw, 44vw"
          />
          <Picture
            name="sala-natale"
            className="events__img events__img--c"
            alt={t("Festlich gedeckte lange Tafeln im Restaurant zur Weihnachtszeit")}
            sizes="(min-width: 900px) 30vw, 64vw"
          />
          <Picture
            name="sala-festa"
            className="events__img events__img--d"
            alt={t("Für eine Geburtstagsfeier dekorierter Gastraum mit Ballons und gedeckten Tischen")}
            sizes="(min-width: 900px) 22vw, 44vw"
          />
        </div>
      </div>
    </section>
  );
}

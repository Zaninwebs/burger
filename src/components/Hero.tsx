import { useEffect, useRef, useState } from "react";
import { business } from "../data/content";
import { useI18n } from "../i18n";
import { gsap, prefersReducedMotion, scrollToHash, stopScroll } from "../lib/motion";
import Emblem from "./Emblem";
import { OpenBadge, ScrollMouse } from "./Icons";
import { Button, Lines, useGsap } from "./ui";
import "./Hero.css";
import { site } from "../lib/paths";

const INTRO_SEEN = "cd-intro-seen";

/** Desktop arch geometry (px) for the video window, from the viewport size. */
function archClip(vw: number, vh: number): string {
  const w = Math.min(vw * 0.36, vh * 0.62);
  const right = vw * 0.07;
  const left = vw - right - w;
  const top = vh * 0.13;
  const bottom = vh * 0.06;
  const r = w / 2;
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px ${r}px 0px 0px)`;
}
const FULL = "inset(0px 0px 0px 0px round 0px 0px 0px 0px)";

export default function Hero() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [introDone, setIntroDone] = useState(false);
  const [paused, setPaused] = useState(false);

  useGsap(root, ({ reduced, q }) => {
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const media = q(".hero__media")[0];
    const intro = q(".intro")[0];
    const header = document.querySelector(".header__bar");
    const seen = sessionStorage.getItem(INTRO_SEEN) === "1";

    const finish = () => {
      setIntroDone(true);
      stopScroll(false);
      document.documentElement.classList.add("intro-done");
      try {
        sessionStorage.setItem(INTRO_SEEN, "1");
      } catch {
        /* private mode */
      }
    };

    if (reduced) {
      gsap.set(media, { clipPath: desktop ? archClip(innerWidth, innerHeight) : FULL });
      gsap.set(intro, { display: "none" });
      finish();
      return;
    }

    // ---------------------------------------------------------- entrance
    stopScroll(true);
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    const lily = q(".intro__lily")[0];

    if (!seen) {
      // the lily rises out of a mask, then a gold glint passes over it
      tl.fromTo(
        lily,
        { clipPath: "inset(100% 0% 0% 0%)", scale: 0.86, y: 24 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1, y: 0, duration: 1, ease: "expo.out" },
      )
        .fromTo(q(".intro__glint"), { xPercent: -140 }, { xPercent: 140, duration: 0.9, ease: "power2.inOut" }, "-=0.55")
        .from(q(".intro__word .line-mask > span"), { yPercent: 110, duration: 0.7 }, "-=0.6")
        .from(q(".intro__sub"), { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
    } else {
      tl.from(q(".intro__mark"), { opacity: 0, scale: 0.94, duration: 0.45 });
    }

    // impatient visitors: any input fast-forwards the intro
    const skip = () => tl.progress() < 0.95 && tl.timeScale(3.5);
    const skipEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    skipEvents.forEach((ev) => window.addEventListener(ev, skip, { once: true, passive: true }));
    tl.eventCallback("onComplete", () => skipEvents.forEach((ev) => window.removeEventListener(ev, skip)));

    tl.to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.95, ease: "expo.inOut" })
      .addLabel("revealed")
      .fromTo(
        media,
        { clipPath: desktop ? archClip(innerWidth, innerHeight).replace(/^inset\(\S+/, `inset(${innerHeight}px`) : "inset(100% 0px 0px 0px round 0px 0px 0px 0px)" },
        { clipPath: desktop ? archClip(innerWidth, innerHeight) : FULL, duration: 1.4 },
        "-=0.55",
      )
      .from(q(".hero__video"), { scale: 1.35, duration: 2 }, "<")
      .from(q(".hero__title .line-mask > span"), { yPercent: 110, duration: 1.2, stagger: 0.08 }, "<0.1")
      .from(q(".hero__reveal"), { opacity: 0, y: 24, duration: 1, stagger: 0.07 }, "<0.3")
      .from(q(".hero__arch-line"), { opacity: 0, duration: 1.2 }, "<")
      .from(header, { opacity: 0, y: -16, duration: 0.9, clearProps: "opacity,transform" }, "<0.1")
      // hand scrolling back as soon as the hero is on screen
      .add(finish, "revealed");

    // ---------------------------------------------------------- scroll
    if (desktop) {
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=110%",
          scrub: 0.8,
          pin: q(".hero__pin")[0],
          invalidateOnRefresh: true,
        },
      });
      st.fromTo(media, { clipPath: () => archClip(innerWidth, innerHeight) }, { clipPath: FULL, ease: "power2.inOut", immediateRender: false }, 0)
        .to(q(".hero__content"), { yPercent: -18, opacity: 0, ease: "power1.in", duration: 0.55 }, 0)
        .to(q(".hero__arch-line"), { opacity: 0, scale: 1.08, duration: 0.4 }, 0)
        .to(q(".hero__shade"), { opacity: 1, duration: 0.6 }, 0.25)
        .from(q(".hero__caption .line-mask > span"), { yPercent: 110, stagger: 0.08, duration: 0.45 }, 0.5)
        .from(q(".hero__caption .label"), { opacity: 0, duration: 0.3 }, 0.6);
    } else {
      gsap.to(q(".hero__video"), {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }
  });

  // Pause the video off-screen (battery) and honour the pause button.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (prefersReducedMotion()) {
      v.pause();
      setPaused(true);
      return;
    }
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(!!v.dataset.userPaused);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !v.dataset.userPaused) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      delete v.dataset.userPaused;
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.dataset.userPaused = "1";
      v.pause();
      setPaused(true);
    }
  };

  return (
    <section id="top" ref={root} className="hero theme-dark" aria-labelledby="hero-title">
      <div className="intro" aria-hidden="true">
        <div className="intro__mark">
          <span className="intro__lily-wrap">
            <Emblem className="intro__lily" title="" sizes="120px" priority />
            <span className="intro__glint" aria-hidden="true" />
          </span>
          <p className="intro__word">
            <Lines lines={["Casa Ducale"]} />
          </p>
          <p className="intro__sub label">Cucina Italiana</p>
        </div>
      </div>

      <div className="hero__pin">
        <div className="hero__media grain">
          <video
            ref={video}
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={site("media/video/hero-poster.webp")}
            aria-hidden="true"
          >
            <source src={site("media/video/hero.webm")} type="video/webm" />
            <source src={site("media/video/hero.mp4")} type="video/mp4" />
          </video>
          <div className="hero__tint" />
          <div className="hero__shade" />
        </div>

        <div className="hero__arch-line" aria-hidden="true" />

        <div className="hero__content container">
          <p className="label label--gold hero__reveal hero__kicker">
            Ristorante · Café — {business.city}-{business.district}
          </p>
          <h1 id="hero-title" className="hero__title display">
            <Lines lines={["Casa", <em key="d">Ducale</em>]} />
          </h1>
          <p className="hero__tagline label hero__reveal">Cucina Italiana</p>
          <p className="hero__text hero__reveal">
            {t("Italienisches Lebensgefühl und herzliche Gastfreundschaft. Vom Frühstück bis zum Abendessen — mitten in Wiesdorf.")}
          </p>
          <div className="hero__ctas hero__reveal">
            <Button href="#reservieren" variant="gold" cursor="Reserve">
              {t("Tisch reservieren")}
            </Button>
            <Button href="#restaurant" variant="ghost" className="on-dark" arrow={false}>
              {t("Entdecke Casa Ducale")}
            </Button>
          </div>
          <OpenBadge className="hero__reveal hero__status" />
        </div>

        <div className="hero__caption" aria-hidden={!introDone}>
          <p className="label label--gold">La Cucina</p>
          <p className="hero__caption-text display">
            <Lines lines={[t("Direkt aus"), <em key="k">{t("unserer Küche.")}</em>]} />
          </p>
        </div>

        <div className="hero__foot hero__reveal">
          <a
            className="hero__scroll"
            href="#restaurant"
            aria-label={t("Nach unten scrollen")}
            onClick={(e) => {
              e.preventDefault();
              scrollToHash("#restaurant");
            }}
          >
            <ScrollMouse />
          </a>
          <button className="hero__play label" type="button" onClick={togglePlay} aria-pressed={paused}>
            {paused ? t("Video abspielen") : t("Video pausieren")}
          </button>
        </div>
      </div>
    </section>
  );
}

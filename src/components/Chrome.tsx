import { useEffect, useRef, useState } from "react";
import { gsap, isFinePointer, prefersReducedMotion } from "../lib/motion";
import { useCart } from "../lib/cart";
import { Button } from "./ui";
import "./Chrome.css";

/**
 * Desktop cursor: a small dot that grows into a labelled disc over elements
 * with [data-cursor]. The native cursor stays visible, so usability never
 * depends on it.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [enabled] = useState(() => typeof window !== "undefined" && isFinePointer() && !prefersReducedMotion());

  useEffect(() => {
    if (!enabled || !dot.current) return;
    const el = dot.current;
    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    let current = "";
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      el.classList.add("is-visible");
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      const next = target?.dataset.cursor ?? (target ? "·" : "");
      if (next !== current) {
        current = next;
        setLabel(next);
      }
    };
    const leave = () => el.classList.remove("is-visible");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  const mode = label === "" ? "" : label === "·" ? "is-link" : "is-label";
  return (
    <div ref={dot} className={`cursor ${mode}`} aria-hidden="true">
      <span className="cursor__disc" />
      <span className="cursor__text">{mode === "is-label" ? label : ""}</span>
    </div>
  );
}

/** Mobile bottom CTA — appears after the hero, hides near the form and footer. */
export function StickyCta() {
  const [visible, setShow] = useState(false);
  // the basket bar takes this spot once something is in the basket
  const { count } = useCart();
  const show = visible && count === 0;

  useEffect(() => {
    const hero = document.getElementById("top");
    const blockers = ["reservieren"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const footer = document.querySelector("footer");
    const state = { pastHero: false, blocked: new Set<Element>() };
    const update = () => setShow(state.pastHero && state.blocked.size === 0);

    const heroIo = new IntersectionObserver(([e]) => {
      state.pastHero = !e.isIntersecting;
      update();
    });
    if (hero) heroIo.observe(hero);

    const blockIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) state.blocked.add(e.target);
        else state.blocked.delete(e.target);
      }
      update();
    });
    [...blockers, footer].forEach((el) => el && blockIo.observe(el));
    return () => {
      heroIo.disconnect();
      blockIo.disconnect();
    };
  }, []);

  return (
    <div className={`sticky-cta ${show ? "is-visible" : ""}`} aria-hidden={!show} inert={!show}>
      <Button href="#reservieren" variant="gold">
        Tisch reservieren
      </Button>
    </div>
  );
}

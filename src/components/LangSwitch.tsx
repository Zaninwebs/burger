import { useEffect, useRef, useState } from "react";
import { LANGS, setLang, useI18n } from "../i18n";
import { ScrollTrigger } from "../lib/motion";
import "./LangSwitch.css";

/** Compact language menu: shows the current code, opens a list of the three languages. */
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLElement>(".lang__btn")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code: (typeof LANGS)[number]["code"]) => {
    setOpen(false);
    setLang(code);
    // text length changes move pinned sections: recalculate once the new text is painted
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  };

  return (
    <div ref={root} className={`lang ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="lang__btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("Sprache wählen")}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" />
        </svg>
        <span>{LANGS.find((l) => l.code === lang)?.label}</span>
      </button>
      <ul className="lang__list" hidden={!open}>
        {LANGS.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              lang={l.code}
              className={l.code === lang ? "is-active" : ""}
              aria-current={l.code === lang ? "true" : undefined}
              onClick={() => choose(l.code)}
            >
              <span className="lang__code">{l.label}</span>
              {l.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

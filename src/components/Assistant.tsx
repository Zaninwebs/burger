import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { answer, starterChips, type Answer, type AnswerItem } from "../lib/assistant";
import { formatPrice } from "../data/menu";
import { site } from "../data/site";
import Icon from "./Icon";
import "./Assistant.css";

interface Message {
  id: number;
  from: "user" | "bot";
  text: string;
  answer?: Answer;
}

interface NoteLine {
  key: string;
  no: string;
  name: string;
  size?: string;
  price: number;
  qty: number;
}

const welcome: Answer = {
  text: "Hallo! Ich bin der digitale Rialto-Assistent – ein Programm, kein Mensch. Ich finde Gerichte und Preise, helfe beim Aussuchen und schreibe Ihren Bestellzettel.",
  chips: starterChips,
};

const NOTE_KEY = "rialto-bestellzettel";
const NUDGE_KEY = "rialto-assistent-hinweis";

const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: the note simply isn't kept */
    }
  },
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Floating help chat. Answers come from lib/assistant.ts right in the browser,
 * so nothing a visitor types leaves their device.
 */
export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", text: welcome.text, answer: welcome }]);
  const [typing, setTyping] = useState(false);
  const [note, setNote] = useState<NoteLine[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [status, setStatus] = useState("");
  const nextId = useRef(1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelId = useId();

  // A small hint after a while, once per visit.
  useEffect(() => {
    if (store.get(NUDGE_KEY, false)) return;
    const t = window.setTimeout(() => setNudge(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  const noteLoaded = useRef(false);
  const openPanel = () => {
    setOpen(true);
    setNudge(false);
    store.set(NUDGE_KEY, true);
    // The note survives page changes within the visit (e.g. home → Speisekarte).
    if (!noteLoaded.current) {
      noteLoaded.current = true;
      setNote(store.get<NoteLine[]>(NOTE_KEY, []));
    }
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [messages, typing]);

  const updateNote = (next: NoteLine[]) => {
    setNote(next);
    store.set(NOTE_KEY, next);
  };

  const addToNote = (item: AnswerItem, option: AnswerItem["options"][number]) => {
    const key = `${item.key}-${option.label ?? ""}`;
    const existing = note.find((l) => l.key === key);
    updateNote(
      existing
        ? note.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        : [...note, { key, no: item.no, name: item.name, size: option.label, price: option.price, qty: 1 }],
    );
    setStatus(`${item.name}${option.label ? ` (${option.label})` : ""} gemerkt.`);
  };

  const changeQty = (key: string, delta: number) =>
    updateNote(note.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text }]);
    setTyping(true);
    const reply = answer(text);
    window.setTimeout(
      () => {
        setMessages((m) => [...m, { id: nextId.current++, from: "bot", text: reply.text, answer: reply }]);
        setTyping(false);
      },
      reducedMotion() ? 0 : 450,
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const last = messages[messages.length - 1];
  const count = note.reduce((n, l) => n + l.qty, 0);
  const total = note.reduce((n, l) => n + l.qty * l.price, 0);

  return (
    <>
      {nudge && !open && (
        <button type="button" className="assistant-nudge" onClick={openPanel}>
          Hunger, aber unentschlossen? <strong>Ich helfe beim Aussuchen.</strong>
        </button>
      )}
      <button
        ref={toggleRef}
        type="button"
        className={`assistant-toggle${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <Icon name={open ? "close" : "chat"} />
        <span className="assistant-toggle__label">{open ? "Schließen" : "Fragen?"}</span>
        <span className="sr-only">{open ? " – Assistent schließen" : " – Rialto-Assistent öffnen"}</span>
        {count > 0 && !open && (
          <span className="assistant-toggle__badge">
            {count}
            <span className="sr-only"> Gerichte auf dem Bestellzettel</span>
          </span>
        )}
      </button>

      <section id={panelId} className="assistant" role="dialog" aria-labelledby={titleId} hidden={!open}>
        <div className="assistant__head">
          <img src="/images/brand/rialto-logo-badge.webp" alt="" width="40" height="40" />
          <div>
            <h2 id={titleId} className="assistant__title">
              Rialto-Assistent
            </h2>
            <p className="assistant__sub">Digitaler Helfer · antwortet sofort</p>
          </div>
          <button type="button" className="assistant__close" onClick={close} aria-label="Assistent schließen">
            <Icon name="close" />
          </button>
        </div>

        <div className="assistant__log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((m) => (
            <div key={m.id} className={`assistant__msg assistant__msg--${m.from}`}>
              <p className="assistant__bubble">
                {m.from === "user" && <span className="sr-only">Sie: </span>}
                {m.text}
              </p>
              {m.answer?.items && (
                <ul className="assistant__items">
                  {m.answer.items.map((it) => (
                    <li key={it.key} className="assistant__item">
                      <span className="assistant__item-head">
                        {it.no && <span className="assistant__no">{it.no}</span>}
                        <span className="assistant__name">{it.name}</span>
                        <span className="assistant__cat">{it.category}</span>
                      </span>
                      {it.desc && <span className="assistant__desc">{it.desc}</span>}
                      <span className="assistant__add">
                        {it.options.map((o) => (
                          <button key={o.label ?? "x"} type="button" className="assistant__add-btn" onClick={() => addToNote(it, o)}>
                            <Icon name="plus" />
                            {o.label ? `${o.label} · ` : ""}
                            {formatPrice(o.price)} €
                            <span className="sr-only"> – {it.name} merken</span>
                          </button>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {m.answer?.links && (
                <div className="assistant__links">
                  {m.answer.links.map((l) => (
                    <a
                      key={l.href}
                      className="assistant__link"
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noopener" } : {})}
                      onClick={() => !l.external && l.href.startsWith("/") && setOpen(false)}
                    >
                      {l.label}
                      {l.external && <span className="sr-only"> (öffnet in neuem Tab)</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="assistant__msg assistant__msg--bot" aria-hidden="true">
              <p className="assistant__bubble assistant__typing">
                <span />
                <span />
                <span />
              </p>
            </div>
          )}
        </div>

        <p className="sr-only" role="status">
          {status}
        </p>

        {!typing && !noteOpen && last.from === "bot" && last.answer?.chips && (
          <div className="assistant__chips" role="group" aria-label="Vorschläge">
            {last.answer.chips.map((c) => (
              <button key={c} type="button" className="assistant__chip" onClick={() => ask(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {count > 0 && (
          <div className={`assistant__note-tray${noteOpen ? " is-open" : ""}`}>
            <button type="button" className="assistant__note-toggle" aria-expanded={noteOpen} onClick={() => setNoteOpen((o) => !o)}>
              <Icon name="note" />
              <span>
                Bestellzettel · {count} {count === 1 ? "Gericht" : "Gerichte"}
              </span>
              <strong>{formatPrice(total)} €</strong>
            </button>
            {noteOpen && (
              <div className="assistant__note">
                <ul>
                  {note.map((l) => (
                    <li key={l.key}>
                      <span className="assistant__note-name">
                        {l.no && <span className="assistant__no">{l.no}</span>}
                        {l.name}
                        {l.size && <span className="assistant__note-size"> {l.size}</span>}
                      </span>
                      <span className="assistant__qty">
                        <button type="button" onClick={() => changeQty(l.key, -1)} aria-label={`${l.name} einmal weniger`}>
                          <Icon name="minus" />
                        </button>
                        <span aria-label={`Anzahl ${l.qty}`}>{l.qty}×</span>
                        <button type="button" onClick={() => changeQty(l.key, 1)} aria-label={`${l.name} einmal mehr`}>
                          <Icon name="plus" />
                        </button>
                      </span>
                      <span className="assistant__note-price">{formatPrice(l.price * l.qty)} €</span>
                    </li>
                  ))}
                </ul>
                <p className="assistant__note-hint">
                  Rufen Sie an und nennen Sie einfach die Nummern. Summe ohne evtl. Liefergebühr.
                </p>
                <div className="assistant__note-actions">
                  <a className="assistant__link assistant__link--primary" href={site.phoneHref}>
                    <Icon name="phone" /> Jetzt anrufen
                  </a>
                  <button type="button" className="assistant__link" onClick={() => updateNote([])}>
                    Zettel leeren
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <form className="assistant__form" onSubmit={onSubmit}>
          <label htmlFor={`${panelId}-input`} className="sr-only">
            Ihre Frage
          </label>
          <input
            ref={inputRef}
            id={`${panelId}-input`}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="z. B. Pizza mit Thunfisch unter 10 €"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={200}
          />
          <button type="submit" className="assistant__send" disabled={!input.trim() || typing} aria-label="Frage senden">
            <Icon name="arrow" />
          </button>
        </form>
        <p className="assistant__foot">Automatische Antworten aus der Speisekarte. Allergene &amp; Sonderwünsche bitte telefonisch.</p>
      </section>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { dishId, formatEuro, ORDERABLE, type OrderErrors, type PaymentMethod } from "../../shared/orders";
import { berlinNow, addDays } from "../../shared/reservations";
import { business } from "../data/content";
import { api, ApiError, formatDateLong, IS_DEMO, type OrderConfig, type PublicOrder } from "../lib/api";
import { cartStore, useCart } from "../lib/cart";
import { gsap, prefersReducedMotion, scrollToHash, stopScroll } from "../lib/motion";
import { site } from "../lib/paths";
import { ClockIcon, PinIcon } from "./Icons";
import { Button, Lines, revealOnScroll, useGsap } from "./ui";
import "./Order.css";

// ------------------------------------------------------------- menu button

/** "+" next to a dish; turns into a quantity stepper once the dish is in the basket. */
export function AddToCart({ category, name }: { category: string; name: string }) {
  const id = dishId(category, name);
  const { cart } = useCart();
  if (!ORDERABLE.has(id)) return null;
  const qty = cart[id] ?? 0;
  if (!qty)
    return (
      <button type="button" className="add-btn" onClick={() => cartStore.add(id)} aria-label={`${name} zur Abholung hinzufügen`} data-cursor="Add">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>
    );
  return <Stepper id={id} name={name} qty={qty} />;
}

function Stepper({ id, name, qty }: { id: string; name: string; qty: number }) {
  return (
    <span className="stepper" role="group" aria-label={`Menge ${name}`}>
      <button type="button" onClick={() => cartStore.setQty(id, qty - 1)} aria-label={`${name}: eins weniger`}>
        −
      </button>
      <span className="stepper__n" aria-live="polite">
        {qty}
      </span>
      <button type="button" onClick={() => cartStore.add(id)} aria-label={`${name}: eins mehr`}>
        +
      </button>
    </span>
  );
}

// --------------------------------------------------------------- section

/** "Essen zum Abholen" — explains the service and leads to the menu. */
export function Pickup() {
  const root = useRef<HTMLElement>(null);
  const { count } = useCart();

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    revealOnScroll(q(".pickup__title .line-mask > span"), root.current!);
    gsap.from(q(".pickup-fact"), {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".pickup__facts")[0], start: "top 85%", once: true },
    });
  });

  return (
    <section id="abholen" ref={root} className="pickup" aria-labelledby="pickup-title">
      <div className="container pickup__inner">
        <p className="label eyebrow label--gold">Da Asporto</p>
        <h2 id="pickup-title" className="h2 pickup__title">
          <Lines lines={["Essen zum", <em key="a">Abholen.</em>]} />
        </h2>
        <p className="pickup__lead">
          Gerichte online auswählen und zur gewünschten Zeit bei uns am Wiesdorfer Platz abholen — frisch zubereitet, ohne Wartezeit. Wir liefern nicht.
        </p>
        <ul className="pickup__facts">
          <li className="pickup-fact">
            <span className="pickup-fact__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 7h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 7Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
            </span>
            <strong>Gerichte wählen</strong>
            <span>In der Speisekarte auf + tippen.</span>
          </li>
          <li className="pickup-fact">
            <span className="pickup-fact__icon" aria-hidden="true">
              <ClockIcon />
            </span>
            <strong>Abholzeit festlegen</strong>
            <span>Heute oder an einem der nächsten Tage.</span>
          </li>
          <li className="pickup-fact">
            <span className="pickup-fact__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18M7 15h3" />
              </svg>
            </span>
            <strong>Bar oder online zahlen</strong>
            <span>Bei Abholung an der Theke oder vorab online.</span>
          </li>
          <li className="pickup-fact">
            <span className="pickup-fact__icon" aria-hidden="true">
              <PinIcon />
            </span>
            <strong>Nur Abholung</strong>
            <span>
              {business.street}, {business.city}. Kein Lieferdienst.
            </span>
          </li>
        </ul>
        <div className="pickup__cta">
          {count > 0 ? (
            <Button variant="gold" onClick={() => cartStore.open()} cursor="Order">
              Zur Abholung
            </Button>
          ) : (
            <Button href="#speisekarte" variant="gold" cursor="Menu">
              Zur Speisekarte
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------------- cart bar

/** Floating basket summary; shown as soon as something is in the basket. */
export function CartBar() {
  const { count, totalCents } = useCart();
  // back from online payment: ?bestellung=<id> opens the drawer with the result
  const [returning] = useState(() => new URLSearchParams(location.search).get("bestellung"));
  const [drawer, setDrawer] = useState(() => Boolean(returning));
  useEffect(() => cartStore.onOpen(() => setDrawer(true)), []);

  return (
    <>
      <div className={`cart-bar ${count > 0 && !drawer ? "is-visible" : ""}`} inert={count === 0 || drawer}>
        <button type="button" className="cart-bar__btn" onClick={() => setDrawer(true)} data-cursor="Order">
          <span className="cart-bar__count" aria-hidden="true">
            {count}
          </span>
          <span className="cart-bar__label">Zum Abholen</span>
          <span className="cart-bar__total">{formatEuro(totalCents)}</span>
          <span className="sr-only">
            , {count} {count === 1 ? "Artikel" : "Artikel"}
          </span>
        </button>
      </div>
      <OrderDrawer open={drawer} onClose={() => setDrawer(false)} returningId={returning} />
    </>
  );
}

// ---------------------------------------------------------------- drawer

const EMPTY = { name: "", phone: "", email: "", note: "", slot: "", website: "" };

function dayLabel(date: string): string {
  const today = berlinNow().date;
  if (date === today) return "Heute";
  if (date === addDays(today, 1)) return "Morgen";
  return formatDateLong(date).split(",")[0];
}

function OrderDrawer({ open, onClose, returningId }: { open: boolean; onClose: () => void; returningId: string | null }) {
  const panel = useRef<HTMLDivElement>(null);
  const { lines, totalCents, count } = useCart();
  const [cfg, setCfg] = useState<OrderConfig | null>(null);
  const [cfgError, setCfgError] = useState("");
  const [f, setF] = useState(EMPTY);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [formError, setFormError] = useState("");
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [done, setDone] = useState<PublicOrder | null>(null);
  const [cancelled, setCancelled] = useState(false);

  // load pickup times whenever the drawer opens
  useEffect(() => {
    if (!open || phase !== "form") return;
    setCfgError("");
    api
      .orderConfig()
      .then(setCfg)
      .catch((e) => setCfgError(e instanceof ApiError ? e.message : "Die Abholung ist gerade nicht erreichbar."));
  }, [open, phase]);

  // return from Stripe
  useEffect(() => {
    if (!returningId) return;
    const params = new URLSearchParams(location.search);
    history.replaceState(null, "", location.pathname + location.hash);
    api
      .orderStatus(returningId)
      .then((o) => {
        if (o.paymentStatus === "paid") cartStore.clear();
        else if (params.get("abgebrochen")) setCancelled(true);
        setDone(o);
        setPhase("done");
      })
      .catch(() => setFormError("Die Abholung konnte nicht geladen werden. Bitte rufen Sie uns an."));
  }, [returningId]);

  // scroll lock, ESC, focus
  useEffect(() => {
    if (!open) return;
    stopScroll(true);
    const prev = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>(".drawer__close")?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>("button, a, input, select, textarea")].filter((el) => !el.hasAttribute("disabled"));
      const first = els[0];
      const last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    if (!prefersReducedMotion() && panel.current)
      gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: "expo.out" });
    return () => {
      document.removeEventListener("keydown", onKey);
      stopScroll(false);
      prev?.focus?.();
    };
  }, [open, onClose]);

  const change = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setF((x) => ({ ...x, [k]: value }));
    const field = k === "slot" ? "time" : k;
    setErrors((x) => ({ ...x, [field]: undefined }));
    setFormError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    const [date = "", time = ""] = f.slot.split(" ");
    const input = {
      items: lines.map((l) => ({ id: l.id, qty: l.qty })),
      date,
      time,
      name: f.name,
      phone: f.phone,
      email: f.email,
      note: f.note,
      payment,
      consent,
      website: f.website,
    };
    const v: OrderErrors = {};
    if (!lines.length) v.items = "Bitte wählen Sie mindestens ein Gericht.";
    if (!f.slot) v.time = "Bitte wählen Sie eine Abholzeit.";
    if (f.name.trim().length < 2) v.name = "Bitte geben Sie Ihren Namen an.";
    if ((f.phone.match(/\d/g) ?? []).length < 6) v.phone = "Bitte geben Sie eine gültige Telefonnummer an.";
    if (payment === "online" && !f.email.trim()) v.email = "Für die Online-Zahlung benötigen wir Ihre E-Mail-Adresse.";
    if (!consent) v.consent = "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.";
    setErrors(v);
    if (Object.keys(v).length) {
      setFormError("Bitte prüfen Sie die markierten Felder.");
      const first = ["time", "name", "phone", "email", "consent"].find((k) => v[k as keyof OrderErrors]);
      panel.current?.querySelector<HTMLElement>(`[name="${first === "time" ? "slot" : first}"]`)?.focus();
      return;
    }
    setPhase("sending");
    setFormError("");
    try {
      const o = await api.order(input);
      if (o.checkoutUrl) {
        location.href = o.checkoutUrl; // Stripe Checkout
        return;
      }
      cartStore.clear();
      setDone(o);
      setPhase("done");
    } catch (err) {
      setPhase("form");
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields as OrderErrors);
        setFormError(err.message);
      } else setFormError("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    }
  };

  const payCash = async () => {
    if (!done) return;
    try {
      const o = await api.payCash(done.id);
      cartStore.clear();
      setCancelled(false);
      setDone(o);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Es ist ein Fehler aufgetreten.");
    }
  };

  const close = () => {
    onClose();
    if (phase === "done" && !cancelled) {
      setPhase("form");
      setDone(null);
      setF(EMPTY);
      setConsent(false);
    }
  };

  const err = (k: keyof OrderErrors) =>
    errors[k] ? (
      <p id={`o-${k}-err`} className="field-error" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof OrderErrors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `o-${k}-err` : undefined });

  if (!open) return null;
  const paused = cfg && !cfg.enabled;
  const noSlots = cfg && cfg.enabled && cfg.slots.length === 0;

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button type="button" className="drawer__scrim" aria-label="Abholung schließen" tabIndex={-1} onClick={close} />
      <div className="drawer__panel" ref={panel} data-lenis-prevent>
        <header className="drawer__head">
          <p id="drawer-title" className="drawer__title serif">
            {phase === "done" ? "Ihre Abholung" : <>Zum <em>Abholen</em></>}
          </p>
          <button type="button" className="drawer__close" onClick={close} aria-label="Schließen">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>

        {phase === "done" && done ? (
          <OrderDone order={done} cancelled={cancelled} onCash={payCash} error={formError} onClose={close} />
        ) : (
          <form className="drawer__body resv-form" onSubmit={submit} noValidate>
            {/* basket */}
            <section className="basket" aria-label="Warenkorb">
              {lines.length === 0 ? (
                <div className="basket__empty">
                  <p>Ihr Warenkorb ist noch leer.</p>
                  <Button
                    small
                    variant="ghost"
                    className="on-dark"
                    onClick={() => {
                      close();
                      setTimeout(() => scrollToHash("#speisekarte"), 50);
                    }}
                  >
                    Zur Speisekarte
                  </Button>
                </div>
              ) : (
                <ul className="basket__list">
                  {lines.map((l) => (
                    <li key={l.id} className="basket__line">
                      <div>
                        <p className="basket__name">{l.name}</p>
                        <p className="basket__unit muted">{formatEuro(l.cents)}</p>
                      </div>
                      <Stepper id={l.id} name={l.name} qty={l.qty} />
                      <p className="basket__sum">{formatEuro(l.qty * l.cents)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {err("items")}
              {lines.length > 0 && (
                <p className="basket__total">
                  <span>Summe</span>
                  <strong>{formatEuro(totalCents)}</strong>
                </p>
              )}
            </section>

            {cfgError && <p className="form-error">{cfgError}</p>}
            {paused && (
              <p className="form-error">
                Online-Abholung ist gerade pausiert. Rufen Sie uns gerne an: <strong>{business.phoneDisplay}</strong>
              </p>
            )}
            {noSlots && (
              <p className="form-error">
                Für heute und die nächsten Tage sind keine Abholzeiten mehr frei. Bitte rufen Sie uns an: {business.phoneDisplay}
              </p>
            )}

            {lines.length > 0 && cfg?.enabled && !noSlots && (
              <>
                <div className={`field ${errors.time ? "has-error" : ""}`}>
                  <label htmlFor="o-slot">Abholzeit</label>
                  <select id="o-slot" name="slot" value={f.slot} onChange={change("slot")} {...aria("time")}>
                    <option value="">Uhrzeit wählen</option>
                    {cfg.slots.map((d) => (
                      <optgroup key={d.date} label={`${dayLabel(d.date)} · ${formatDateLong(d.date).split(", ")[1]}`}>
                        {d.times.map((t) => (
                          <option key={t} value={`${d.date} ${t}`}>
                            {dayLabel(d.date)}, {t} Uhr
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="field-hint">Zubereitung ca. {cfg.leadMinutes} Minuten · Abholung im Restaurant</p>
                  {err("time")}
                </div>

                <div className={`field ${errors.name ? "has-error" : ""}`}>
                  <label htmlFor="o-name">Name</label>
                  <input id="o-name" name="name" autoComplete="name" placeholder="Für die Abholung" value={f.name} onChange={change("name")} maxLength={80} {...aria("name")} />
                  {err("name")}
                </div>
                <div className={`field ${errors.phone ? "has-error" : ""}`}>
                  <label htmlFor="o-phone">Telefon</label>
                  <input id="o-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Für Rückfragen" value={f.phone} onChange={change("phone")} maxLength={24} {...aria("phone")} />
                  {err("phone")}
                </div>
                <div className={`field ${errors.email ? "has-error" : ""}`}>
                  <label htmlFor="o-email">E-Mail {payment === "cash" && <span className="field-opt">(optional)</span>}</label>
                  <input id="o-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="Für die Bestätigung" value={f.email} onChange={change("email")} maxLength={120} {...aria("email")} />
                  {err("email")}
                </div>
                <div className={`field ${errors.note ? "has-error" : ""}`}>
                  <label htmlFor="o-note">Hinweis</label>
                  <textarea id="o-note" name="note" rows={2} placeholder="Allergien, Wünsche …" value={f.note} onChange={change("note")} maxLength={400} {...aria("note")} />
                  {err("note")}
                </div>

                <fieldset className="pay">
                  <legend>Bezahlung</legend>
                  <label className={`pay__opt ${payment === "cash" ? "is-active" : ""}`}>
                    <input type="radio" name="payment" value="cash" checked={payment === "cash"} onChange={() => setPayment("cash")} />
                    <span className="pay__title">Bar bei Abholung</span>
                    <span className="pay__desc">Sie bezahlen an der Theke.</span>
                  </label>
                  <label className={`pay__opt ${payment === "online" ? "is-active" : ""} ${cfg.onlinePayment ? "" : "is-disabled"}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={payment === "online"}
                      disabled={!cfg.onlinePayment}
                      onChange={() => setPayment("online")}
                    />
                    <span className="pay__title">Online bezahlen</span>
                    <span className="pay__desc">
                      {cfg.onlinePayment ? "Karte, PayPal, Apple Pay oder Google Pay — sicher vorab." : "Derzeit nicht verfügbar."}
                    </span>
                  </label>
                  {err("payment")}
                </fieldset>

                <div className="hp" aria-hidden="true">
                  <label htmlFor="o-website">Website</label>
                  <input id="o-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={change("website")} />
                </div>

                <label className={`consent ${errors.consent ? "has-error" : ""}`}>
                  <input
                    type="checkbox"
                    name="consent"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((x) => ({ ...x, consent: undefined }));
                    }}
                  />
                  <span className="consent__box" aria-hidden="true" />
                  <span>
                    Ich bin einverstanden, dass meine Angaben zur Abwicklung der Abholung gespeichert werden (
                    <a className="link link--static" href={site("datenschutz/index.html")} target="_blank" rel="noopener">
                      Datenschutz
                    </a>
                    ).
                  </span>
                </label>
                {err("consent")}
              </>
            )}

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            {lines.length > 0 && cfg?.enabled && !noSlots && (
              <div className="drawer__foot">
                <Button type="submit" variant="gold" disabled={phase === "sending"} className="resv-form__submit" cursor="Order">
                  {phase === "sending"
                    ? payment === "online"
                      ? "Weiter zur Zahlung …"
                      : "Wird gesendet …"
                    : payment === "online"
                      ? `Online bezahlen · ${formatEuro(totalCents)}`
                      : `Abholung abschicken · ${formatEuro(totalCents)}`}
                </Button>
                <p className="drawer__fine muted">
                  {count} {count === 1 ? "Artikel" : "Artikel"} · Nur Abholung, keine Lieferung · Preise inkl. MwSt.
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function OrderDone({
  order,
  cancelled,
  onCash,
  error,
  onClose,
}: {
  order: PublicOrder;
  cancelled: boolean;
  onCash: () => void;
  error: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.from(ref.current.children, { opacity: 0, y: 20, stagger: 0.07, duration: 0.9, ease: "expo.out" });
  }, [order.paymentStatus]);

  if (order.paymentStatus === "open")
    return (
      <div className="drawer__body order-done" ref={ref}>
        <p className="label label--gold">{cancelled ? "Zahlung abgebrochen" : "Zahlung ausstehend"}</p>
        <p className="h3">Ihre Abholung ist noch nicht bezahlt.</p>
        <p className="muted">Möchten Sie stattdessen bar bei Abholung bezahlen? Dann geben wir sie jetzt an die Küche weiter.</p>
        {error && <p className="form-error">{error}</p>}
        <Button variant="gold" onClick={onCash}>
          Bar bei Abholung bezahlen
        </Button>
      </div>
    );

  return (
    <div className="drawer__body order-done" ref={ref}>
      <p className="label label--gold">Abholung eingegangen</p>
      <p className="order-done__title h2">
        <em>Grazie</em>, {order.name.split(" ")[0]}.
      </p>
      <div className="order-done__code">
        <span className="label">Ihre Abholnummer</span>
        <strong>{order.code}</strong>
      </div>
      <p className="order-done__when">
        {dayLabel(order.date)}, {order.time} Uhr · {business.street}
      </p>
      <ul className="order-done__lines">
        {order.lines.map((l) => (
          <li key={l.id}>
            <span>
              {l.qty} × {l.name}
            </span>
            <span>{formatEuro(l.qty * l.cents)}</span>
          </li>
        ))}
        <li className="order-done__sum">
          <span>{order.paymentStatus === "paid" ? "Bezahlt" : "Bar bei Abholung"}</span>
          <strong>{formatEuro(order.totalCents)}</strong>
        </li>
      </ul>
      <p className="muted">Nennen Sie an der Theke einfach Ihre Abholnummer. Bei Fragen erreichen Sie uns unter {business.phoneDisplay}.</p>
      {IS_DEMO && <p className="resv-demo">Demo-Version: Diese Abholung wurde nicht wirklich gesendet{order.payment === "online" ? ", die Zahlung ist simuliert" : ""}.</p>}
      <Button variant="ghost" className="on-dark" small onClick={onClose}>
        Schließen
      </Button>
    </div>
  );
}

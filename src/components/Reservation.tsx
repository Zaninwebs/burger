import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, addDays, berlinNow, validateReservation, type FieldErrors } from "../../shared/reservations";
import { business } from "../data/content";
import { api, ApiError, formatDateLong, IS_DEMO } from "../lib/api";
import { getLang, translate, useI18n } from "../i18n";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { site } from "../lib/paths";
import { OCCASION_EVENT } from "./Events";
import { Button, Lines, revealOnScroll, useGsap } from "./ui";
import "./Reservation.css";

const EMPTY = { name: "", phone: "", date: "", time: "", guests: "", email: "", message: "", website: "" };

export default function Reservation() {
  const { t, locale } = useI18n();
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [f, setF] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const maxParty = DEFAULT_SETTINGS.maxPartySize;
  const { openFrom, openUntil } = DEFAULT_SETTINGS;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [phase, setPhase] = useState<"form" | "sending" | "sent">("form");

  const today = berlinNow().date;
  const lastDay = addDays(today, DEFAULT_SETTINGS.bookingHorizonDays);

  useGsap(root, ({ reduced, q }) => {
    if (reduced) return;
    revealOnScroll(q(".resv__title .line-mask > span"), q(".resv__intro")[0]);
    gsap.from(q(".resv__card"), {
      y: 60,
      opacity: 0,
      duration: 1.3,
      ease: "expo.out",
      scrollTrigger: { trigger: q(".resv__card")[0], start: "top 90%", once: true },
    });
  });

  // "Feier anfragen" starts the message for the guest
  useEffect(() => {
    const on = () => setF((x) => ({ ...x, message: x.message || translate(getLang(), "Anfrage für eine Feier: ") }));
    window.addEventListener(OCCASION_EVENT, on);
    return () => window.removeEventListener(OCCASION_EVENT, on);
  }, []);

  const change = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setF((x) => ({ ...x, [k]: value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
    setFormError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    const input = { ...f, guests: Number(f.guests), occasion: "", consent };
    const v = validateReservation(input, { ...DEFAULT_SETTINGS, maxPartySize: maxParty });
    setErrors(v);
    if (Object.keys(v).length) {
      const first = ["name", "phone", "date", "time", "guests", "email", "message", "consent"].find((k) => v[k as keyof FieldErrors]);
      root.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      setFormError("Bitte prüfen Sie die markierten Felder.");
      return;
    }
    setPhase("sending");
    setFormError("");
    try {
      await api.reserve(input);
      setPhase("sent");
    } catch (err) {
      setPhase("form");
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields);
        setFormError(err.message);
      } else setFormError("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
    }
  };

  useEffect(() => {
    if (phase !== "sent" || !card.current) return;
    card.current.focus();
    if (!prefersReducedMotion())
      gsap.from(card.current.querySelectorAll(".resv-done > *"), { opacity: 0, y: 20, stagger: 0.07, duration: 0.9, ease: "expo.out" });
  }, [phase]);

  const reset = () => {
    setF(EMPTY);
    setConsent(false);
    setPhase("form");
  };

  const err = (k: keyof FieldErrors) =>
    errors[k] ? (
      <p id={`r-${k}-err`} className="field-error" role="alert">
        {t(errors[k]!)}
      </p>
    ) : null;
  const aria = (k: keyof FieldErrors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `r-${k}-err` : undefined });

  return (
    <section id="reservieren" ref={root} className="resv" aria-labelledby="resv-title">
      <div className="container resv__grid">
        <div className="resv__intro">
          <p className="label eyebrow label--gold">Prenotazione</p>
          <h2 id="resv-title" className="h2 resv__title">
            <Lines lines={[t("Tisch"), <em key="r">{t("reservieren.")}</em>]} />
          </h2>
          <p className="resv__lead">
            {t("Füllen Sie das Formular aus – wir bestätigen Ihre Reservierung telefonisch oder per E-Mail. Für Gruppen über {n} Personen rufen Sie uns bitte an:", { n: maxParty })}{" "}
            <strong>{business.phoneDisplay}</strong>
          </p>
          <p className="resv__hours">
            {t("Reservierungen zwischen {from} und {until} Uhr", { from: openFrom, until: openUntil })}
          </p>
        </div>

        <div className="resv__card" ref={card} tabIndex={-1} aria-live="polite">
          {phase === "sent" ? (
            <div className="resv-done">
              <p className="label label--gold">{t("Anfrage gesendet")}</p>
              <p className="resv-done__title h2">
                <em>Grazie</em>, {f.name.split(" ")[0]}.
              </p>
              <p className="resv-done__summary">
                {formatDateLong(f.date, locale)} · {t("{time} Uhr", { time: f.time })} · {f.guests} {f.guests === "1" ? t("Person") : t("Personen")}
              </p>
              <p className="muted">
                {t("Wir melden uns zur Bestätigung. Bis dahin ist die Reservierung noch nicht verbindlich.")}
              </p>
              {IS_DEMO && <p className="resv-demo">{t("Demo-Version: Diese Anfrage wurde nicht wirklich gesendet.")}</p>}
              <Button onClick={reset} variant="ghost" className="on-dark" small>
                {t("Weitere Anfrage")}
              </Button>
            </div>
          ) : (
            <form className="resv-form" onSubmit={submit} noValidate>
              <div className={`field ${errors.name ? "has-error" : ""}`}>
                <label htmlFor="r-name">{t("Name")}</label>
                <input id="r-name" name="name" autoComplete="name" placeholder={t("Vor- und Nachname")} value={f.name} onChange={change("name")} maxLength={80} {...aria("name")} />
                {err("name")}
              </div>

              <div className={`field ${errors.phone ? "has-error" : ""}`}>
                <label htmlFor="r-phone">{t("Telefon")}</label>
                <input id="r-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t("Für Rückfragen")} value={f.phone} onChange={change("phone")} maxLength={24} {...aria("phone")} />
                {err("phone")}
              </div>

              <div className="field-row">
                <div className={`field ${errors.date ? "has-error" : ""}`}>
                  <label htmlFor="r-date">{t("Datum")}</label>
                  <input id="r-date" name="date" type="date" min={today} max={lastDay} value={f.date} onChange={change("date")} {...aria("date")} />
                  {err("date")}
                </div>

                <div className={`field ${errors.time ? "has-error" : ""}`}>
                  <label htmlFor="r-time">{t("Uhrzeit")}</label>
                  <input
                    id="r-time"
                    name="time"
                    type="time"
                    min={openFrom}
                    max={openUntil}
                    step={900}
                    value={f.time}
                    onChange={change("time")}
                    {...aria("time")}
                  />
                  {err("time")}
                </div>
              </div>

              <div className={`field ${errors.guests ? "has-error" : ""}`}>
                <label htmlFor="r-guests">{t("Personen")}</label>
                <select id="r-guests" name="guests" value={f.guests} onChange={change("guests")} {...aria("guests")}>
                  <option value="">{t("Anzahl wählen")}</option>
                  {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? t("Person") : t("Personen")}
                    </option>
                  ))}
                </select>
                {err("guests")}
              </div>

              <div className={`field ${errors.email ? "has-error" : ""}`}>
                <label htmlFor="r-email">{t("E-Mail")}</label>
                <input id="r-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder={t("Für die Bestätigung")} value={f.email} onChange={change("email")} maxLength={120} {...aria("email")} />
                {err("email")}
              </div>

              <div className={`field ${errors.message ? "has-error" : ""}`}>
                <label htmlFor="r-message">{t("Anmerkungen")}</label>
                <textarea id="r-message" name="message" rows={3} placeholder={t("Allergien, Wünsche, Anlass …")} value={f.message} onChange={change("message")} maxLength={600} {...aria("message")} />
                {err("message")}
              </div>

              {/* honeypot — hidden from people, filled by bots */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="r-website">Website</label>
                <input id="r-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={change("website")} />
              </div>

              <label className={`consent ${errors.consent ? "has-error" : ""}`}>
                <input
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setErrors((x) => ({ ...x, consent: undefined }));
                    setFormError("");
                  }}
                />
                <span className="consent__box" aria-hidden="true" />
                <span>
                  {t("Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden")} (
                  <a className="link link--static" href={site("datenschutz/index.html")} target="_blank" rel="noopener">
                    {t("Datenschutz")}
                  </a>
                  ).
                </span>
              </label>
              {err("consent")}

              {formError && (
                <p className="form-error" role="alert">
                  {t(formError)}
                </p>
              )}
              <Button type="submit" variant="gold" disabled={phase === "sending"} cursor="Reserve" className="resv-form__submit">
                {phase === "sending" ? t("Wird gesendet …") : t("Reservierung anfragen")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

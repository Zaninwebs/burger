import { berlinNow, toMinutes } from "../../shared/reservations";
import { hours } from "../data/content";
import { getLang, translate, type Lang } from "../i18n";

const DAY = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export type OpenStatus = { state: "open" | "closed" | "unknown"; text: string };

function rowFor(weekday: number) {
  return hours.find((h) => h.weekdays.includes(weekday));
}

function span(time: string): [number, number] {
  const [from, to] = time.split("–").map((s) => toMinutes(s.trim()));
  return [from, to];
}

/** Live opening status in the restaurant's time zone (Europe/Berlin). */
export function openStatus(date = new Date(), lang: Lang = getLang()): OpenStatus {
  const t = (de: string, vars?: Record<string, string>) => translate(lang, de, vars);
  const now = berlinNow(date);
  const wd = new Date(`${now.date}T12:00:00Z`).getUTCDay();
  const today = rowFor(wd);

  if (!today?.time) return { state: "unknown", text: t("{day}: Öffnungszeiten bitte telefonisch erfragen", { day: t(DAY[wd]) }) };

  const [from, to] = span(today.time);
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  if (now.minutes >= from && now.minutes < to) return { state: "open", text: t("Jetzt geöffnet · schließt um {time} Uhr", { time: fmt(to) }) };
  if (now.minutes < from) return { state: "closed", text: t("Geschlossen · öffnet heute um {time} Uhr", { time: fmt(from) }) };

  const nextWd = (wd + 1) % 7;
  const next = rowFor(nextWd);
  if (!next?.time) return { state: "closed", text: t("Geschlossen · {day}: bitte telefonisch erfragen", { day: t(DAY[nextWd]) }) };
  return { state: "closed", text: t("Geschlossen · öffnet morgen um {time} Uhr", { time: fmt(span(next.time)[0]) }) };
}

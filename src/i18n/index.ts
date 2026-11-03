// Site languages. German is the source language: every UI string is written
// in German and looked up by that German text in the dictionaries below, so a
// missing translation simply shows the German original.
//
// The visitor's choice is kept in localStorage; ?lang=en / ?lang=it in the
// URL selects a language directly (e.g. for a link sent to a guest).
import { useSyncExternalStore } from "react";
import { en } from "./en";
import { it } from "./it";

export type Lang = "de" | "en" | "it";
export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "en", label: "EN", name: "English" },
  { code: "it", label: "IT", name: "Italiano" },
];
export const LOCALE: Record<Lang, string> = { de: "de-DE", en: "en-GB", it: "it-IT" };

const DICTS: Record<Exclude<Lang, "de">, Record<string, string>> = { en, it };
const KEY = "cd-lang";
const isLang = (v: unknown): v is Lang => v === "de" || v === "en" || v === "it";

function initial(): Lang {
  if (typeof window === "undefined") return "de";
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* private mode */
  }
  return "de";
}

let lang: Lang = initial();
const listeners = new Set<() => void>();

function apply() {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}
apply();

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode */
  }
  // keep a shared ?lang= link in step with the choice
  const url = new URL(location.href);
  if (url.searchParams.has("lang")) {
    url.searchParams.set("lang", next);
    history.replaceState(history.state, "", url);
  }
  apply();
  listeners.forEach((l) => l());
}

/** Translates German source text into the given language; {name} placeholders are filled from vars. */
export function translate(l: Lang, de: string, vars?: Record<string, string | number>): string {
  let s = l === "de" ? de : (DICTS[l][de] ?? de);
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export type T = (de: string, vars?: Record<string, string | number>) => string;

export function useI18n(): { lang: Lang; t: T; locale: string } {
  const l = useSyncExternalStore(subscribe, getLang, getLang);
  return { lang: l, t: (de, vars) => translate(l, de, vars), locale: LOCALE[l] };
}

export function onLangChange(fn: () => void) {
  return subscribe(fn);
}

// Every German UI string must have an English and an Italian translation.
//   npm test
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

const { en } = await import("../src/i18n/en.ts");
const { it } = await import("../src/i18n/it.ts");
const { story, events, hours, nav } = await import("../src/data/content.ts");
const { menu, MENU_NOTE } = await import("../src/data/menu.ts");
const { DEFAULT_SETTINGS, validateReservation } = await import("../shared/reservations.ts");
const { validateOrder } = await import("../shared/orders.ts");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "admin" || e.name === "legal" || e.name === "i18n" ? [] : sources(p);
    return /\.(tsx?|ts)$/.test(e.name) ? [p] : [];
  });
}

const unescape = (s: string) => JSON.parse(`"${s}"`) as string;
const files = sources("src").map((f) => readFileSync(f, "utf8"));

// t("…") and translate(lang, "…") calls
const literal = files.flatMap((src) =>
  [...src.matchAll(/\b(?:t|translate\([^,]+,)\(?\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1])),
);
// German text kept in component data (captions, alt texts)
const fields = files.flatMap((src) =>
  [...src.matchAll(/\b(?:alt|german|line): "((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1])),
);
const data = [
  story.lead,
  ...story.body,
  ...story.facts.flatMap((f) => [f.label, f.sub]),
  events.lead,
  ...events.occasions,
  ...hours.flatMap((h) => [h.days, h.short, h.note ?? ""]),
  ...nav.map((n) => n.label),
  MENU_NOTE,
  ...menu.flatMap((c) => [c.label, c.intro ?? "", ...c.dishes.map((d) => d.description ?? "")]),
  ...["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  ...Object.values(validateReservation({}, DEFAULT_SETTINGS)),
  ...Object.values(validateOrder({ payment: "online", time: "x" }, DEFAULT_SETTINGS)),
];
// names that stay as they are in every language
const SAME = new Set(["", "Leverkusen", "Restaurant", "Pizza", "Pasta", "Name"]);
const keys = [...new Set([...literal, ...fields, ...data])].filter(Boolean);

describe("translations", () => {
  test("found the UI strings", () => {
    assert.ok(keys.length > 200, `only ${keys.length} keys found`);
  });

  for (const [code, dict] of [
    ["en", en],
    ["it", it],
  ] as const) {
    test(`${code}: every German string is translated`, () => {
      const missing = keys.filter((k) => !SAME.has(k) && !(k in dict));
      assert.deepEqual(missing, []);
    });
    test(`${code}: placeholders match`, () => {
      for (const [de, tr] of Object.entries(dict)) {
        const ph = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort().join();
        assert.equal(ph(tr), ph(de), `${code}: ${de}`);
      }
    });
  }

  test("en and it cover the same strings", () => {
    assert.deepEqual(Object.keys(en).sort(), Object.keys(it).sort());
  });
});

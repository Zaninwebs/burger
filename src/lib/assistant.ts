/**
 * Rialto assistant: answers visitors' questions in the browser, using only the
 * facts on this site (menu, prices, opening hours, address, phone).
 * Nothing is sent to a server, and it never makes up information: anything it
 * does not know is handed to the phone.
 */
import { menu, formatPrice, findItem, type MenuCategory, type MenuItem } from "../data/menu";
import { site, weekOrder, dayNames } from "../data/site";
import { getOpenStatus, formatSlots, hoursSummary } from "./hours";

export interface AnswerItem {
  key: string;
  no: string;
  name: string;
  desc?: string;
  price: string;
  category: string;
  /** Orderable variants (one per size for pizza and salads). */
  options: { label?: string; price: number }[];
}

export interface AnswerLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface Answer {
  text: string;
  items?: AnswerItem[];
  links?: AnswerLink[];
  chips?: string[];
}

export const starterChips = [
  "Überrasch mich!",
  "Habt ihr jetzt geöffnet?",
  "Wir sind 4 Personen, 40 €",
  "Günstigste Pizza",
  "Liefert ihr?",
  "Wo seid ihr?",
];

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");

const addressLine = `${site.address.street}, ${site.address.postalCode} ${site.address.city}-${site.address.district}`;

const phoneLink: AnswerLink = { label: `Anrufen: ${site.phoneDisplay}`, href: site.phoneHref };
const onlineLink: AnswerLink[] = site.onlineOrder
  ? [{ label: `Online bei ${site.onlineOrder.label}`, href: site.onlineOrder.url, external: true }]
  : [];
const categoryLink = (c: MenuCategory): AnswerLink => ({ label: `${c.title} ansehen`, href: `/speisekarte/#kategorie-${c.id}` });

/** Words (normalized) that point to a menu category. */
const categoryWords: Record<string, string[]> = {
  pizza: ["pizza", "pizzen"],
  pizzabroetchen: ["pizzabrotchen", "pizzabroetchen", "brotchen"],
  pasta: ["pasta", "nudel", "spaghetti", "tortellini", "lasagne", "rigatoni", "tagliatelle"],
  doener: ["doner", "doener", "dueruem", "durum", "grill", "turkische pizza", "lahmacun"],
  falafel: ["falafel", "vegetarisch", "veggie"],
  schnitzel: ["schnitzel"],
  burger: ["burger"],
  "nuggets-wings": ["nugget", "wings", "chicken wings"],
  auflaeufe: ["auflauf", "auflaufe", "uberbacken"],
  baguettes: ["baguette"],
  salate: ["salat"],
  kids: ["kinder", "kids", "kind"],
  dessert: ["dessert", "nachtisch", "eis", "suss"],
  getraenke: ["getrank", "trinken", "cola", "bier", "wein", "wasser"],
};

const stopwords = new Set(
  "habt ihr gibt es was kostet kosten die der das den dem des ein eine einen einem mit und oder ich mochte moechte bitte auch haben sie welche welcher welches wie viel preis preise gerne mal zeig zeigen mir alle von fur fuer bei beim im in am an auf zu euro eur gibts hab hast habe ist sind wir uns euch man kann konnen gern noch so ganz gut gute guten etwas was's welchen sucht suche such nach dann lieber doch eher heute jetzt mochten wollen will hatte hatten gern".split(
    " ",
  ),
);

/** Words that only name a category, never a specific dish. */
const genericWords = new Set(
  "pizza pizzen pasta nudel nudeln doner doener grill falafel schnitzel burger nugget nuggets wings auflauf auflaufe baguette baguettes salat salate kinder kids kind dessert nachtisch getrank getranke trinken pizzabrotchen pizzabroetchen brotchen vegetarisch veggie".split(
    " ",
  ),
);

/** Ingredient words that the printed menu spells differently. */
const synonyms: Record<string, string[]> = {
  kase: ["kase", "cheese", "mozzarella", "gouda", "feta", "schafskase", "hirtenkase"],
  hahnchen: ["hahnchen", "chicken", "pute"],
  huhn: ["hahnchen", "chicken", "pute"],
  chicken: ["hahnchen", "chicken"],
  scharf: ["scharf", "chili", "jalapeno", "peperoni", "pikant", "diavolo", "sucuk"],
  fisch: ["fisch", "thunfisch", "lachs", "sardellen", "meeresfruchte", "frutti", "garnelen", "scampi"],
  meeresfruchte: ["meeresfruchte", "frutti", "garnelen", "scampi", "muscheln"],
  fleisch: ["fleisch", "rind", "hackfleisch", "doner", "salami", "schinken", "hahnchen", "sucuk"],
  schinken: ["schinken", "prosciutto"],
  pilze: ["pilze", "champignons", "funghi"],
  champignon: ["champignon", "funghi", "pilz"],
  cola: ["cola"],
};

interface Indexed {
  item: MenuItem;
  cat: MenuCategory;
  section?: string;
  hay: string;
}

const index: Indexed[] = menu.flatMap((cat) =>
  cat.sections.flatMap((s) =>
    s.items.map((item) => ({
      item,
      cat,
      section: s.title,
      hay: normalize(`${item.no} ${item.name} ${item.desc ?? ""} ${s.title ?? ""} ${cat.title}`),
    })),
  ),
);

const priceText = (item: MenuItem, cat: MenuCategory) => {
  if (item.prices.length > 1 && cat.priceLabels) {
    return item.prices.map((p, i) => `${cat.priceLabels![i]}: ${formatPrice(p)} €`).join(" · ");
  }
  return `${formatPrice(item.prices[0])} €${item.unit ? ` (${item.unit})` : ""}`;
};

const toItem = ({ item, cat }: Indexed): AnswerItem => ({
  key: `${cat.id}-${item.no}-${item.name}`,
  options: item.prices.map((price, i) => ({ label: item.prices.length > 1 ? cat.priceLabels?.[i] : undefined, price })),
  no: item.no,
  name: item.name,
  desc: item.desc,
  price: priceText(item, cat),
  category: cat.title,
});

const has = (q: string, ...words: string[]) => words.some((w) => new RegExp(`(^|[^a-z])${w}`).test(q));

function findCategories(q: string): MenuCategory[] {
  return menu.filter((c) => has(q, ...(categoryWords[c.id] ?? [c.id])));
}

function hoursAnswer(): Answer {
  const status = getOpenStatus();
  const week = weekOrder.map((d) => `${dayNames[d]}: ${formatSlots(d)}`);
  const allSame = hoursSummary.startsWith("Täglich");
  return {
    text: `${status.label}. ${allSame ? `Wir haben ${hoursSummary.replace("Täglich", "täglich")} für Sie geöffnet.` : `Unsere Öffnungszeiten:\n${week.join("\n")}`}`,
    links: [phoneLink, ...onlineLink],
    chips: ["Wo seid ihr?", "Liefert ihr?"],
  };
}

function cheapest(list: Indexed[], limit = 5) {
  return [...list].sort((a, b) => a.item.prices[0] - b.item.prices[0]).slice(0, limit);
}

/** Answer one question. Pure apart from the current time (opening status). */
export function answer(input: string): Answer {
  const q = normalize(input).replace(/[?!.,;:]+/g, " ").replace(/\s+/g, " ").trim();
  if (!q) return { text: "Fragen Sie mich gerne etwas zu Speisekarte, Preisen, Öffnungszeiten oder Anfahrt.", chips: starterChips };

  // Dish number: "nummer 25a", "nr 102", or just "25a"
  const noMatch = q.match(/(?:^|\s)(?:nr|nummer|no|#)?\s*(\d{1,3}[a-z]?)(?:\s|$)/);
  const asNumber = noMatch && (has(q, "nr", "nummer", "#") || q === noMatch[1]) ? findItem(noMatch[1]) : undefined;
  if (asNumber) {
    const hit = index.find((x) => x.item === asNumber)!;
    return {
      text: `Nummer ${asNumber.no} ist ${asNumber.name}.`,
      items: [toItem(hit)],
      links: [phoneLink, categoryLink(hit.cat)],
    };
  }

  if (has(q, "hallo", "hi", "hey", "moin", "guten tag", "servus", "salut", "merhaba")) {
    return {
      text: `Hallo und willkommen bei ${site.name}! Ich helfe Ihnen bei Fragen zu Speisekarte, Preisen, Öffnungszeiten und Bestellung.`,
      chips: starterChips,
    };
  }

  if (has(q, "danke", "super", "perfekt", "top")) {
    return { text: "Sehr gerne! Guten Appetit wünscht Ihr Rialto-Team.", links: [phoneLink, ...onlineLink] };
  }

  if (has(q, "offen", "geoffnet", "offnungszeit", "geschlossen", "ruhetag", "wann", "uhrzeit", "bis wie viel uhr", "feiertag")) {
    return hoursAnswer();
  }

  if (has(q, "allergen", "allergie", "gluten", "laktose", "vegan", "zusatzstoff", "nuss", "halal", "schwein")) {
    return {
      text: "Zu Allergenen, Zusatzstoffen und Zutaten beraten wir Sie am besten persönlich – bitte rufen Sie kurz an, dann geben wir Ihnen eine sichere Auskunft.",
      links: [phoneLink],
      chips: ["Vegetarische Gerichte", "Öffnungszeiten"],
    };
  }

  if (has(q, "liefer", "bring", "mindestbestell", "versand", "lieferando")) {
    return {
      text: site.onlineOrder
        ? `Sie können online über ${site.onlineOrder.label} bestellen – dort sehen Sie auch Liefergebiet, Lieferzeit und Mindestbestellwert. Oder Sie rufen an und bestellen telefonisch.`
        : "Bestellen Sie am einfachsten telefonisch – wir sagen Ihnen gerne, ob wir zu Ihnen liefern.",
      links: [...onlineLink, phoneLink],
    };
  }

  if (has(q, "bezahl", "zahlen", "zahlung", "paypal", "ec ", "ec-karte", "kreditkarte", "bar ", "barzahlung")) {
    return {
      text: "Zu den Zahlungsmöglichkeiten habe ich leider keine sicheren Angaben. Rufen Sie uns kurz an, wir helfen Ihnen gerne weiter.",
      links: [phoneLink],
    };
  }

  if (!/\d+\s*(personen|leute|pers)/.test(q) && has(q, "bestell", "anruf", "telefon", "nummer", "kontakt", "reservier", "tisch", "email", "e-mail", "mail")) {
    return {
      text: `Am schnellsten bestellen oder fragen Sie telefonisch unter ${site.phoneDisplay}. Nennen Sie einfach die Nummer Ihres Gerichts – bei Pizza auch die Größe.`,
      links: [phoneLink, ...onlineLink],
    };
  }

  if (has(q, "wo ", "wo$", "adresse", "anfahrt", "parken", "parkplatz", "route", "weg ", "finde euch", "standort", "liegt")) {
    return {
      text: `Sie finden uns in der ${addressLine}.`,
      links: [{ label: "Route planen", href: site.directionsUrl, external: true }, phoneLink],
      chips: ["Habt ihr jetzt geöffnet?"],
    };
  }

  const cats = findCategories(q);
  const cheap = has(q, "gunstig", "was gunstiges", "billig", "preiswert", "preisgunstig", "kleines budget");
  const under = q.match(/unter\s*(\d+(?:[.,]\d+)?)/);
  const limit = under ? Number(under[1].replace(",", ".")) : undefined;
  const veggie = has(q, "vegetarisch", "veggie", "ohne fleisch");
  let pool = cats.length ? index.filter((x) => cats.includes(x.cat)) : index;
  if (!cats.some((c) => c.id === "getraenke")) pool = pool.filter((x) => x.cat.id !== "getraenke");
  if (limit !== undefined) pool = pool.filter((x) => x.item.prices[0] <= limit);

  const people = q.match(/(\d+)\s*(?:personen|leute|person|pers)/) ?? q.match(/(?:zu|wir sind)\s*(\d+)/);
  const budget = q.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro|eur)/) ?? q.match(/budget\s*(?:von\s*)?(\d+)/);
  if (people || (budget && !under)) {
    const n = Math.min(Math.max(Number(people?.[1] ?? 1), 1), 12);
    const total = budget ? Number(budget[1].replace(",", ".")) : undefined;
    const perHead = total !== undefined ? total / n : undefined;
    const mains = (cats.length ? pool : index.filter((x) => !["getraenke", "dessert"].includes(x.cat.id))).filter(
      (x) => perHead === undefined || x.item.prices[0] <= perHead,
    );
    if (!mains.length) {
      return {
        text: `Für ${formatPrice(perHead ?? 0)} € pro Person habe ich leider nichts gefunden. Rufen Sie uns gerne an – wir finden zusammen etwas Passendes.`,
        links: [phoneLink],
      };
    }
    // Spread the picks over different categories so everyone gets something different
    const pick: Indexed[] = [];
    const shuffled = [...mains].sort(() => Math.random() - 0.5);
    for (const x of shuffled) if (pick.length < n && !pick.some((p) => p.cat === x.cat)) pick.push(x);
    for (const x of shuffled) if (pick.length < n && !pick.includes(x)) pick.push(x);
    const sum = pick.reduce((t, x) => t + x.item.prices[0], 0);
    return {
      text: `Mein Vorschlag für ${n === 1 ? "Sie" : `${n} Personen`}${total !== undefined ? ` mit ${formatPrice(total)} €` : ""}: zusammen ${formatPrice(sum)} €${pick.some((x) => x.item.prices.length > 1) ? " (Pizza in der kleinsten Größe)" : ""}. Mit „+ Merken“ landet alles auf Ihrem Bestellzettel.`,
      items: pick.map(toItem),
      links: [phoneLink, ...onlineLink],
      chips: [people ? `Wir sind ${n} Personen${total !== undefined ? `, ${total} €` : ""}` : "Überrasch mich!", "Günstigste Gerichte"],
    };
  }

  if (has(q, "uberrasch", "zufall", "egal", "weiss nicht", "keine ahnung", "was soll ich", "was empfiehl", "empfehlung", "hunger")) {
    const options = (cats.length ? pool : index.filter((x) => !["getraenke"].includes(x.cat.id))).filter(
      (x) => limit === undefined || x.item.prices[0] <= limit,
    );
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const pick: Indexed[] = [];
    for (const x of shuffled) if (pick.length < 3 && !pick.some((p) => p.cat === x.cat)) pick.push(x);
    for (const x of shuffled) if (pick.length < 3 && !pick.includes(x)) pick.push(x);
    return {
      text: "Wie wäre es mit einem davon? Nichts dabei – dann einfach nochmal würfeln.",
      items: pick.map(toItem),
      chips: ["Nochmal überraschen!", "Was Günstiges", "Lieber Pizza"],
    };
  }

  if (veggie) {
    const falafel = menu.find((c) => c.id === "falafel");
    return {
      text: falafel
        ? "Ohne Fleisch empfehlen wir unsere Falafel-Gerichte. Ob ein anderes Gericht vegetarisch zubereitet werden kann, sagen wir Ihnen gerne am Telefon."
        : "Ob ein Gericht vegetarisch zubereitet werden kann, sagen wir Ihnen gerne am Telefon.",
      items: falafel ? index.filter((x) => x.cat === falafel).slice(0, 5).map(toItem) : undefined,
      links: falafel ? [categoryLink(falafel), phoneLink] : [phoneLink],
    };
  }

  // Free-text search for dishes and ingredients. Generic words like "pizza" only pick the
  // category; specific ones ("lasagne", "thunfisch", "cola") must appear in the dish.
  const tokens = q
    .split(" ")
    .filter((t) => t.length >= 3 && !stopwords.has(t) && !/^\d/.test(t))
    .filter((t) => !genericWords.has(t) && !genericWords.has(t.replace(/(en|n|s|e)$/, "")));
  let missed = "";

  if (tokens.length) {
    const matches = (hay: string, t: string) =>
      (synonyms[t] ?? [t, t.replace(/(en|n|s|e)$/, "")]).some((v) => v.length >= 3 && hay.includes(v));
    const scored = pool
      .map((x) => ({ x, hits: tokens.filter((t) => matches(x.hay, t)).length }))
      .filter((s) => s.hits > 0)
      .sort((a, b) => b.hits - a.hits || a.x.item.prices[0] - b.x.item.prices[0]);
    const best = scored.filter((s) => s.hits === scored[0]?.hits).map((s) => s.x);
    if (best.length) {
      const shown = best.slice(0, 6);
      const where = cats.length === 1 ? ` bei ${cats[0].title}` : "";
      return {
        text:
          best.length === 1
            ? `Das habe ich${where} gefunden:`
            : `Ich habe ${best.length} passende Gerichte${where} gefunden${best.length > shown.length ? " – hier die ersten " + shown.length : ""}:`,
        items: shown.map(toItem),
        links: [phoneLink, ...(cats.length === 1 ? [categoryLink(cats[0])] : [{ label: "Ganze Speisekarte", href: "/speisekarte/" }])],
      };
    }
    missed = `„${input.trim()}“ habe ich so nicht auf der Karte gefunden. `;
  }

  if (cats.length || cheap || limit !== undefined) {
    if (!pool.length) {
      return {
        text: `Unter ${formatPrice(limit ?? 0)} € habe ich${cats.length === 1 ? ` bei ${cats[0].title}` : ""} leider nichts gefunden.`,
        links: [{ label: "Ganze Speisekarte", href: "/speisekarte/" }],
      };
    }
    if (cats.length === 1 && !cheap && limit === undefined) {
      const c = cats[0];
      const items = pool;
      const min = Math.min(...items.map((x) => x.item.prices[0]));
      return {
        text: `${missed}${c.title}: ${items.length} Gerichte ab ${formatPrice(min)} €.${c.note ? ` ${c.note}.` : ""} Hier eine Auswahl:`,
        items: items.slice(0, 5).map(toItem),
        links: [categoryLink(c), phoneLink],
      };
    }
    const list = cheapest(pool);
    const scope = cats.length === 1 ? cats[0].title : "auf der Karte";
    return {
      text:
        limit !== undefined
          ? `Diese Gerichte ${cats.length === 1 ? `bei ${scope} ` : ""}gibt es ab unter ${formatPrice(limit)} €:`
          : `Die günstigsten Gerichte ${cats.length === 1 ? `bei ${scope}` : scope}:`,
      items: list.map(toItem),
      links: cats.length === 1 ? [categoryLink(cats[0]), phoneLink] : [{ label: "Ganze Speisekarte", href: "/speisekarte/" }, phoneLink],
    };
  }

  if (has(q, "speisekarte", "karte", "menu", "essen", "angebot", "empfehl", "hunger", "lecker")) {
    return {
      text: `Unsere Speisekarte hat Pizza, Pasta, Döner & Grill, Burger, Schnitzel, Salate und vieles mehr. Wonach ist Ihnen?`,
      links: [{ label: "Speisekarte öffnen", href: "/speisekarte/" }],
      chips: ["Pizza", "Döner", "Burger", "Pasta", "Salat"],
    };
  }

  return {
    text: `${missed || "Das weiß ich leider nicht sicher. "}Am besten rufen Sie uns kurz an – wir helfen Ihnen gerne persönlich weiter.`,
    links: [phoneLink, { label: "Speisekarte", href: "/speisekarte/" }],
    chips: starterChips.slice(0, 3),
  };
}

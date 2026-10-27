import { menu } from "../data/menu";
import "./Marquee.css";

/** Slow, decorative band of the real menu categories between hero and content. */
export default function Marquee() {
  const words = menu.filter((c) => c.id !== "getraenke").map((c) => c.title);
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {words.map((w) => (
        <li key={w}>
          <a href={`#kategorie-${menu.find((c) => c.title === w)!.id}`} tabIndex={hidden ? -1 : undefined}>
            {w}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <nav className="marquee" aria-label="Kategorien">
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </nav>
  );
}

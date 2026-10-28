import { site } from "../data/site";
import Icon from "./Icon";
import "./MobileActionBar.css";

/** Fixed bottom bar on phones: the two actions that matter most. */
export default function MobileActionBar() {
  return (
    <div className="actionbar" role="region" aria-label="Schnellaktionen">
      <a className="actionbar__btn actionbar__btn--primary btn--sheen" href={site.phoneHref}>
        <Icon name="phone" />
        Anrufen &amp; bestellen
      </a>
      {site.onlineOrder ? (
        <a className="actionbar__btn" href={site.onlineOrder.url} target="_blank" rel="noopener">
          <Icon name="bag" />
          Online
          <span className="sr-only"> bestellen bei {site.onlineOrder.label} (öffnet in neuem Tab)</span>
        </a>
      ) : (
        <a className="actionbar__btn" href="#speisekarte">
          <Icon name="book" />
          Karte
        </a>
      )}
    </div>
  );
}

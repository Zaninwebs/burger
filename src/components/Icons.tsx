import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { openStatus, type OpenStatus } from "../lib/hours";
import "./Icons.css";

/** Mouse with a scrolling wheel dot — invites the visitor to scroll. */
export function ScrollMouse({ className = "" }: { className?: string }) {
  return (
    <span className={`scroll-mouse ${className}`} aria-hidden="true">
      <span className="scroll-mouse__wheel" />
    </span>
  );
}

/** Live "open / closed" pill with a pulsing dot; refreshes every minute. */
export function OpenBadge({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const status: OpenStatus = openStatus(now, lang);
  return (
    <p className={`open-badge is-${status.state} ${className}`}>
      <span className="open-badge__dot" aria-hidden="true" />
      {status.text}
    </p>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function PinIcon() {
  return (
    <svg className="icon icon--pin" viewBox="0 0 24 24" aria-hidden="true">
      <path {...stroke} d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle {...stroke} cx="12" cy="9.5" r="2.6" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg className="icon icon--clock" viewBox="0 0 24 24" aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="9" />
      <path {...stroke} className="icon__hour" d="M12 12V8.2" />
      <path {...stroke} className="icon__minute" d="M12 12h3.6" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg className="icon icon--phone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        {...stroke}
        d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 4.9 4.9l1.3-2 4 1.6V17a2 2 0 0 1-2.2 2A15 15 0 0 1 3 6.2 2 2 0 0 1 5 4Z"
      />
    </svg>
  );
}

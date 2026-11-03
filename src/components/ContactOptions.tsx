import { business } from "../data/content";
import { useI18n } from "../i18n";
import "./ContactOptions.css";


function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"
      />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function CallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 4.9 4.9l1.3-2 4 1.6V17a2 2 0 0 1-2.2 2A15 15 0 0 1 3 6.2 2 2 0 0 1 5 4Z"
      />
    </svg>
  );
}

type Option = { key: string; label: string; detail: string; href: string | null; icon: React.ReactNode; external?: boolean };

/** Three direct ways to reach the restaurant: WhatsApp, e-mail, phone. */
export default function ContactOptions({ title }: { title?: string }) {
  const { t } = useI18n();
  const greeting = t("Hallo Casa Ducale, ich möchte gerne einen Tisch reservieren: ");
  const options: Option[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      detail: business.whatsapp ? t("Nachricht schreiben") : t("Nummer folgt"),
      href: business.whatsapp ? `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(greeting)}` : null,
      icon: <WhatsAppIcon />,
      external: true,
    },
    {
      key: "mail",
      label: t("E-Mail"),
      detail: business.email ?? t("Adresse folgt"),
      href: business.email ? `mailto:${business.email}?subject=${encodeURIComponent(t("Tischreservierung"))}` : null,
      icon: <MailIcon />,
    },
    {
      key: "call",
      label: t("Anrufen"),
      detail: business.phoneDisplay,
      href: business.phoneHref,
      icon: <CallIcon />,
    },
  ];

  return (
    <div className="contact-options">
      <p className="contact-options__title">{title ?? t("Oder direkt Kontakt aufnehmen")}</p>
      <ul className="contact-options__list">
        {options.map((o) => {
          const inner = (
            <>
              <span className="contact-options__icon">{o.icon}</span>
              <span className="contact-options__text">
                <strong>{o.label}</strong>
                <span>{o.detail}</span>
              </span>
            </>
          );
          return (
            <li key={o.key}>
              {o.href ? (
                <a
                  className={`contact-options__btn is-${o.key}`}
                  href={o.href}
                  target={o.external ? "_blank" : undefined}
                  rel={o.external ? "noopener noreferrer" : undefined}
                >
                  {inner}
                </a>
              ) : (
                <span className={`contact-options__btn is-${o.key} is-pending`} aria-disabled="true">
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

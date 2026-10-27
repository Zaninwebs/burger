import type { ReactNode } from "react";
import { business, fullAddress } from "../data/content";
import Emblem from "../components/Emblem";
import { DEFAULT_SETTINGS } from "../../shared/reservations";
import { site } from "../lib/paths";

function Todo({ children }: { children: ReactNode }) {
  return <mark className="todo">{children}</mark>;
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="legal__bar">
        <a href={site("index.html")} className="legal__brand">
          <Emblem className="legal__lily" title="" />
          <span>Casa Ducale</span>
        </a>
        <a href={site("index.html")} className="link">
          ← Zur Startseite
        </a>
      </header>
      <main className="legal container">
        <h1 className="h2">{title}</h1>
        {children}
      </main>
      <footer className="legal__foot container">
        <a className="link" href={site("impressum/index.html")}>
          Impressum
        </a>
        <a className="link" href={site("datenschutz/index.html")}>
          Datenschutz
        </a>
      </footer>
    </>
  );
}

// ⚠︎ The legally required details (owner, legal form, VAT ID, …) must be copied
// from the current Impressum of the existing website before launch.
export function Impressum() {
  return (
    <Shell title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {business.name}
          <br />
          <Todo>Inhaber:in / Firma und Rechtsform – aus dem bestehenden Impressum übernehmen</Todo>
          <br />
          {fullAddress}
        </p>
      </section>
      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: <a href={business.phoneHref}>{business.phoneDisplay}</a>
          <br />
          E-Mail: {business.email ?? <Todo>E-Mail-Adresse ergänzen</Todo>}
        </p>
      </section>
      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p>
          <Todo>USt-IdNr. gemäß § 27a UStG – falls vorhanden, aus dem bestehenden Impressum übernehmen</Todo>
        </p>
      </section>
      <section>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </section>
      <section>
        <h2>Bildnachweis</h2>
        <p>Alle Fotos und Videos: {business.name}.</p>
      </section>
    </Shell>
  );
}

export function Datenschutz() {
  const days = DEFAULT_SETTINGS.retentionDays;
  return (
    <Shell title="Datenschutz­erklärung">
      <p className="legal__note">
        <Todo>
          Vorlage für die Reservierungsfunktion. Vor Veröffentlichung mit der bestehenden Datenschutzerklärung
          zusammenführen und rechtlich prüfen lassen.
        </Todo>
      </p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          {business.name}
          <br />
          <Todo>Inhaber:in / Firma</Todo>
          <br />
          {fullAddress}
          <br />
          Telefon: {business.phoneDisplay}
        </p>
      </section>

      <section>
        <h2>2. Hosting und Server-Logfiles</h2>
        <p>
          Diese Website wird bei <Todo>Hosting-Anbieter, z. B. Netlify, Inc., USA</Todo> gehostet. Beim Aufruf werden
          technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser) kurzzeitig in
          Server-Logfiles verarbeitet, um die Website sicher und stabil auszuliefern (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2>3. Reservierungsanfragen</h2>
        <p>
          Wenn Sie über das Formular einen Tisch anfragen, verarbeiten wir Datum, Uhrzeit, Personenzahl, Name,
          Telefonnummer, E-Mail-Adresse sowie – freiwillig – Anlass und Nachricht. Die Daten nutzen wir ausschließlich,
          um Ihre Anfrage zu bearbeiten, Plätze zu planen und Sie bei Rückfragen zu kontaktieren.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung und Durchführung der Reservierung). Die Übertragung
          erfolgt verschlüsselt (HTTPS). Zugriff auf die Anfragen hat nur das Restaurant über einen passwortgeschützten
          Bereich.
        </p>
        <p>
          <strong>Speicherdauer:</strong> Reservierungsdaten werden automatisch {days} Tage nach dem reservierten Datum
          gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Auf Wunsch löschen wir Ihre Anfrage
          jederzeit früher.
        </p>
        <p>
          <strong>Benachrichtigung:</strong> Über neue Anfragen wird das Restaurant per E-Mail informiert. Dafür nutzen
          wir <Todo>E-Mail-Dienst, z. B. Resend</Todo> als Auftragsverarbeiter.
        </p>
        <p>
          <strong>Essen zum Abholen:</strong> Wenn Sie Gerichte zur Abholung auswählen, verarbeiten wir die gewählten
          Gerichte, die Abholzeit, Ihren Namen, Ihre Telefonnummer, freiwillig Ihre E-Mail-Adresse und Ihren Hinweis, um
          die Bestellung zuzubereiten und zu übergeben (Art. 6 Abs. 1 lit. b DSGVO). Es gilt dieselbe Speicherdauer wie
          bei Reservierungen; steuerliche Aufbewahrungspflichten für Belege bleiben unberührt.
        </p>
        <p>
          <strong>Online-Zahlung:</strong> Wählen Sie „Online bezahlen“, werden Sie zum Zahlungsdienstleister{" "}
          <Todo>Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland</Todo> weitergeleitet. Dort
          geben Sie Ihre Zahlungsdaten direkt ein; wir erhalten sie nicht, sondern nur die Bestätigung der Zahlung.
          Es gelten zusätzlich die Datenschutzhinweise des Zahlungsdienstleisters.
        </p>
      </section>

      <section>
        <h2>4. Keine Cookies, kein Tracking</h2>
        <p>
          Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste. Im Browser wird lediglich
          gespeichert, ob die Eingangsanimation in dieser Sitzung bereits gezeigt wurde, welche Gerichte Sie zum Abholen ausgewählt haben und – falls Sie die Karte laden – Ihre Entscheidung zur Kartenanzeige.
        </p>
      </section>

      <section>
        <h2>5. Schriftarten und Karte</h2>
        <p>
          Schriftarten werden lokal von unserem Server geladen; es findet keine Verbindung zu Google Fonts statt.
        </p>
        <p>
          Die Karte von Google Maps (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) wird erst
          geladen, wenn Sie auf „Karte hier anzeigen“ klicken. Erst dann werden Daten wie Ihre IP-Adresse an Google
          übertragen (Art. 6 Abs. 1 lit. a DSGVO – Einwilligung). Ihre Entscheidung wird nur in Ihrem Browser gespeichert
          und kann durch Löschen der Website-Daten widerrufen werden. Der Link „Route in Google Maps öffnen“ öffnet
          Google Maps in einem neuen Fenster; dort gelten die Datenschutzhinweise von Google.
        </p>
      </section>

      <section>
        <h2>6. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          sowie Widerspruch (Art. 15–21 DSGVO). Wenden Sie sich dazu an die oben genannten Kontaktdaten. Außerdem können
          Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Landesbeauftragten für Datenschutz
          und Informationsfreiheit Nordrhein-Westfalen.
        </p>
      </section>
    </Shell>
  );
}

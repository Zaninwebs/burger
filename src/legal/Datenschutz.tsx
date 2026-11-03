import { business } from '../data/content'

// Entwurf, der das neue Terminformular berücksichtigt. Bitte mit der
// bisherigen Datenschutzerklärung abgleichen und rechtlich prüfen lassen.
export function Datenschutz() {
  return (
    <article>
      <p className="eyebrow">Rechtliches</p>
      <h1 className="h-lg">Datenschutzerklärung</h1>

      <p className="notice">
        Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}. Diese Website verwendet
        keine Tracking- oder Analyse-Tools, keine Werbe-Cookies und bindet keine externen Schriftarten, Karten oder
        Social-Media-Plugins ein.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {business.name}, Inhaber {business.owner}
        <br />
        {business.street}, {business.zip} {business.city}
        <br />
        Telefon: {business.phoneDisplay} · E-Mail: <a href={`mailto:${business.email}`}>{business.email}</a>
      </p>

      <h2>2. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei Hostinger gehostet (UAB Hostinger International, Švitrigailos str. 34, 03230 Vilnius,
        Litauen). Die Server befinden sich in der Europäischen Union. Beim Aufruf der Website werden automatisch
        Informationen in Server-Logfiles gespeichert: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene
        Seiten/Dateien, HTTP-Statuscode, Browsertyp und -version, Betriebssystem sowie die Referrer-URL. Diese Daten
        dienen dem sicheren und stabilen Betrieb der Website; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.{' '}
        <span className="todo">[prüfen: Wo läuft künftig das Terminsystem? Falls bei einem anderen Anbieter, hier ergänzen]</span>
      </p>

      <h2>3. Terminanfragen über das Online-Formular</h2>
      <p>
        Wenn Sie über unsere Website einen Termin anfragen, verarbeiten wir folgende Angaben: gewünschte Leistung,
        Wunschdatum und ggf. Uhrzeit, Name, Telefonnummer, E-Mail-Adresse sowie optional Ihre Nachricht. Wir nutzen
        diese Daten ausschließlich, um Ihre Anfrage zu bearbeiten, den Termin mit Ihnen abzustimmen und durchzuführen.
      </p>
      <ul>
        <li>
          <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Anbahnung und Durchführung eines Vertrags) sowie
          Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, die Sie jederzeit mit Wirkung für die Zukunft widerrufen
          können.
        </li>
        <li>
          <strong>Sicherheit:</strong> Die Übertragung erfolgt TLS-verschlüsselt. Name, Telefonnummer, E-Mail-Adresse und
          Nachricht werden zusätzlich verschlüsselt (AES-256) gespeichert und sind nur im passwortgeschützten
          Verwaltungsbereich des Salons lesbar.
        </li>
        <li>
          <strong>Speicherdauer:</strong> Anfragen werden automatisch 30 Tage nach dem Termindatum gelöscht, abgelehnte
          Anfragen 30 Tage nach der Ablehnung. Auf Wunsch löschen wir Ihre Daten jederzeit früher.
        </li>
        <li>
          <strong>Spam-Schutz:</strong> Zur Abwehr automatisierter Anfragen wird Ihre IP-Adresse kurzzeitig nur als
          nicht rückrechenbarer Hash-Wert gespeichert und nach spätestens 24 Stunden gelöscht.
        </li>
        <li>
          <strong>Benachrichtigung:</strong> Über neue Anfragen wird der Salon per E-Mail informiert. Diese
          Benachrichtigung enthält nur Leistung und Wunschtermin, nicht Ihre Kontaktdaten.{' '}
          <span className="todo">[bei Nutzung von Resend o. ä. als E-Mail-Dienst hier ergänzen]</span>
        </li>
      </ul>
      <p>Eine Weitergabe an Dritte findet nicht statt, abgesehen von den genannten technischen Dienstleistern.</p>

      <h2>4. Kontakt per Telefon oder E-Mail</h2>
      <p>
        Wenn Sie uns anrufen oder eine E-Mail schreiben, verarbeiten wir Ihre Angaben zur Bearbeitung Ihres Anliegens
        (Art. 6 Abs. 1 lit. b bzw. f DSGVO) und löschen sie, sobald sie hierfür nicht mehr erforderlich sind.
      </p>

      <h2>5. Cookies und lokale Speicherung</h2>
      <p>
        Auf den öffentlichen Seiten setzen wir keine Cookies und speichern nichts in Ihrem Browser. Lediglich im
        Verwaltungsbereich des Salons wird nach der Anmeldung ein technisch notwendiges Sitzungs-Token im Browser des
        Inhabers abgelegt.
      </p>

      <h2>6. Schriftarten</h2>
      <p>Alle Schriftarten werden von unserem eigenen Server geladen. Es besteht keine Verbindung zu Google Fonts.</p>

      <h2>7. Externe Links</h2>
      <p>
        Links zu Instagram und Google Maps (Routenplanung) werden erst beim Anklicken aufgerufen. Erst dann gelten die
        Datenschutzbestimmungen des jeweiligen Anbieters.
      </p>

      <h3>Google Maps</h3>
      <p>
        Im Bereich „Anfahrt“ können Sie eine interaktive Karte von Google Maps (Google Ireland Limited, Gordon House,
        Barrow Street, Dublin 4, Irland) laden. Die Karte wird erst geladen, wenn Sie auf „Interaktive Karte laden“
        klicken. Dabei werden u. a. Ihre IP-Adresse und technische Daten an Google übertragen, ggf. auch in die USA.
        Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie durch den Klick erteilen.
        Weitere Informationen: https://policies.google.com/privacy
      </p>

      <h2>8. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) sowie das Recht, eine erteilte
        Einwilligung zu widerrufen (Art. 7 Abs. 3). Wenden Sie sich dazu einfach an uns. Sie können sich außerdem bei
        einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Landesbeauftragten für Datenschutz und
        Informationsfreiheit Nordrhein-Westfalen.
      </p>
    </article>
  )
}

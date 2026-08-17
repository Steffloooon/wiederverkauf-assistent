import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung – Wiederverkauf-Assistent" },
      {
        name: "description",
        content:
          "Informationen zur Verarbeitung personenbezogener Daten im Wiederverkauf-Assistenten nach DSGVO.",
      },
      { property: "og:title", content: "Datenschutzerklärung – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Verarbeitung personenbezogener Daten nach DSGVO." },
    ],
  }),
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zurück
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Datenschutzerklärung
        </h1>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              1. Verantwortliche Stelle
            </h2>
            <p className="mt-2">
              Diese Anwendung wird ausschließlich für den eigenen Verkauf genutzt.
              Verantwortlich im Sinne der DSGVO ist der Betreiber der Anwendung; die Kontaktdaten
              stehen im{" "}
              <Link to="/impressum" className="text-primary underline">
                Impressum
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              2. Welche Daten verarbeitet werden
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Kontodaten: E-Mail-Adresse und Anmeldedaten (Art. 6 Abs. 1 lit. b DSGVO).</li>
              <li>Verkäuferinformationen: Verkäufername, Land, Verkäuferstatus, Standard-Abschlusstext.</li>
              <li>Artikeldaten: Fotos, Angaben, generierte Texte, Preisanalysen, Verkaufsdaten.</li>
              <li>Technische Daten: Fehlerprotokolle zur Sicherstellung des Betriebs.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              3. Einsatz von KI-Diensten
            </h2>
            <p className="mt-2">
              Zur Erstellung von Inseraten und Preisanalysen werden die eingegebenen Angaben und die
              hochgeladenen Produktfotos an einen KI-Dienst übermittelt und dort verarbeitet
              (Auftragsverarbeitung gemäß Art. 28 DSGVO). Es werden keine personenbezogenen Daten von
              Kunden übermittelt. Lade daher keine Fotos hoch, auf denen Personen, Ausweise oder
              fremde Adressdaten erkennbar sind.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              4. eBay-Schnittstelle
            </h2>
            <p className="mt-2">
              Bei der Verbindung mit eBay wird über das offizielle OAuth-Verfahren ein widerrufbares
              Zugriffstoken gespeichert. Passwörter des eBay-Kontos werden nicht erfasst. Beim
              Veröffentlichen werden Inseratsdaten und Fotos an eBay übertragen. Die Verbindung kann
              in den Einstellungen jederzeit getrennt werden.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              5. Speicherdauer und Sicherheit
            </h2>
            <p className="mt-2">
              Daten werden gespeichert, solange sie für den Betrieb und die gesetzlichen
              Aufbewahrungsfristen (u. a. § 147 AO) erforderlich sind. Fotos liegen in einem privaten
              Speicher und sind ausschließlich über kurzfristig gültige Links erreichbar. Der Zugriff
              ist technisch auf das eigene Konto beschränkt.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Deine Rechte</h2>
            <p className="mt-2">
              Es bestehen die Rechte auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
              (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und
              Widerspruch (Art. 21 DSGVO) sowie ein Beschwerderecht bei der zuständigen
              Datenschutzaufsichtsbehörde.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

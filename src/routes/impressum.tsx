import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Angaben gemäß § 5 DDG zum Betreiber des Wiederverkauf-Assistenten.",
      },
      { property: "og:title", content: "Impressum – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Angaben gemäß § 5 DDG zum Betreiber." },
    ],
  }),
  component: Impressum,
});

function Impressum() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <article className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zurück
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Impressum</h1>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="mt-2">
              Diese Anwendung ist ein persönliches Arbeitswerkzeug und nicht für
              Dritte bestimmt. Gewerbliche Verkäufer und Kleinunternehmer tragen hier ihre vollständigen Pflichtangaben ein:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Vor- und Nachname bzw. Verkäufername</li>
              <li>Anschrift (kein Postfach)</li>
              <li>E-Mail-Adresse und Telefonnummer</li>
              <li>Umsatzsteuer-Identifikationsnummer, falls vorhanden</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Hinweis Kleinunternehmerregelung
            </h2>
            <p className="mt-2">
              Wird die Kleinunternehmerregelung nach § 19 UStG angewendet, ist in Rechnungen und
              Angeboten kein Umsatzsteuerausweis zulässig. Der entsprechende Hinweis gehört in deine
              eBay-Angebotsvorlage und in deine Rechnungen.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Verbraucherpflichten beim Verkauf
            </h2>
            <p className="mt-2">
              Beim gewerblichen Verkauf an Verbraucher gelten Widerrufsrecht (14 Tage),
              Gewährleistung sowie Informationspflichten zu Preisen, Versandkosten und Lieferzeiten.
              Pflege diese Angaben in deinem eBay-Verkäuferkonto.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

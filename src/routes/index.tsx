import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, LineChart, Send, ShieldCheck, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wiederverkauf-Assistent – Inserate & Preise mit KI" },
      {
        name: "description",
        content:
          "KI-Assistent für alle Verkäufer: Fotos hochladen, Inserat und Preis erhalten, prüfen und veröffentlichen.",
      },
      { property: "og:title", content: "Wiederverkauf-Assistent – Inserate & Preise mit KI" },
      {
        property: "og:description",
        content: "Fotos hochladen, Inserat und Preisempfehlung erhalten, bei eBay veröffentlichen.",
      },
    ],
  }),
  component: Startseite,
});

const FUNKTIONEN = [
  {
    icon: Camera,
    titel: "Fotos statt Tipparbeit",
    text: "Artikel abfotografieren, wenige Angaben ergänzen – fertig. Optimiert für das Handy.",
  },
  {
    icon: Sparkles,
    titel: "Inserat von der KI",
    text: "Titel, Beschreibung, Zustandstext, Suchbegriffe und Kategorie – sachlich und rechtssicher formuliert.",
  },
  {
    icon: LineChart,
    titel: "Echte Preisanalyse",
    text: "Neu wird nur mit Neu verglichen, Gebraucht nur mit Gebraucht. Mit Preisspanne und verständlicher Begründung.",
  },
  {
    icon: Send,
    titel: "Direkt zu eBay",
    text: "Veröffentlichung über die offizielle eBay-API. Weitere Marktplätze sind modular vorbereitet.",
  },
  {
    icon: GraduationCap,
    titel: "Lernt mit dir",
    text: "Dein Feedback wird zu dauerhaften Regeln, Verkaufsdaten verbessern künftige Preisempfehlungen.",
  },
  {
    icon: ShieldCheck,
    titel: "Für jeden Verkäuferstatus",
    text: "Deutsche Oberfläche, Hinweise zu § 19 UStG, Pflichtangaben und DSGVO-konforme Datenhaltung.",
  },
];

function Startseite() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/start", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-base font-bold tracking-tight">
          Wiederverkauf<span className="text-primary">-Assistent</span>
        </span>
        <Button asChild variant="outline" size="sm">
          <Link to="/anmelden">Anmelden</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-10 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Für private, kleinunternehmerische und gewerbliche Verkäufer
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Vom Foto zum verkaufsfertigen eBay-Inserat – in wenigen Minuten.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Dein persönlicher Assistent erstellt Titel und Beschreibung, analysiert den Marktpreis
            für Neu- und Gebrauchtware, erklärt seine Empfehlung und veröffentlicht auf Wunsch direkt
            bei eBay.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/anmelden">Jetzt starten</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/datenschutz">Datenschutz</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUNKTIONEN.map((funktion) => {
            const Icon = funktion.icon;
            return (
              <article
                key={funktion.titel}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <Icon className="size-6 text-primary" />
                <h2 className="mt-3 font-display text-lg font-semibold text-card-foreground">
                  {funktion.titel}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {funktion.text}
                </p>
              </article>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-4 py-6 text-sm text-muted-foreground">
          <Link to="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
          <Link to="/datenschutz" className="hover:text-foreground">
            Datenschutzerklärung
          </Link>
          <Link to="/kontakt" className="hover:text-foreground">
            Kontakt
          </Link>

        </div>
      </footer>
    </div>
  );
}

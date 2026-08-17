import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { kontaktSenden } from "@/lib/kontakt.functions";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt – Wiederverkauf-Assistent" },
      {
        name: "description",
        content:
          "Fragen, Anregungen oder einen Fehler melden? Schreiben Sie uns über das Kontaktformular des Wiederverkauf-Assistenten.",
      },
      { property: "og:title", content: "Kontakt – Wiederverkauf-Assistent" },
      {
        property: "og:description",
        content: "Fragen, Anregungen oder Fehlermeldungen zum Wiederverkauf-Assistenten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kontakt,
});

function Kontakt() {
  const senden = useServerFn(kontaktSenden);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [falle, setFalle] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [gesendet, setGesendet] = useState(false);

  const mutation = useMutation({
    mutationFn: () => senden({ data: { name, email, betreff, nachricht, falle } }),
    onSuccess: () => {
      setGesendet(true);
      setFehler(null);
      setName("");
      setEmail("");
      setBetreff("");
      setNachricht("");
    },
    onError: (e: unknown) => {
      setFehler(
        e instanceof Error && e.message
          ? e.message
          : "Ihre Nachricht konnte leider nicht versendet werden. Bitte versuchen Sie es später erneut.",
      );
    },
  });

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zurück
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Kontakt</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sie haben Fragen, Anregungen oder möchten einen Fehler melden? Nutzen Sie einfach
          das Kontaktformular.
        </p>

        {gesendet ? (
          <div className="surface-card mt-6 p-5">
            <p className="text-sm leading-relaxed text-foreground">
              Vielen Dank! Ihre Nachricht wurde erfolgreich versendet. Ich werde mich
              schnellstmöglich bei Ihnen melden.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setGesendet(false)}>
              Weitere Nachricht schreiben
            </Button>
          </div>
        ) : (
          <form
            className="surface-card mt-6 space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              setFehler(null);
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="betreff">Betreff *</Label>
              <Input
                id="betreff"
                value={betreff}
                onChange={(e) => setBetreff(e.target.value)}
                required
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachricht">Nachricht *</Label>
              <Textarea
                id="nachricht"
                value={nachricht}
                onChange={(e) => setNachricht(e.target.value)}
                required
                rows={6}
                maxLength={3000}
              />
            </div>

            {/* Spam-Schutz: unsichtbares Feld (Honeypot) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="firma">Firma</label>
              <input
                id="firma"
                name="firma"
                tabIndex={-1}
                autoComplete="off"
                value={falle}
                onChange={(e) => setFalle(e.target.value)}
              />
            </div>

            {fehler && (
              <p className="text-sm text-destructive" role="alert">
                {fehler}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Wird gesendet…" : "Nachricht senden"}
            </Button>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Ihre Angaben werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und
              nicht an Dritte weitergegeben. Zur Fehleranalyse werden Zeitpunkt und
              Browserkennung mitgespeichert. Weitere Informationen finden Sie in der{" "}
              <Link to="/datenschutz" className="underline hover:text-foreground">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

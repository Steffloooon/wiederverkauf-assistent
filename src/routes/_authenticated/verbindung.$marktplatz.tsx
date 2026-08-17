import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { marktplatzVerbindungAbschliessen } from "@/lib/marktplatz.functions";
import { AppRahmen } from "@/components/AppRahmen";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/verbindung/$marktplatz")({
  head: () => ({
    meta: [
      { title: "Konto verbinden – Wiederverkauf-Assistent" },
      { name: "description", content: "Verbindung zum Marktplatz wird abgeschlossen." },
      { property: "og:title", content: "Konto verbinden – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Verbindung zum Marktplatz wird abgeschlossen." },
    ],
  }),
  component: VerbindungSeite,
});

function VerbindungSeite() {
  const { marktplatz } = Route.useParams();
  const navigate = useNavigate();
  const abschliessen = useServerFn(marktplatzVerbindungAbschliessen);
  const [meldung, setMeldung] = useState("Verbindung wird abgeschlossen …");
  const [fertig, setFertig] = useState(false);

  useEffect(() => {
    const parameter = new URLSearchParams(window.location.search);
    const code = parameter.get("code");
    const state = parameter.get("state");
    const erwartet = sessionStorage.getItem("marktplatz_state");

    if (parameter.get("error")) {
      setMeldung("Die Verbindung wurde abgebrochen oder abgelehnt.");
      setFertig(true);
      return;
    }
    if (!code) {
      setMeldung("Es wurde kein Bestätigungscode übermittelt. Bitte starte die Verbindung erneut.");
      setFertig(true);
      return;
    }
    if (erwartet && state && erwartet !== state) {
      setMeldung("Die Sicherheitsprüfung ist fehlgeschlagen. Bitte starte die Verbindung erneut.");
      setFertig(true);
      return;
    }

    abschliessen({ data: { marktplatz, code } })
      .then((ergebnis) => {
        sessionStorage.removeItem("marktplatz_state");
        setMeldung(`${ergebnis.name}-Konto erfolgreich verbunden.`);
        setFertig(true);
      })
      .catch((fehler: unknown) => {
        setMeldung(
          fehler instanceof Error
            ? fehler.message
            : "Die Verbindung konnte nicht abgeschlossen werden.",
        );
        setFertig(true);
      });
  }, [abschliessen, marktplatz]);

  return (
    <AppRahmen titel="Konto verbinden" untertitel="Marktplatz-Verbindung">
      <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm text-card-foreground">
          {!fertig ? <Loader2 className="size-4 animate-spin" /> : null}
          {meldung}
        </p>
        {fertig ? (
          <Button onClick={() => navigate({ to: "/einstellungen", replace: true })}>
            Zu den Einstellungen
          </Button>
        ) : null}
      </div>
    </AppRahmen>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppRahmen } from "@/components/AppRahmen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  Chrome,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Hammer,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { istAndroidApp, istErweiterungAktiv } from "@/lib/assistent";
import { useIsMobile } from "@/hooks/use-mobile";

const SPEICHER_SCHLUESSEL = "assistent.github";
type GitHubPruefung = "offen" | "laeuft" | "ok" | "ohne-workflow" | "nicht-gefunden";

export const Route = createFileRoute("/_authenticated/assistent")({
  head: () => ({
    meta: [
      { title: "Verkaufs-Assistent einrichten – Wiederverkauf-Assistent" },
      {
        name: "description",
        content:
          "Richte den Verkaufs-Assistenten für Android und Chrome ein und veröffentliche Anzeigen mit einem Tippen.",
      },
      { property: "og:title", content: "Verkaufs-Assistent einrichten" },
      {
        property: "og:description",
        content: "Anzeigen mit einem Tippen bei eBay, Kleinanzeigen und Vinted einstellen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistentSeite,
});

function AssistentSeite() {
  const mobil = useIsMobile();
  const [erweiterung, setErweiterung] = useState(false);
  const [android, setAndroid] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [repo, setRepo] = useState("");
  const [eingabe, setEingabe] = useState("");
  const [pruefung, setPruefung] = useState<GitHubPruefung>("offen");
  const [pruefDurchlauf, setPruefDurchlauf] = useState(0);

  useEffect(() => {
    setErweiterung(istErweiterungAktiv());
    setAndroid(istAndroidApp());
    const gespeichert = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
    if (gespeichert) {
      setRepo(gespeichert);
      setEingabe(gespeichert);
    }
  }, []);

  useEffect(() => {
    if (!repo) {
      setPruefung("offen");
      return;
    }

    let abgebrochen = false;
    const pruefen = async () => {
      setPruefung("laeuft");
      try {
        const projektAntwort = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!projektAntwort.ok) {
          if (!abgebrochen) setPruefung("nicht-gefunden");
          return;
        }

        const workflowAntwort = await fetch(
          `https://api.github.com/repos/${repo}/contents/.github/workflows/android.yml`,
          { headers: { Accept: "application/vnd.github+json" } },
        );
        if (!abgebrochen) setPruefung(workflowAntwort.ok ? "ok" : "ohne-workflow");
      } catch {
        if (!abgebrochen) setPruefung("nicht-gefunden");
      }
    };

    void pruefen();
    return () => {
      abgebrochen = true;
    };
  }, [repo, pruefDurchlauf]);

  const repoSpeichern = () => {
    const wert = eingabe
      .trim()
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/+$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(wert)) {
      toast.error("Bitte die Adresse als „name/projekt“ eingeben.");
      return;
    }
    window.localStorage.setItem(SPEICHER_SCHLUESSEL, wert);
    setRepo(wert);
    setEingabe(wert);
    toast.success("Gespeichert – die GitHub-Verbindung wird geprüft.");
  };

  const repoAendern = () => {
    window.localStorage.removeItem(SPEICHER_SCHLUESSEL);
    setRepo("");
    setPruefung("offen");
  };

  const projektUrl = `https://github.com/${repo}`;
  const actionsUrl = `${projektUrl}/actions`;
  const bauUrl = `${actionsUrl}/workflows/android.yml`;
  const apkUrl = `https://github.com/${repo}/releases/latest`;

  const herunterladen = () => {
    if (mobil) {
      toast.info(
        "Die Erweiterung läuft nur im Chrome am Rechner. Nutze auf dem Handy die Android-App oben.",
      );
      return;
    }
    setLaedt(true);
    fetch("/inserate-assistent.zip")
      .then((antwort) => {
        if (!antwort.ok) throw new Error("Der Download ist gerade nicht verfügbar.");
        return antwort.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "inserate-assistent.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        toast.success("Download gestartet – die ZIP-Datei liegt in deinen Downloads.");
      })
      .catch((fehler) => {
        toast.error(fehler instanceof Error ? fehler.message : "Download fehlgeschlagen.");
        window.open("/inserate-assistent.zip", "_blank");
      })
      .finally(() => setLaedt(false));
  };

  const androidKarte = (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="size-4" /> Auf dem Handy (Android)
        </CardTitle>
        {android ? (
          <Badge className="gap-1">
            <CheckCircle2 className="size-3" /> Aktiv
          </Badge>
        ) : (
          <Badge variant="secondary">App nötig</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {android ? (
          <p className="text-foreground">
            Du nutzt bereits die Android-App – der Assistent ist hier ohne weitere Einrichtung
            aktiv.
          </p>
        ) : (
          <>
            <p>
              Chrome auf Android kennt keine Erweiterungen. Deshalb gibt es diese App zusätzlich als
              Android-App. Die Installationsdatei (APK) wird auf GitHubs Servern gebaut – du
              brauchst keinen Computer, alles läuft hier im Handy-Browser.
            </p>

            {repo ? (
              <div className="space-y-3">
                <div
                  className={`rounded-md border p-3 ${
                    pruefung === "ok"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-muted"
                  }`}
                >
                  {pruefung === "laeuft" && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Loader2 className="size-4 animate-spin" /> GitHub-Verbindung wird geprüft …
                    </p>
                  )}
                  {pruefung === "ok" && (
                    <p className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="size-4 text-primary" /> Bereit – du kannst die
                      Android-App bauen lassen.
                    </p>
                  )}
                  {pruefung === "ohne-workflow" && (
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 text-foreground">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        Das GitHub-Projekt wurde gefunden, aber der Android-Bauauftrag fehlt dort.
                      </p>
                      <p className="text-xs">
                        Übertrage in Lovable zuerst die neuesten Projektdateien zu GitHub. Öffne dazu
                        unten im Chat das Plus-Menü und wähle „GitHub“.
                      </p>
                    </div>
                  )}
                  {pruefung === "nicht-gefunden" && (
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 text-foreground">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        Dieses Projekt ist noch nicht mit GitHub verbunden, die Adresse stimmt nicht
                        oder das Projekt ist privat.
                      </p>
                      <p className="text-xs">
                        Verbinde das Projekt in Lovable über Plus → GitHub. Bei einem privaten Projekt
                        melde dich zusätzlich bei GitHub an.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="https://github.com/login" target="_blank" rel="noreferrer">
                            Bei GitHub anmelden
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={projektUrl} target="_blank" rel="noreferrer">
                            Projekt öffnen
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {pruefung === "ok" ? (
                  <>
                    <Button className="w-full" asChild>
                      <a href={actionsUrl} target="_blank" rel="noreferrer">
                        <Hammer className="mr-2 size-4" />
                        1. GitHub-Bauübersicht öffnen
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={bauUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 size-4" />
                        Android-Bauauftrag direkt öffnen
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={apkUrl} target="_blank" rel="noreferrer">
                        <Download className="mr-2 size-4" />
                        2. Neueste App-Datei (APK) holen
                      </a>
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" disabled>
                    <Hammer className="mr-2 size-4" />
                    App bauen lassen
                  </Button>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPruefDurchlauf((wert) => wert + 1)}
                  >
                    <RefreshCw className="mr-2 size-3" /> Erneut prüfen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={repoAendern}>
                    GitHub-Adresse ändern ({repo})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                <Label htmlFor="github-repo" className="text-foreground">
                  Einmalig: GitHub-Adresse deines Projekts
                </Label>
                <Input
                  id="github-repo"
                  value={eingabe}
                  onChange={(e) => setEingabe(e.target.value)}
                  placeholder="z. B. stefflon/wiederverkauf-assistent"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <Button className="w-full" onClick={repoSpeichern}>
                  Speichern
                </Button>
                <p className="text-xs">
                  Du findest sie in der Adresszeile deines GitHub-Projekts nach „github.com/“. Das
                  Projekt muss einmal mit GitHub verbunden sein, damit der Bauauftrag dort erscheint.
                </p>
              </div>
            )}

            <ol className="list-decimal space-y-1 pl-5">
              <li>Das Projekt in Lovable über Plus → GitHub einmal mit GitHub verbinden.</li>
              <li>Auf „App bauen lassen“ tippen, dann auf GitHub „Run workflow“ bestätigen.</li>
              <li>5–10 Minuten warten (Seite kann geschlossen werden).</li>
              <li>
                Auf „Neueste App-Datei (APK)“ tippen und{" "}
                <span className="font-mono text-xs">app-debug.apk</span> herunterladen.
              </li>
              <li>
                APK antippen und „Installation aus unbekannten Quellen“ einmalig erlauben – fertig.
              </li>
            </ol>
            <p className="flex items-start gap-2">
              <ExternalLink className="mt-0.5 size-4 shrink-0" />
              Die App zeigt immer automatisch die neueste Version dieser Web-App. Neue Funktionen
              sind sofort da, ohne Neuinstallation.
            </p>
            <p>
              Bis dahin kannst du am Handy normal im Browser arbeiten – die Anzeige wird im Formular
              geöffnet und du fügst die Angaben selbst ein.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  const rechnerKarte = (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Chrome className="size-4" /> Am Rechner (Chrome, Edge, Brave)
        </CardTitle>
        {erweiterung ? (
          <Badge className="gap-1">
            <CheckCircle2 className="size-3" /> Aktiv
          </Badge>
        ) : (
          <Badge variant="secondary">Nur am Rechner</Badge>
        )}
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible {...(mobil ? {} : { defaultValue: "rechner" })}>
          <AccordionItem value="rechner" className="border-none">
            <AccordionTrigger className="py-1 text-sm">
              Chrome-Erweiterung einrichten – nur am Rechner nötig
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Button className="w-full" onClick={herunterladen} disabled={laedt}>
                <Download className="mr-2 size-4" />
                Erweiterung herunterladen
              </Button>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>ZIP-Datei herunterladen und entpacken.</li>
                <li>
                  Im Browser{" "}
                  <span className="font-medium text-foreground">chrome://extensions</span> öffnen.
                </li>
                <li>Oben rechts den „Entwicklermodus“ einschalten.</li>
                <li>Auf „Entpackte Erweiterung laden“ klicken und den entpackten Ordner wählen.</li>
                <li>Fertig – ab jetzt füllt der Assistent die Formulare aus.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

  return (
    <AppRahmen
      titel="Verkaufs-Assistent"
      untertitel="Einmal einrichten, danach mit einem Tippen veröffentlichen"
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">So funktioniert es</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Du tippst in der Anzeige auf „Veröffentlichen“. Der Assistent öffnet das
              Verkaufsformular der Plattform, in dem du bereits angemeldet bist, und trägt Titel,
              Beschreibung, Zustand, Preis und alle Fotos ein.
            </p>
            <p className="flex items-start gap-2 text-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Den letzten Klick auf „Angebot einstellen“ machst immer du selbst – so bleibt das
              verbindliche Angebot in deiner Verantwortung, wie es das deutsche Recht vorsieht.
            </p>
            <p>
              Übertragen werden ausschließlich Anzeigendaten und deine Fotos. Zugangsdaten deiner
              Plattform-Konten sieht der Assistent nie.
            </p>
          </CardContent>
        </Card>

        {mobil ? androidKarte : rechnerKarte}
        {mobil ? rechnerKarte : androidKarte}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unterstützte Plattformen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">eBay</span>,{" "}
              <span className="font-medium text-foreground">Kleinanzeigen</span> und{" "}
              <span className="font-medium text-foreground">Vinted</span> werden ausgefüllt: Titel,
              Beschreibung, Preis, Zustand, Marke und Fotos. Kategorie, Ort bzw. Größe wählst du auf
              der Plattform selbst – den letzten Klick machst immer du.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppRahmen>
  );
}

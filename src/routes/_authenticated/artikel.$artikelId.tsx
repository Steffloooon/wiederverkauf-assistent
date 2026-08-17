import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { artikelAnalysieren, feedbackSpeichern } from "@/lib/ki.functions";
import {
  artikelVeroeffentlichen,
  artikelVeroeffentlichungen,
  marktplatzUebersicht,
} from "@/lib/marktplatz.functions";
import { uebergabeStarten, veroeffentlichungBestaetigen } from "@/lib/uebergabe.functions";
import { verkaufsformularOeffnen } from "@/lib/assistent";
import { AppRahmen } from "@/components/AppRahmen";
import { BildGalerieDialog, type GalerieBild } from "@/components/BildGalerieDialog";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { STATUS_LABEL, euro, zustandLabel } from "@/lib/anzeige";

export const Route = createFileRoute("/_authenticated/artikel/$artikelId")({
  head: () => ({
    meta: [
      { title: "Artikel prüfen – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Inserat prüfen, Preis festlegen, Begründung nachlesen und bei eBay veröffentlichen.",
      },
      { property: "og:title", content: "Artikel prüfen – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Inserat, Preisanalyse und Veröffentlichung." },
    ],
  }),
  component: ArtikelSeite,
});

type PreisStufe = "schnell" | "empfehlung" | "start" | "maximum";

const VERTRAUEN: Record<
  string,
  { label: string; variante: "default" | "secondary" | "outline" }
> = {
  hoch: { label: "Hohe Verlässlichkeit", variante: "default" },
  mittel: { label: "Mittlere Verlässlichkeit", variante: "secondary" },
  niedrig: { label: "Geringe Verlässlichkeit", variante: "outline" },
};

type Marktanalyse = {
  datenlage?: string;
  vergleichsbasis?: string;
  nachfrage?: string;
  seltenheit?: string;
  wertfaktoren?: string[];
  hinweise?: string[];
  rueckfragen?: string[];
  live_marktdaten?: boolean;
  neupreis_min?: number | null;
  neupreis_max?: number | null;
  neupreis_quelle?: string;
  neupreis_guenstigst?: number | null;
  neupreis_guenstigst_quelle?: string;
  gebrauchtpreis_min?: number | null;
  gebrauchtpreis_max?: number | null;
  plattform_preise?: Array<{
    plattform?: string;
    von?: number | null;
    bis?: number | null;
    hinweis?: string;
  }>;
  vergleichsangebote?: Array<{ titel: string; preis: number; waehrung: string; zustand: string }>;
};

function ArtikelSeite() {
  const { artikelId } = Route.useParams();
  const queryClient = useQueryClient();
  const analysieren = useServerFn(artikelAnalysieren);
  const veroeffentlichen = useServerFn(artikelVeroeffentlichen);
  const ladeVeroeffentlichungen = useServerFn(artikelVeroeffentlichungen);
  const feedbackSenden = useServerFn(feedbackSpeichern);
  const starteUebergabe = useServerFn(uebergabeStarten);
  const bestaetigeVeroeffentlichung = useServerFn(veroeffentlichungBestaetigen);

  const [arbeitet, setArbeitet] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [entwurf, setEntwurf] = useState<{
    titel: string;
    beschreibung: string;
    preis: string;
    abschlusstext: string;
  } | null>(null);
  const [abschlussOffen, setAbschlussOffen] = useState(false);
  const [galerieOffen, setGalerieOffen] = useState(false);
  const [galerieIndex, setGalerieIndex] = useState(0);
  const [offeneUebergabe, setOffeneUebergabe] = useState<string | null>(null);



  const { data: artikel, isLoading } = useQuery({
    queryKey: ["artikel", artikelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artikel")
        .select("*")
        .eq("id", artikelId)
        .maybeSingle();
      if (error) throw new Error("Der Artikel konnte nicht geladen werden.");
      if (!data) throw new Error("Artikel nicht gefunden.");
      return data;
    },
  });

  const { data: bilder } = useQuery({
    queryKey: ["artikel-bilder", artikelId],
    queryFn: async () => {
      const { data } = await supabase
        .from("artikel_bilder")
        .select("id, pfad, pfad_original, reihenfolge")
        .eq("artikel_id", artikelId)
        .eq("typ", "produkt")
        .order("reihenfolge", { ascending: true });
      const liste: GalerieBild[] = [];
      for (const bild of data ?? []) {
        const { data: signiert } = await supabase.storage
          .from("artikel-bilder")
          .createSignedUrl(bild.pfad, 3600);
        if (signiert?.signedUrl) {
          liste.push({
            id: bild.id,
            url: signiert.signedUrl,
            reihenfolge: bild.reihenfolge,
            bearbeitet: Boolean(bild.pfad_original),
          });
        }
      }
      return liste;
    },
  });


  const { data: marktplaetze } = useQuery({
    queryKey: ["marktplaetze"],
    queryFn: () => marktplatzUebersicht(),
  });

  const { data: veroeffentlichungen } = useQuery({
    queryKey: ["veroeffentlichungen", artikelId],
    queryFn: () => ladeVeroeffentlichungen({ data: { artikelId } }),
  });


  if (isLoading || !artikel) {
    return (
      <AppRahmen titel="Artikel" untertitel="Wird geladen …">
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppRahmen>
    );
  }

  const werte = entwurf ?? {
    titel: artikel.titel ?? "",
    beschreibung: artikel.beschreibung ?? "",
    preis: artikel.preis_empfehlung ? String(artikel.preis_empfehlung) : "",
    abschlusstext: artikel.abschlusstext ?? "",
  };
  const analyse = (artikel.marktanalyse ?? {}) as Marktanalyse;
  const ebay = marktplaetze?.find((m) => m.id === "ebay");

  const setzen = (feld: "titel" | "beschreibung" | "preis" | "abschlusstext", wert: string) =>
    setEntwurf({ ...werte, [feld]: wert });

  const erklaerungen = (artikel.preis_erklaerungen ?? {}) as Partial<
    Record<PreisStufe, string>
  >;

  const preisStufen: Array<{
    schluessel: PreisStufe;
    label: string;
    wert: number | null;
    erklaerung: string;
  }> = [
    {
      schluessel: "schnell",
      label: "Schnellverkauf",
      wert: artikel.preis_schnell,
      erklaerung: erklaerungen["schnell"] || "Schnellster zu erwartender Verkauf.",
    },
    {
      schluessel: "empfehlung",
      label: "Empfehlung",
      wert: artikel.preis_empfehlung,
      erklaerung:
        erklaerungen["empfehlung"] || "Beste Balance zwischen Gewinn und Verkaufsgeschwindigkeit.",
    },
    {
      schluessel: "start",
      label: "Startpreis",
      wert: artikel.preis_start,
      erklaerung: erklaerungen["start"] || "Geeignet für Verhandlungen oder Auktionen.",
    },
    {
      schluessel: "maximum",
      label: "Maximum",
      wert: artikel.preis_maximum,
      erklaerung:
        erklaerungen["maximum"] || "Höchster realistischer Preis, ggf. längere Verkaufsdauer.",
    },
  ];

  const aktuellerPreis = Number(werte.preis.replace(",", "."));
  const gewaehlteStufe: PreisStufe | null = Number.isFinite(aktuellerPreis)
    ? (preisStufen.find(
        (s) => s.wert !== null && Math.abs(Number(s.wert) - aktuellerPreis) < 0.01,
      )?.schluessel ?? null)
    : null;

  const stufeWaehlen = (_stufe: PreisStufe, wert: number | null) => {
    if (wert === null) return;
    setzen("preis", String(wert));
  };

  const vertrauen = VERTRAUEN[artikel.preis_vertrauen ?? ""] ?? null;


  const neuAnalysieren = async () => {
    setArbeitet("analyse");
    try {
      const ergebnis = await analysieren({ data: { artikelId } });
      setEntwurf(null);
      await queryClient.invalidateQueries({ queryKey: ["artikel", artikelId] });
      toast.success(
        ergebnis.vergleicheGefunden > 0
          ? `Analyse aktualisiert – ${ergebnis.vergleicheGefunden} Vergleichsangebote berücksichtigt.`
          : "Analyse aktualisiert. Es lagen keine Live-Vergleichsangebote vor.",
      );
    } catch (fehler) {
      toast.error(fehler instanceof Error ? fehler.message : "Die Analyse ist fehlgeschlagen.");
    } finally {
      setArbeitet(null);
    }
  };

  const speichern = async () => {
    const preis = werte.preis.replace(",", ".");
    if (preis && (Number.isNaN(Number(preis)) || Number(preis) <= 0)) {
      toast.error("Bitte gib einen gültigen Preis in Euro ein.");
      return;
    }
    if (werte.abschlusstext.length > 1500) {
      toast.error("Der Abschlusstext darf maximal 1500 Zeichen lang sein.");
      return;
    }
    if (werte.titel.length > 80) {
      toast.error("Der Titel darf maximal 80 Zeichen lang sein.");
      return;
    }
    setArbeitet("speichern");
    const { error } = await supabase
      .from("artikel")
      .update({
        titel: werte.titel.trim() || null,
        beschreibung: werte.beschreibung.trim() || null,
        preis_empfehlung: preis ? Number(preis) : null,
        abschlusstext: werte.abschlusstext.trim() || null,
      })
      .eq("id", artikelId);
    setArbeitet(null);
    if (error) {
      toast.error("Die Änderungen konnten nicht gespeichert werden.");
      return;
    }
    setEntwurf(null);
    await queryClient.invalidateQueries({ queryKey: ["artikel", artikelId] });
    toast.success("Änderungen gespeichert.");
  };


  // Marktplätze nach Verkaufsweg trennen: API = direkt, Browser = Assistent.
  const apiMarktplaetze = (marktplaetze ?? []).filter((m) => m.modus === "api");
  const browserMarktplaetze = (marktplaetze ?? []).filter((m) => m.modus === "browser");

  const jetztVeroeffentlichen = async (marktplatz: string) => {
    setArbeitet("veroeffentlichen");
    try {
      const ergebnis = (await veroeffentlichen({
        data: { artikelId, marktplatz, bestaetigt: true },
      })) as { angebotId: string; url: string | null };
      await queryClient.invalidateQueries({ queryKey: ["artikel", artikelId] });
      await queryClient.invalidateQueries({ queryKey: ["veroeffentlichungen", artikelId] });
      toast.success(`Veröffentlicht (Angebot ${ergebnis.angebotId}).`);
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Die Veröffentlichung ist fehlgeschlagen.",
      );
    } finally {
      setArbeitet(null);
    }
  };

  /** Formular der Plattform öffnen und vom Assistenten ausfüllen lassen. */
  const assistentStarten = async (marktplatz: string, name: string) => {
    setArbeitet(`uebergabe-${marktplatz}`);
    try {
      const uebergabe = await starteUebergabe({ data: { artikelId, marktplatz } });
      const { weg } = await verkaufsformularOeffnen(uebergabe.formularUrl, uebergabe.token);
      setOffeneUebergabe(marktplatz);
      toast.success(
        weg === "android"
          ? `${name} wird geöffnet – der Assistent füllt das Formular aus.`
          : `${name} in neuem Tab geöffnet – der Assistent füllt das Formular aus.`,
      );
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Die Übergabe konnte nicht gestartet werden.",
      );
    } finally {
      setArbeitet(null);
    }
  };

  /** Nutzer bestätigt, dass das Angebot auf der Plattform online ist. */
  const alsVeroeffentlichtMerken = async (marktplatz: string, name: string) => {
    setArbeitet("bestaetigen");
    try {
      await bestaetigeVeroeffentlichung({ data: { artikelId, marktplatz } });
      setOffeneUebergabe(null);
      await queryClient.invalidateQueries({ queryKey: ["artikel", artikelId] });
      await queryClient.invalidateQueries({ queryKey: ["veroeffentlichungen", artikelId] });
      toast.success(`Als bei ${name} veröffentlicht gespeichert.`);
    } catch (fehler) {
      toast.error(fehler instanceof Error ? fehler.message : "Speichern fehlgeschlagen.");
    } finally {
      setArbeitet(null);
    }
  };


  const feedbackAbsenden = async () => {
    setArbeitet("feedback");
    try {
      const ergebnis = await feedbackSenden({ data: { artikelId, feedback } });
      setFeedback("");
      toast.success(
        ergebnis.neueRegeln > 0
          ? `${ergebnis.antwort} (${ergebnis.neueRegeln} neue Regel(n) gespeichert)`
          : ergebnis.antwort,
      );
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Das Feedback konnte nicht gespeichert werden.",
      );
    } finally {
      setArbeitet(null);
    }
  };

  return (
    <AppRahmen
      titel={artikel.titel || "Artikel prüfen"}
      untertitel={`${zustandLabel(artikel.zustand)} · ${STATUS_LABEL[artikel.status] ?? artikel.status}`}
      aktion={
        <Button variant="outline" onClick={neuAnalysieren} disabled={arbeitet !== null}>
          {arbeitet === "analyse" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Neu analysieren
        </Button>
      }
    >
      <div className="space-y-5">
        {bilder && bilder.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {bilder.map((bild, index) => (
                <button
                  key={bild.id}
                  type="button"
                  onClick={() => {
                    setGalerieIndex(index);
                    setGalerieOffen(true);
                  }}
                  aria-label={`Foto ${index + 1} groß anzeigen und bearbeiten`}
                  className="relative h-28 w-28 flex-none overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
                >
                  <img
                    src={bild.url}
                    alt={`Produktfoto ${index + 1} von ${artikel.titel ?? "Artikel"}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  {bild.bearbeitet ? (
                    <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px]">
                      Bearbeitet
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Foto antippen, um es groß anzusehen, zu bearbeiten oder herunterzuladen.
            </p>
            <BildGalerieDialog
              offen={galerieOffen}
              onOffenChange={setGalerieOffen}
              bilder={bilder}
              startIndex={galerieIndex}
              artikelId={artikelId}
              onAktualisiert={() => {
                void queryClient.invalidateQueries({ queryKey: ["artikel-bilder", artikelId] });
              }}
            />
          </div>
        ) : null}


        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inserat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel ({werte.titel.length}/80 Zeichen)</Label>
              <Input
                id="titel"
                maxLength={80}
                value={werte.titel}
                onChange={(e) => setzen("titel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <Textarea
                id="beschreibung"
                rows={12}
                value={werte.beschreibung}
                onChange={(e) => setzen("beschreibung", e.target.value)}
              />
            </div>
            <div className="rounded-lg border border-border p-3">
              {abschlussOffen ? (
                <div className="space-y-2">
                  <Label htmlFor="abschlusstext">Abschlusstext für diese Anzeige</Label>
                  <Textarea
                    id="abschlusstext"
                    rows={6}
                    maxLength={1500}
                    value={werte.abschlusstext}
                    onChange={(e) => setzen("abschlusstext", e.target.value)}
                    placeholder="Dieser Text steht am Ende dieser Anzeige."
                  />
                  <p className="text-xs text-muted-foreground">
                    Gilt nur für diese Anzeige. Leer lassen, damit der Standard-Abschlusstext aus
                    den Einstellungen genutzt wird.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setAbschlussOffen(false)}>
                    Ausblenden
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAbschlussOffen(true)}>
                  Standardtext anpassen
                </Button>
              )}
            </div>
            {artikel.suchbegriffe && artikel.suchbegriffe.length > 0 ? (
              <div>
                <Label className="mb-2 block">Suchbegriffe</Label>
                <div className="flex flex-wrap gap-1.5">
                  {artikel.suchbegriffe.map((begriff) => (
                    <Badge key={begriff} variant="secondary">
                      {begriff}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {artikel.fehlende_angaben && artikel.fehlende_angaben.length > 0 ? (
              <div className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-sm font-medium">Bitte noch prüfen oder ergänzen</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {artikel.fehlende_angaben.map((angabe) => (
                    <li key={angabe}>{angabe}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Preisanalyse
              {vertrauen ? (
                <Badge variant={vertrauen.variante}>{vertrauen.label}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {preisStufen.map((eintrag) => {
                const aktiv = gewaehlteStufe === eintrag.schluessel;
                return (
                  <button
                    key={eintrag.schluessel}
                    type="button"
                    disabled={eintrag.wert === null}
                    aria-pressed={aktiv}
                    onClick={() => stufeWaehlen(eintrag.schluessel, eintrag.wert)}
                    className={
                      aktiv
                        ? "rounded-lg border-2 border-primary bg-primary/10 p-3 text-left transition-colors"
                        : "rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-50"
                    }
                  >
                    <p className="text-xs text-muted-foreground">{eintrag.label}</p>
                    <p className="font-display text-lg font-bold">{euro(eintrag.wert)}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {eintrag.erklaerung}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preis">
                Verkaufspreis festlegen (€) ·{" "}
                <span className="text-muted-foreground">
                  {gewaehlteStufe
                    ? (preisStufen.find((s) => s.schluessel === gewaehlteStufe)?.label ?? "")
                    : "Eigener Preis"}
                </span>
              </Label>
              <Input
                id="preis"
                inputMode="decimal"
                value={werte.preis}
                onChange={(e) => setzen("preis", e.target.value)}
                placeholder="z. B. 89,90"
              />
            </div>

            {analyse.neupreis_min || analyse.gebrauchtpreis_min ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {analyse.neupreis_min ? (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Neupreis in Deutschland</p>
                    <p className="text-sm font-semibold">
                      {euro(analyse.neupreis_min)} – {euro(analyse.neupreis_max)}
                    </p>
                    {analyse.neupreis_quelle ? (
                      <p className="mt-1 text-xs text-muted-foreground">{analyse.neupreis_quelle}</p>
                    ) : null}
                  </div>
                ) : null}
                {analyse.neupreis_guenstigst ? (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Günstigster Neupreis am Markt</p>
                    <p className="text-sm font-semibold">{euro(analyse.neupreis_guenstigst)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analyse.neupreis_guenstigst_quelle ||
                        "Obergrenze für alle Preisvorschläge – gebraucht liegt immer darunter."}
                    </p>
                  </div>
                ) : null}
                {analyse.gebrauchtpreis_min ? (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Üblicher Gebrauchtpreis</p>
                    <p className="text-sm font-semibold">
                      {euro(analyse.gebrauchtpreis_min)} – {euro(analyse.gebrauchtpreis_max)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Basis: eBay & Kleinanzeigen, Zustand berücksichtigt
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {analyse.plattform_preise && analyse.plattform_preise.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Gebrauchtpreise nach Plattform</p>
                <div className="space-y-2">
                  {analyse.plattform_preise.map((p) => (
                    <div
                      key={p.plattform ?? Math.random().toString()}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{p.plattform}</span>
                        <span className="text-sm font-semibold">
                          {euro(p.von)} – {euro(p.bis)}
                        </span>
                      </div>
                      {p.hinweis ? (
                        <p className="mt-1 text-xs text-muted-foreground">{p.hinweis}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {artikel.preis_begruendung ? (
              <div className="rounded-lg bg-secondary p-3 text-sm leading-relaxed text-secondary-foreground">
                <p className="mb-1 font-medium">So kommt der Preis zustande</p>
                {artikel.preis_begruendung}
              </div>
            ) : null}


            <Accordion type="single" collapsible>
              <AccordionItem value="details">
                <AccordionTrigger className="text-sm">Marktanalyse im Detail</AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                  {analyse.datenlage ? (
                    <p>
                      <span className="font-medium text-foreground">Datenlage: </span>
                      {analyse.datenlage}
                    </p>
                  ) : null}
                  {analyse.vergleichsbasis ? (
                    <p>
                      <span className="font-medium text-foreground">Vergleichsbasis: </span>
                      {analyse.vergleichsbasis}
                    </p>
                  ) : null}
                  {analyse.nachfrage ? (
                    <p>
                      <span className="font-medium text-foreground">Nachfrage: </span>
                      {analyse.nachfrage}
                    </p>
                  ) : null}
                  {analyse.seltenheit ? (
                    <p>
                      <span className="font-medium text-foreground">Seltenheit: </span>
                      {analyse.seltenheit}
                    </p>
                  ) : null}
                  {artikel.verkaufsgeschwindigkeit ? (
                    <p>
                      <span className="font-medium text-foreground">Erwartete Verkaufsdauer: </span>
                      {artikel.verkaufsgeschwindigkeit}
                    </p>
                  ) : null}
                  {analyse.wertfaktoren && analyse.wertfaktoren.length > 0 ? (
                    <div>
                      <p className="font-medium text-foreground">Wertfaktoren</p>
                      <ul className="mt-1 list-disc pl-5">
                        {analyse.wertfaktoren.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {analyse.vergleichsangebote && analyse.vergleichsangebote.length > 0 ? (
                    <div>
                      <p className="font-medium text-foreground">
                        Berücksichtigte Vergleichsangebote
                      </p>
                      <ul className="mt-1 space-y-1">
                        {analyse.vergleichsangebote.map((v) => (
                          <li key={v.titel}>
                            {euro(v.preis)} · {v.zustand} · {v.titel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>
                      Es lagen keine Live-Vergleichsangebote vor. Sobald ein eBay-Konto verbunden
                      ist, werden aktuelle Angebotspreise automatisch einbezogen.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Veröffentlichen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {veroeffentlichungen && veroeffentlichungen.length > 0
              ? veroeffentlichungen.map((v) => (
                  <div key={v.marktplatz} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">Veröffentlicht bei {v.name}.</p>
                    {v.url ? (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-primary underline"
                      >
                        Angebot ansehen <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                ))
              : null}

            {browserMarktplaetze.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ein Tippen genügt: Das Verkaufsformular öffnet sich und der Assistent trägt Titel,
                  Beschreibung, Preis und Fotos ein. Abgeschickt wird bewusst von dir –
                  so bleibt das verbindliche Angebot in deiner Hand.
                </p>
                {browserMarktplaetze.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <Button
                      className="w-full"
                      variant={m.id === "ebay" ? "default" : "secondary"}
                      disabled={arbeitet !== null}
                      onClick={() => assistentStarten(m.id, m.name)}
                    >
                      {arbeitet === `uebergabe-${m.id}` ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      Bei {m.name} veröffentlichen
                    </Button>
                    {offeneUebergabe === m.id ? (
                      <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                        <p>
                          Formular für {m.name} geöffnet. Sobald das Angebot online ist, kannst du es
                          hier festhalten.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          disabled={arbeitet !== null}
                          onClick={() => alsVeroeffentlichtMerken(m.id, m.name)}
                        >
                          <CheckCircle2 className="mr-2 size-4" />
                          Ist online
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Am Rechner braucht Chrome einmalig die Erweiterung, auf dem Handy die Android-App.{" "}
                  <Link to="/assistent" className="text-primary underline">
                    Assistent einrichten
                  </Link>
                </p>
              </div>
            ) : null}

            {apiMarktplaetze.map((m) => (
              <AlertDialog key={m.id}>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={arbeitet !== null}>
                    {arbeitet === "veroeffentlichen" ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    Direkt bei {m.name} veröffentlichen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Angebot verbindlich einstellen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Das Angebot wird sofort bei {m.name} veröffentlicht und ist damit ein
                      verbindliches Verkaufsangebot. Bitte prüfe Titel, Beschreibung, Mängelangaben
                      und Preis ({euro(werte.preis.replace(",", "."))}) sowie deine
                      Pflichtinformationen (Widerrufsrecht, Impressum) im Konto der Plattform.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => jetztVeroeffentlichen(m.id)}>
                      Jetzt veröffentlichen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}

            {browserMarktplaetze.length === 0 && apiMarktplaetze.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Für diesen Artikel ist noch kein Verkaufsweg aktiv.{" "}
                <Link to="/einstellungen" className="text-primary underline">
                  Zu den Einstellungen
                </Link>
              </p>
            ) : null}

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedback an die KI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sag der KI, was dir nicht gefällt – daraus werden dauerhafte Regeln für alle künftigen
              Inserate. Zum Beispiel: „Titel immer mit Zustand am Ende“ oder „Preise bei Werkzeug 10 %
              höher ansetzen“.
            </p>
            <Textarea
              rows={3}
              maxLength={1000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Dein Feedback …"
            />
            <Button
              variant="secondary"
              onClick={feedbackAbsenden}
              disabled={arbeitet !== null || feedback.trim().length < 3}
            >
              {arbeitet === "feedback" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Feedback als Regel speichern
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-20 z-20 mt-5 md:bottom-4">
        <Button size="lg" className="w-full" onClick={speichern} disabled={arbeitet !== null}>
          {arbeitet === "speichern" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Änderungen speichern
        </Button>
      </div>
    </AppRahmen>
  );
}

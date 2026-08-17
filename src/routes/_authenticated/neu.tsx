import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { artikelAnalysieren } from "@/lib/ki.functions";
import { bilderOptimieren } from "@/lib/bilder.functions";
import { AppRahmen } from "@/components/AppRahmen";
import { BildOptimierungDialog } from "@/components/BildOptimierungDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImagePlus, ScanLine, Sparkles, Wand2, X } from "lucide-react";
import { ZUSTAENDE, istNeuZustand } from "@/lib/anzeige";
import {
  MODUS_LABEL,
  STANDARD_EINSTELLUNGEN,
  anzahlZuBearbeiten,
  type OptimierungsEinstellungen,
} from "@/lib/bildoptimierung";

export const Route = createFileRoute("/_authenticated/neu")({
  head: () => ({
    meta: [
      { title: "Neuer Artikel – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Fotos hochladen, Angaben ergänzen und das Inserat von der KI erstellen lassen.",
      },
      { property: "og:title", content: "Neuer Artikel – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Inserat mit KI erstellen: Titel, Text, Preis." },
    ],
  }),
  component: NeuSeite,
});

const MAX_BILDER = 8;
const MAX_ERKENNUNG = 6;
const MAX_GROESSE = 10 * 1024 * 1024;

function NeuSeite() {
  const navigate = useNavigate();
  const analysieren = useServerFn(artikelAnalysieren);
  const optimieren = useServerFn(bilderOptimieren);

  const [bilder, setBilder] = useState<File[]>([]);
  const [vorschau, setVorschau] = useState<string[]>([]);
  const [erkennung, setErkennung] = useState<File[]>([]);
  const [erkennungVorschau, setErkennungVorschau] = useState<string[]>([]);
  const [optimierungOffen, setOptimierungOffen] = useState(false);
  const [optimierung, setOptimierung] = useState<OptimierungsEinstellungen>(
    STANDARD_EINSTELLUNGEN,
  );
  const [zustand, setZustand] = useState<string>("");
  const [marke, setMarke] = useState("");
  const [modell, setModell] = useState("");
  const [details, setDetails] = useState("");
  const [maengel, setMaengel] = useState("");
  const [zubehoer, setZubehoer] = useState("");
  const [notizen, setNotizen] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [schritt, setSchritt] = useState<string>("");


  const bilderWaehlen = (dateien: FileList | null) => {
    if (!dateien) return;
    const neue: File[] = [];
    for (const datei of Array.from(dateien)) {
      if (!datei.type.startsWith("image/")) {
        toast.error(`„${datei.name}“ ist kein Bild und wurde übersprungen.`);
        continue;
      }
      if (datei.size > MAX_GROESSE) {
        toast.error(`„${datei.name}“ ist größer als 10 MB und wurde übersprungen.`);
        continue;
      }
      neue.push(datei);
    }
    const gesamt = [...bilder, ...neue].slice(0, MAX_BILDER);
    if (bilder.length + neue.length > MAX_BILDER) {
      toast.info(`Es werden maximal ${MAX_BILDER} Fotos verwendet.`);
    }
    setBilder(gesamt);
    setVorschau(gesamt.map((d) => URL.createObjectURL(d)));
  };

  const bildEntfernen = (index: number) => {
    const rest = bilder.filter((_, i) => i !== index);
    setBilder(rest);
    setVorschau(rest.map((d) => URL.createObjectURL(d)));
    setOptimierung({ ...optimierung, einzeln: {} });
  };

  const erkennungWaehlen = (dateien: FileList | null) => {
    if (!dateien) return;
    const neue = Array.from(dateien).filter(
      (d) => d.type.startsWith("image/") && d.size <= MAX_GROESSE,
    );
    const gesamt = [...erkennung, ...neue].slice(0, MAX_ERKENNUNG);
    setErkennung(gesamt);
    setErkennungVorschau(gesamt.map((d) => URL.createObjectURL(d)));
  };

  const erkennungEntfernen = (index: number) => {
    const rest = erkennung.filter((_, i) => i !== index);
    setErkennung(rest);
    setErkennungVorschau(rest.map((d) => URL.createObjectURL(d)));
  };

  const zuOptimieren = anzahlZuBearbeiten(optimierung, bilder.length);

  const absenden = async (event: React.FormEvent) => {
    event.preventDefault();
    if (bilder.length === 0) {
      toast.error("Bitte lade mindestens ein Foto hoch.");
      return;
    }
    if (!zustand) {
      toast.error("Bitte wähle den Zustand aus.");
      return;
    }

    setLaedt(true);
    try {
      const { data: sitzung } = await supabase.auth.getUser();
      const userId = sitzung.user?.id;
      if (!userId) throw new Error("Bitte melde dich erneut an.");

      setSchritt("Artikel wird angelegt …");
      const { data: artikel, error: fehler } = await supabase
        .from("artikel")
        .insert({
          user_id: userId,
          zustand: zustand as never,
          ist_neu: istNeuZustand(zustand),
          marke: marke.trim() || null,
          modell: modell.trim() || null,
          details: details.trim() || null,
          maengel: maengel.trim() || null,
          zubehoer: zubehoer.trim() || null,
          notizen: notizen.trim() || null,
        })
        .select("id")
        .single();
      if (fehler || !artikel) throw new Error("Der Artikel konnte nicht angelegt werden.");

      setSchritt("Fotos werden hochgeladen …");
      for (let i = 0; i < bilder.length; i++) {
        const datei = bilder[i]!;
        const endung = datei.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const pfad = `${userId}/${artikel.id}/${Date.now()}-${i}.${endung}`;
        const { error: uploadFehler } = await supabase.storage
          .from("artikel-bilder")
          .upload(pfad, datei, { contentType: datei.type, upsert: false });
        if (uploadFehler) throw new Error(`Das Foto ${i + 1} konnte nicht hochgeladen werden.`);
        await supabase
          .from("artikel_bilder")
          .insert({ artikel_id: artikel.id, user_id: userId, pfad, reihenfolge: i, typ: "produkt" });
      }

      for (let i = 0; i < erkennung.length; i++) {
        const datei = erkennung[i]!;
        const endung = datei.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const pfad = `${userId}/${artikel.id}/erkennung-${Date.now()}-${i}.${endung}`;
        const { error: uploadFehler } = await supabase.storage
          .from("artikel-bilder")
          .upload(pfad, datei, { contentType: datei.type, upsert: false });
        if (!uploadFehler) {
          await supabase.from("artikel_bilder").insert({
            artikel_id: artikel.id,
            user_id: userId,
            pfad,
            reihenfolge: i,
            typ: "erkennung",
          });
        }
      }

      if (zuOptimieren > 0) {
        setSchritt(`Fotos werden optimiert (${zuOptimieren}) …`);
        try {
          await optimieren({ data: { artikelId: artikel.id, einstellungen: optimierung } });
        } catch (fehlerBild) {
          toast.error(
            fehlerBild instanceof Error
              ? fehlerBild.message
              : "Die Bildoptimierung ist fehlgeschlagen. Die Originalfotos bleiben erhalten.",
          );
        }
      }

      setSchritt("KI analysiert Artikel und Marktpreise …");
      await analysieren({ data: { artikelId: artikel.id } });

      toast.success("Inserat und Preisempfehlung sind fertig.");
      navigate({ to: "/artikel/$artikelId", params: { artikelId: artikel.id } });
    } catch (fehler) {
      const nachricht =
        fehler instanceof Error ? fehler.message : "Es ist ein unbekannter Fehler aufgetreten.";
      toast.error(nachricht);
    } finally {
      setLaedt(false);
      setSchritt("");
    }
  };


  return (
    <AppRahmen
      titel="Neuer Artikel"
      untertitel="Fotos und wenige Angaben genügen – den Rest übernimmt die KI."
    >
      <form onSubmit={absenden} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Fotos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 px-4 py-8 text-center transition-colors hover:border-primary/60">
              <ImagePlus className="size-7 text-muted-foreground" />
              <span className="text-sm font-medium">Fotos aufnehmen oder auswählen</span>
              <span className="text-xs text-muted-foreground">
                Bis zu {MAX_BILDER} Fotos, je max. 10 MB. Tipp: Etikett, Mängel und Zubehör
                mitfotografieren.
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => bilderWaehlen(e.target.files)}
              />
            </label>

            {vorschau.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {vorschau.map((url, index) => (
                  <div key={url} className="relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={url}
                      alt={`Produktfoto ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => bildEntfernen(index)}
                      aria-label={`Foto ${index + 1} entfernen`}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {vorschau.length > 0 ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOptimierungOffen(true)}
                >
                  <Wand2 className="mr-2 size-4" />
                  Fotos optimieren
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {zuOptimieren > 0
                    ? `${MODUS_LABEL[optimierung.global.modus]} · ${zuOptimieren} von ${bilder.length} Foto(s) werden bearbeitet.`
                    : "Aktuell werden die Fotos unverändert übernommen."}
                </p>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <ScanLine className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">KI-Erkennungsbilder (optional)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Verpackung, Etiketten, Barcodes, Seriennummern, Artikelnummern oder Typenschilder
                hochladen. Die KI nutzt diese Bilder nur zur Produkterkennung – sie werden nie im
                Inserat veröffentlicht.
              </p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/60">
                <ImagePlus className="size-4" />
                Erkennungsbilder auswählen (max. {MAX_ERKENNUNG})
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => erkennungWaehlen(e.target.files)}
                />
              </label>
              {erkennungVorschau.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {erkennungVorschau.map((url, index) => (
                    <div key={url} className="relative overflow-hidden rounded-lg border border-border">
                      <img
                        src={url}
                        alt={`Erkennungsbild ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => erkennungEntfernen(index)}
                        aria-label={`Erkennungsbild ${index + 1} entfernen`}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <BildOptimierungDialog
          offen={optimierungOffen}
          onOffenChange={setOptimierungOffen}
          vorschau={vorschau}
          einstellungen={optimierung}
          onSpeichern={setOptimierung}
        />


        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Angaben zum Artikel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zustand">
                Zustand <span className="text-destructive">*</span>
              </Label>
              <Select value={zustand} onValueChange={setZustand}>
                <SelectTrigger id="zustand">
                  <SelectValue placeholder="Zustand wählen (Pflichtangabe)" />
                </SelectTrigger>
                <SelectContent>
                  {ZUSTAENDE.map((z) => (
                    <SelectItem key={z.wert} value={z.wert}>
                      {z.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pflichtangabe. Der Zustand steuert die Preisanalyse: Neuware wird nur mit Neuware
                verglichen, Gebrauchtware nur mit Gebrauchtware.
              </p>
            </div>


            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marke">Marke (optional)</Label>
                <Input
                  id="marke"
                  maxLength={80}
                  value={marke}
                  onChange={(e) => setMarke(e.target.value)}
                  placeholder="z. B. Bosch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modell">Modell / Typ (optional)</Label>
                <Input
                  id="modell"
                  maxLength={120}
                  value={modell}
                  onChange={(e) => setModell(e.target.value)}
                  placeholder="z. B. GSR 18V-55"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Was ist es? Wichtige Details (optional)</Label>
              <Textarea
                id="details"
                maxLength={1500}
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="z. B. Akku-Bohrschrauber mit 2 Akkus, Ladegerät und Koffer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maengel">Mängel / Gebrauchsspuren (wichtig für Rechtssicherheit)</Label>
              <Textarea
                id="maengel"
                maxLength={1000}
                rows={2}
                value={maengel}
                onChange={(e) => setMaengel(e.target.value)}
                placeholder="z. B. Kratzer am Gehäuse, Akku hält kürzer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zubehoer">Lieferumfang / Zubehör (optional)</Label>
              <Input
                id="zubehoer"
                maxLength={300}
                value={zubehoer}
                onChange={(e) => setZubehoer(e.target.value)}
                placeholder="z. B. Ladekabel, Anleitung"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notizen">Eigene Notizen für die KI (optional)</Label>
              <Textarea
                id="notizen"
                maxLength={1000}
                rows={2}
                value={notizen}
                onChange={(e) => setNotizen(e.target.value)}
                placeholder="z. B. soll schnell verkauft werden"
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-20 z-20 md:bottom-4">
          <Button type="submit" size="lg" className="w-full" disabled={laedt || !zustand}>
            {laedt ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {laedt ? schritt || "Bitte warten …" : "Inserat mit KI erstellen"}
          </Button>
          {laedt ? (
            <div className="mt-2 rounded-lg border border-border bg-card p-2 shadow-sm">
              <p className="text-center text-xs text-muted-foreground">
                Die KI prüft jetzt Produkt und Marktpreise – das dauert meist ein bis drei Minuten.
                Bitte diese Seite offen lassen.
              </p>
            </div>
          ) : null}
        </div>
      </form>
    </AppRahmen>
  );
}

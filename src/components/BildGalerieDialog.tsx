// Große Bildansicht (Galerie) mit nachträglicher Bearbeitung, Original-Wiederherstellung
// und Download – ergänzt die Bearbeitung während der Anzeigenerstellung.
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BildOptimierungDialog } from "@/components/BildOptimierungDialog";
import { bilderOptimieren } from "@/lib/bilder.functions";
import { bildZuruecksetzen } from "@/lib/artikel.functions";
import {
  STANDARD_EINSTELLUNG,
  type BildEinstellung,
  type OptimierungsEinstellungen,
} from "@/lib/bildoptimierung";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export type GalerieBild = {
  id: string;
  url: string;
  reihenfolge: number;
  bearbeitet: boolean;
};

type Props = {
  offen: boolean;
  onOffenChange: (offen: boolean) => void;
  bilder: GalerieBild[];
  startIndex: number;
  artikelId: string;
  onAktualisiert: () => void;
};

export function BildGalerieDialog({
  offen,
  onOffenChange,
  bilder,
  startIndex,
  artikelId,
  onAktualisiert,
}: Props) {
  const optimieren = useServerFn(bilderOptimieren);
  const zuruecksetzen = useServerFn(bildZuruecksetzen);

  const [index, setIndex] = useState(startIndex);
  const [bearbeitenOffen, setBearbeitenOffen] = useState(false);
  const [arbeitet, setArbeitet] = useState<string | null>(null);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (offen) {
      setIndex(startIndex);
      setAuswahl(new Set());
    }
  }, [offen, startIndex]);

  const aktuell = bilder[Math.min(index, Math.max(bilder.length - 1, 0))];
  if (!aktuell) return null;

  const ausgewaehlteBilder = useMemo(
    () => bilder.filter((b) => auswahl.has(b.id)),
    [bilder, auswahl],
  );

  const blaettern = (richtung: 1 | -1) =>
    setIndex((alt) => (alt + richtung + bilder.length) % bilder.length);

  const toggleAuswahl = (bild: GalerieBild) => {
    setAuswahl((alt) => {
      const neu = new Set(alt);
      if (neu.has(bild.id)) neu.delete(bild.id);
      else neu.add(bild.id);
      return neu;
    });
  };

  const alleAuswaehlen = () => setAuswahl(new Set(bilder.map((b) => b.id)));
  const auswahlAufheben = () => setAuswahl(new Set());

  const zielBilder = ausgewaehlteBilder.length > 0 ? ausgewaehlteBilder : [aktuell];
  const vorschauUrls = zielBilder.map((b) => b.url);

  const speichern = async (einstellungen: OptimierungsEinstellungen) => {
    setArbeitet("optimieren");
    try {
      const einzeln: Record<number, BildEinstellung> = {};

      for (let i = 0; i < zielBilder.length; i++) {
        const bild = zielBilder[i]!;
        const abweichend = einstellungen.einzeln[i];
        einzeln[bild.reihenfolge] = abweichend ?? einstellungen.global;
      }

      const ergebnis = await optimieren({
        data: {
          artikelId,
          einstellungen: {
            global: STANDARD_EINSTELLUNG,
            einzeln,
          },
        },
      });

      if (ergebnis.bearbeitet > 0) {
        toast.success(
          ergebnis.bearbeitet === 1
            ? "Foto wurde optimiert."
            : `${ergebnis.bearbeitet} Fotos wurden optimiert.`,
        );
        setAuswahl(new Set());
        onAktualisiert();
      } else {
        toast.info("Es wurden keine Änderungen ausgewählt.");
      }
    } catch (fehler) {
      toast.error(fehler instanceof Error ? fehler.message : "Die Bearbeitung ist fehlgeschlagen.");
    } finally {
      setArbeitet(null);
    }
  };

  const originalHerstellen = async () => {
    setArbeitet("original");
    try {
      await zuruecksetzen({ data: { bildId: aktuell.id } });
      toast.success("Originalfoto wiederhergestellt.");
      onAktualisiert();
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Das Foto konnte nicht zurückgesetzt werden.",
      );
    } finally {
      setArbeitet(null);
    }
  };

  const herunterladen = async () => {
    setArbeitet("download");
    try {
      const antwort = await fetch(aktuell.url);
      const blob = await antwort.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `foto-${aktuell.reihenfolge + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Der Download ist fehlgeschlagen.");
    } finally {
      setArbeitet(null);
    }
  };

  return (
    <>
      <Dialog open={offen} onOpenChange={onOffenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              Foto {index + 1} von {bilder.length}
              {aktuell.bearbeitet ? <Badge variant="secondary">Bearbeitet</Badge> : null}
            </DialogTitle>
            <DialogDescription>
              Foto nachträglich optimieren, Original wiederherstellen oder herunterladen.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <img
              src={aktuell.url}
              alt={`Produktfoto ${index + 1} in großer Ansicht`}
              className="max-h-[55vh] w-full rounded-lg border border-border object-contain"
            />
            {arbeitet === "optimieren" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm">
                <Loader2 className="size-5 animate-spin" />
                {ausgewaehlteBilder.length > 1
                  ? `Fotos werden bearbeitet …`
                  : `Foto wird bearbeitet …`}
              </div>
            ) : null}
            {bilder.length > 1 ? (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Vorheriges Foto"
                  onClick={() => blaettern(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Nächstes Foto"
                  onClick={() => blaettern(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={() => setBearbeitenOffen(true)} disabled={arbeitet !== null}>
              <Sparkles className="mr-2 size-4" />
              {ausgewaehlteBilder.length > 1
                ? `${ausgewaehlteBilder.length} Fotos bearbeiten`
                : "Bearbeiten"}
            </Button>
            <Button
              variant="outline"
              onClick={originalHerstellen}
              disabled={arbeitet !== null || !aktuell.bearbeitet}
            >
              {arbeitet === "original" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 size-4" />
              )}
              Original
            </Button>
            <Button variant="outline" onClick={herunterladen} disabled={arbeitet !== null}>
              {arbeitet === "download" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Herunterladen
            </Button>
          </div>

          {bilder.length > 1 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alle-auswaehlen"
                    checked={auswahl.size === bilder.length && bilder.length > 0}
                    onCheckedChange={(checked) =>
                      checked === true ? alleAuswaehlen() : auswahlAufheben()
                    }
                  />
                  <label htmlFor="alle-auswaehlen" className="text-sm">
                    {auswahl.size === bilder.length && bilder.length > 0
                      ? "Auswahl aufheben"
                      : "Alle auswählen"}
                  </label>
                </div>
                {auswahl.size > 0 ? (
                  <Badge variant="secondary">{auswahl.size} ausgewählt</Badge>
                ) : null}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {bilder.map((bild, i) => (
                  <div key={bild.id} className="relative flex-none">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Foto ${i + 1} anzeigen`}
                      className={
                        "size-14 overflow-hidden rounded-lg border-2 " +
                        (i === index ? "border-primary" : "border-border")
                      }
                    >
                      <img src={bild.url} alt="" className="size-full object-cover" />
                    </button>
                    <div
                      className="absolute left-1 top-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        aria-label={`Foto ${i + 1} auswählen`}
                        checked={auswahl.has(bild.id)}
                        onCheckedChange={() => toggleAuswahl(bild)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <BildOptimierungDialog
        offen={bearbeitenOffen}
        onOffenChange={setBearbeitenOffen}
        vorschau={vorschauUrls}
        einstellungen={{ global: STANDARD_EINSTELLUNG, einzeln: {} }}
        onSpeichern={speichern}
        beschreibung={
          ausgewaehlteBilder.length > 1
            ? "Gilt für die ausgewählten Fotos. Einzelne Fotos kannst du unten abweichend einstellen."
            : "Gilt für dieses Foto."
        }
      />
    </>
  );
}

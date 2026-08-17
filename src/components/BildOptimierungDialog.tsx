import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Info, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HINTERGRUND_FARBEN,
  LEERER_HINTERGRUND,
  LEERE_OPTIONEN,
  MODUS_LABEL,
  OPTION_LABEL,
  STANDARD_EINSTELLUNG,
  einstellungFuer,
  type BildEinstellung,
  type BildModus,
  type HintergrundModus,
  type OptimierungsEinstellungen,
} from "@/lib/bildoptimierung";

type Props = {
  offen: boolean;
  onOffenChange: (offen: boolean) => void;
  vorschau: string[];
  einstellungen: OptimierungsEinstellungen;
  onSpeichern: (einstellungen: OptimierungsEinstellungen) => void;
  beschreibung?: string;
};

function ModusWahl({
  wert,
  onWert,
  labels = MODUS_LABEL,
  klein = false,
}: {
  wert: string;
  onWert: (wert: never) => void;
  labels?: Record<string, string>;
  klein?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Object.entries(labels).map(([schluessel, label]) => (
        <button
          key={schluessel}
          type="button"
          onClick={() => onWert(schluessel as never)}
          aria-pressed={wert === schluessel}
          className={cn(
            "rounded-lg border px-2 py-2 text-center leading-tight transition-colors",
            klein ? "text-[11px]" : "text-xs font-medium",
            wert === schluessel
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OptionenChips({
  einstellung,
  onEinstellung,
}: {
  einstellung: BildEinstellung;
  onEinstellung: (e: BildEinstellung) => void;
}) {
  const aktiv = einstellung.modus === "manuell";
  return (
    <div className={cn("flex flex-wrap gap-1.5", !aktiv && "pointer-events-none opacity-40")}>
      {OPTION_LABEL.map(({ feld, label }) => {
        const gewaehlt = einstellung.optionen[feld];
        return (
          <button
            key={feld}
            type="button"
            disabled={!aktiv}
            onClick={() =>
              onEinstellung({
                ...einstellung,
                optionen: { ...einstellung.optionen, [feld]: !gewaehlt },
              })
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
              gewaehlt
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {gewaehlt ? <Check className="size-3" /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

function HintergrundBereich({
  einstellung,
  onEinstellung,
}: {
  einstellung: BildEinstellung;
  onEinstellung: (e: BildEinstellung) => void;
}) {
  const manuell = einstellung.hintergrundModus === "manuell";
  const h = einstellung.hintergrund;

  const setzeHintergrund = (teil: Partial<typeof h>) =>
    onEinstellung({ ...einstellung, hintergrund: { ...h, ...teil } });

  const eigenesBildWaehlen = (datei: File | undefined) => {
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => setzeHintergrund({ eigenesBild: String(leser.result), entfernen: true });
    leser.readAsDataURL(datei);
  };

  return (
    <div className="space-y-3">
      <ModusWahl
        wert={einstellung.hintergrundModus}
        onWert={(modus) =>
          onEinstellung({
            ...einstellung,
            hintergrundModus: modus as HintergrundModus,
            hintergrund: modus === "manuell" ? h : LEERER_HINTERGRUND,
          })
        }
        labels={{ auto: "Automatisch", keine: "Keine Änderungen", manuell: "Manuell" }}
      />

      <div className={cn("space-y-3", !manuell && "pointer-events-none opacity-40")}>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={!manuell}
            onClick={() => setzeHintergrund({ verbessern: !h.verbessern })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              h.verbessern
                ? "border-primary bg-primary/10 font-medium"
                : "border-border text-muted-foreground",
            )}
          >
            Hintergrund verbessern
          </button>
          <button
            type="button"
            disabled={!manuell}
            onClick={() =>
              setzeHintergrund({ entfernen: !h.entfernen, farbe: null, eigenesBild: null })
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              h.entfernen && !h.farbe && !h.eigenesBild
                ? "border-primary bg-primary/10 font-medium"
                : "border-border text-muted-foreground",
            )}
          >
            Hintergrund entfernen
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Hintergrundfarbe</Label>
          <div className="flex items-center gap-2">
            {HINTERGRUND_FARBEN.map((farbe) => (
              <button
                key={farbe.wert}
                type="button"
                disabled={!manuell}
                aria-label={farbe.label}
                onClick={() =>
                  setzeHintergrund({
                    farbe: h.farbe === farbe.wert ? null : farbe.wert,
                    eigenesBild: null,
                  })
                }
                style={{ background: farbe.wert }}
                className={cn(
                  "size-8 rounded-full border-2",
                  h.farbe === farbe.wert ? "border-primary" : "border-border",
                )}
              />
            ))}
            <Input
              type="color"
              disabled={!manuell}
              value={h.farbe ?? "#ffffff"}
              onChange={(e) => setzeHintergrund({ farbe: e.target.value, eigenesBild: null })}
              className="h-8 w-12 cursor-pointer p-1"
              aria-label="Eigene Farbe wählen"
            />
          </div>
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground",
            h.eigenesBild && "border-primary text-foreground",
          )}
        >
          <Upload className="size-3.5" />
          {h.eigenesBild ? "Eigener Hintergrund ausgewählt" : "Eigenen Hintergrund hochladen"}
          <input
            type="file"
            accept="image/*"
            disabled={!manuell}
            className="hidden"
            onChange={(e) => eigenesBildWaehlen(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}

export function BildOptimierungDialog({
  offen,
  onOffenChange,
  vorschau,
  einstellungen,
  onSpeichern,
  beschreibung,
}: Props) {
  const [entwurf, setEntwurf] = useState<OptimierungsEinstellungen>(einstellungen);

  const setzeGlobal = (e: BildEinstellung) => setEntwurf({ ...entwurf, global: e });

  const setzeEinzeln = (index: number, e: BildEinstellung | null) => {
    const einzeln = { ...entwurf.einzeln };
    if (e) einzeln[index] = e;
    else delete einzeln[index];
    setEntwurf({ ...entwurf, einzeln });
  };

  return (
    <Dialog
      open={offen}
      onOpenChange={(neu) => {
        if (neu) setEntwurf(einstellungen);
        onOffenChange(neu);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fotos optimieren</DialogTitle>
          <DialogDescription>
            {beschreibung ??
              "Gilt für alle Fotos. Einzelne Fotos kannst du unten abweichend einstellen."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bildoptimierung</Label>
            <ModusWahl
              wert={entwurf.global.modus}
              onWert={(modus) =>
                setzeGlobal({
                  ...entwurf.global,
                  modus: modus as BildModus,
                  optionen: modus === "manuell" ? entwurf.global.optionen : LEERE_OPTIONEN,
                })
              }
            />
            <OptionenChips einstellung={entwurf.global} onEinstellung={setzeGlobal} />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <Label className="text-sm font-medium">Hintergrund (getrennt einstellbar)</Label>
            <HintergrundBereich einstellung={entwurf.global} onEinstellung={setzeGlobal} />
          </div>

          <div className="rounded-lg bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
            <p className="flex items-center gap-1.5 font-medium">
              <Info className="size-3.5" /> Ehrlichkeitsregel
            </p>
            Die KI verbessert nur die Fotoqualität. Kratzer, Dellen, Flecken, Knicke oder Abnutzung
            werden niemals entfernt oder verdeckt.
          </div>

          {vorschau.length > 1 ? (
            <Accordion type="single" collapsible>
              <AccordionItem value="einzeln">
                <AccordionTrigger className="text-sm">
                  Einzelne Fotos abweichend einstellen
                  {Object.keys(entwurf.einzeln).length > 0 ? (
                    <Badge variant="secondary" className="ml-2">
                      {Object.keys(entwurf.einzeln).length}
                    </Badge>
                  ) : null}
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {vorschau.map((url, index) => {
                    const eigen = entwurf.einzeln[index];
                    const wirksam = einstellungFuer(entwurf, index);
                    return (
                      <div key={url} className="flex gap-3">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="size-16 flex-none rounded-lg border border-border object-cover"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <ModusWahl
                            klein
                            wert={eigen ? eigen.modus : "global"}
                            onWert={(modus) => {
                              if (modus === ("global" as never)) return setzeEinzeln(index, null);
                              setzeEinzeln(index, {
                                ...(eigen ?? STANDARD_EINSTELLUNG),
                                modus: modus as BildModus,
                                hintergrundModus:
                                  (eigen ?? STANDARD_EINSTELLUNG).hintergrundModus,
                              });
                            }}
                            labels={{
                              keine: "Keine Änderungen",
                              auto: "Automatisch",
                              manuell: "Manuell",
                            }}
                          />
                          {eigen ? (
                            <>
                              <OptionenChips
                                einstellung={eigen}
                                onEinstellung={(e) => setzeEinzeln(index, e)}
                              />
                              <button
                                type="button"
                                onClick={() => setzeEinzeln(index, null)}
                                className="text-[11px] text-muted-foreground underline"
                              >
                                Wie alle Fotos behandeln
                              </button>
                            </>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Wie alle Fotos: {MODUS_LABEL[wirksam.modus]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onSpeichern(entwurf);
              onOffenChange(false);
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

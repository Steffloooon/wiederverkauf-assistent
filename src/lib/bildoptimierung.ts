// Gemeinsame Typen und Standardwerte für die Bildoptimierung (Client + Server).

export type BildModus = "auto" | "keine" | "manuell";

export type BildOptionen = {
  schaerfe: boolean;
  helligkeit: boolean;
  kontrast: boolean;
  farben: boolean;
  schatten: boolean;
  zuschneiden: boolean;
  zentrieren: boolean;
};

export type HintergrundModus = "auto" | "keine" | "manuell";

export type HintergrundOptionen = {
  verbessern: boolean;
  entfernen: boolean;
  farbe: string | null;
  eigenesBild: string | null;
};

export type BildEinstellung = {
  modus: BildModus;
  optionen: BildOptionen;
  hintergrundModus: HintergrundModus;
  hintergrund: HintergrundOptionen;
};

export type OptimierungsEinstellungen = {
  /** Einstellung für alle Fotos (Variante A). */
  global: BildEinstellung;
  /** Abweichende Einstellungen einzelner Fotos (Variante B), Schlüssel = Reihenfolge. */
  einzeln: Record<number, BildEinstellung>;
};

export const LEERE_OPTIONEN: BildOptionen = {
  schaerfe: false,
  helligkeit: false,
  kontrast: false,
  farben: false,
  schatten: false,
  zuschneiden: false,
  zentrieren: false,
};

export const LEERER_HINTERGRUND: HintergrundOptionen = {
  verbessern: false,
  entfernen: false,
  farbe: null,
  eigenesBild: null,
};

export const STANDARD_EINSTELLUNG: BildEinstellung = {
  modus: "keine",
  optionen: LEERE_OPTIONEN,
  hintergrundModus: "keine",
  hintergrund: LEERER_HINTERGRUND,
};

export const STANDARD_EINSTELLUNGEN: OptimierungsEinstellungen = {
  global: STANDARD_EINSTELLUNG,
  einzeln: {},
};

export const MODUS_LABEL: Record<BildModus, string> = {
  auto: "Automatisch optimieren",
  keine: "Keine Änderungen",
  manuell: "Manuell bearbeiten",
};

export const OPTION_LABEL: Array<{ feld: keyof BildOptionen; label: string }> = [
  { feld: "schaerfe", label: "Schärfe verbessern" },
  { feld: "helligkeit", label: "Helligkeit verbessern" },
  { feld: "kontrast", label: "Kontrast verbessern" },
  { feld: "farben", label: "Farben natürlich verbessern" },
  { feld: "schatten", label: "Schatten verbessern" },
  { feld: "zuschneiden", label: "Zuschneiden" },
  { feld: "zentrieren", label: "Produkt zentrieren" },
];

export const HINTERGRUND_FARBEN: Array<{ wert: string; label: string }> = [
  { wert: "#ffffff", label: "Weiß" },
  { wert: "#d4d4d4", label: "Grau" },
  { wert: "#e8ddcb", label: "Beige" },
  { wert: "#111111", label: "Schwarz" },
];

/** Ermittelt die wirksame Einstellung für ein einzelnes Foto. */
export function einstellungFuer(
  einstellungen: OptimierungsEinstellungen,
  index: number,
): BildEinstellung {
  return einstellungen.einzeln[index] ?? einstellungen.global;
}

/** Muss dieses Foto überhaupt bearbeitet werden? */
export function brauchtBearbeitung(e: BildEinstellung): boolean {
  const bild =
    e.modus === "auto" || (e.modus === "manuell" && Object.values(e.optionen).some(Boolean));
  const hg =
    e.hintergrundModus === "auto" ||
    (e.hintergrundModus === "manuell" &&
      (e.hintergrund.verbessern ||
        e.hintergrund.entfernen ||
        !!e.hintergrund.farbe ||
        !!e.hintergrund.eigenesBild));
  return bild || hg;
}

export function anzahlZuBearbeiten(
  einstellungen: OptimierungsEinstellungen,
  anzahlBilder: number,
): number {
  let n = 0;
  for (let i = 0; i < anzahlBilder; i++) {
    if (brauchtBearbeitung(einstellungFuer(einstellungen, i))) n++;
  }
  return n;
}

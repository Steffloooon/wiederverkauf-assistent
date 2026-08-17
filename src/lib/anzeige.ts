// Gemeinsame deutsche Auswahllisten und Anzeigetexte.
export const ZUSTAENDE = [
  { wert: "neu", label: "Neu (originalverpackt)", neu: true },
  { wert: "neu_sonstige", label: "Neu, sonstige (Rückware, geöffnet)", neu: true },
  { wert: "wie_neu", label: "Wie neu", neu: false },
  { wert: "sehr_gut", label: "Gebraucht – sehr gut", neu: false },
  { wert: "gut", label: "Gebraucht – gut", neu: false },
  { wert: "akzeptabel", label: "Gebraucht – akzeptabel", neu: false },
  { wert: "defekt", label: "Defekt / für Ersatzteile", neu: false },
] as const;

export type ZustandWert = (typeof ZUSTAENDE)[number]["wert"];

export function zustandLabel(wert: string | null): string {
  return ZUSTAENDE.find((z) => z.wert === wert)?.label ?? "Ohne Angabe";
}

export function istNeuZustand(wert: string | null): boolean {
  return ZUSTAENDE.find((z) => z.wert === wert)?.neu ?? false;
}

export const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  analysiert: "Von KI erstellt",
  veroeffentlicht: "Veröffentlicht",
  verkauft: "Verkauft",
};

export const BEREICH_LABEL: Record<string, string> = {
  titel: "Titel",
  beschreibung: "Beschreibung",
  zustand: "Zustand",
  preis: "Preis",
  kategorie: "Kategorie",
  allgemein: "Allgemein",
};

export function euro(wert: number | string | null | undefined): string {
  if (wert === null || wert === undefined || wert === "") return "–";
  const zahl = typeof wert === "string" ? Number(wert) : wert;
  if (Number.isNaN(zahl)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(zahl);
}

export function datumKurz(wert: string | null): string {
  if (!wert) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(wert));
}

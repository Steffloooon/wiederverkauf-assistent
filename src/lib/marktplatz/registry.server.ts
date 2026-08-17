// Registry aller Marktplätze. Neue Plattformen hier ergänzen –
// der Kern der App (Artikel, KI, Preisanalyse) bleibt unverändert.
import { ebayAdapter } from "./ebay.server";
import { kleinanzeigenAdapter } from "./kleinanzeigen.server";
import { vintedAdapter } from "./vinted.server";
import type { MarktplatzAdapter, MarktplatzModus, MarktVergleich } from "./typen";

const geplant = (
  id: string,
  name: string,
  beschreibung: string,
): MarktplatzAdapter => ({
  id,
  name,
  beschreibung,
  verfuegbar: false,
  modi: [],
  istKonfiguriert: () => false,
});

export const marktplaetze: MarktplatzAdapter[] = [
  ebayAdapter,
  kleinanzeigenAdapter,
  vintedAdapter,
  geplant("whatnot", "Whatnot", "Anbindung in Vorbereitung."),
  geplant("tiktok_shop", "TikTok Shop", "Anbindung in Vorbereitung."),
];

export function marktplatzAdapter(id: string): MarktplatzAdapter | undefined {
  return marktplaetze.find((m) => m.id === id);
}

/** Wie ein Marktplatz aktuell veröffentlichen kann. */
export function aktiverModus(adapter: MarktplatzAdapter, verbunden: boolean): MarktplatzModus | null {
  if (adapter.modi.includes("api") && verbunden && adapter.veroeffentlichen) return "api";
  if (adapter.modi.includes("browser") && adapter.formularplan) return "browser";
  return null;
}


/**
 * Sammelt Live-Marktdaten über alle konfigurierten Connectoren.
 * Der Kern fragt nie einen einzelnen Marktplatz direkt an.
 */
export async function marktdatenSammeln(suchbegriff: string): Promise<{
  vergleiche: MarktVergleich[];
  quellen: string[];
}> {
  const aktive = marktplaetze.filter((m) => m.marktdaten && m.istKonfiguriert());
  const ergebnisse = await Promise.all(
    aktive.map(async (m) => {
      try {
        const daten = await m.marktdaten!(suchbegriff);
        return daten.map((d) => ({ ...d, quelle: d.quelle ?? m.id }));
      } catch (fehler) {
        console.error(`[Marktdaten] ${m.id} fehlgeschlagen`, fehler);
        return [] as MarktVergleich[];
      }
    }),
  );

  const vergleiche = ergebnisse.flat();
  const quellen = aktive.filter((_, i) => (ergebnisse[i] ?? []).length > 0).map((m) => m.id);
  return { vergleiche, quellen };
}

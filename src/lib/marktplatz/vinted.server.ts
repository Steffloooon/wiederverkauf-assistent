// Marktplatz-Adapter: Vinted.
//
// Vinted hat keine offene Schnittstelle für Privat- und Kleinverkäufer.
// Deshalb ausschließlich Browser-Modus: das Verkaufsformular wird im eigenen,
// angemeldeten Browser ausgefüllt – abgeschickt wird immer von Hand.
import type { Formularplan, MarktplatzAdapter, VeroeffentlichenEingabe } from "./typen";

/** Zustände des Artikels auf die Vinted-Stufen übersetzen. */
const ZUSTAND_FORMULAR: Record<string, string> = {
  neu: "Neu mit Preisschild",
  neu_sonstige: "Neu ohne Preisschild",
  wie_neu: "Neu ohne Preisschild",
  sehr_gut: "Sehr gut",
  gut: "Gut",
  akzeptabel: "Befriedigend",
  defekt: "Befriedigend",
};

export function vintedPflichtfelder(eingabe: VeroeffentlichenEingabe): string[] {
  const fehlt: string[] = [];
  if (!eingabe.titel.trim()) fehlt.push("Titel");
  if (!eingabe.beschreibung.trim()) fehlt.push("Beschreibung");
  if (!(eingabe.preis > 0)) fehlt.push("Preis");
  if (!eingabe.zustand) fehlt.push("Zustand");
  // Vinted verlangt zwingend mindestens ein Foto.
  if (eingabe.bildUrls.length === 0) fehlt.push("mindestens ein Foto");
  return fehlt;
}

export function vintedFormularplan(eingabe: VeroeffentlichenEingabe): Formularplan {
  const marke = eingabe.marke?.trim() || null;

  return {
    formularUrl: "https://www.vinted.de/items/new",
    bildEingabe: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    hinweis:
      "Kategorie, Größe und Versandpaketgröße wählst du bei Vinted selbst – Titel, Beschreibung, Preis, Zustand und Fotos sind ausgefüllt.",
    felder: [
      {
        schluessel: "titel",
        label: "Titel",
        // Vinted begrenzt den Titel auf 100 Zeichen.
        wert: eingabe.titel.slice(0, 100),
        selektoren: [
          "#title",
          'input[name="title"]',
          'input[id*="title" i]:not([type="hidden"])',
        ],
      },
      {
        schluessel: "beschreibung",
        label: "Beschreibung",
        wert: eingabe.beschreibung.slice(0, 3000),
        selektoren: [
          "#description",
          'textarea[name="description"]',
          'textarea[id*="descr" i]',
          "textarea",
        ],
      },
      {
        schluessel: "preis",
        label: "Preis",
        wert: eingabe.preis.toFixed(2).replace(".", ","),
        selektoren: [
          "#price",
          'input[name="price"]',
          'input[id*="price" i]:not([type="hidden"])',
        ],
      },
      {
        schluessel: "zustand",
        label: "Zustand",
        wert: ZUSTAND_FORMULAR[eingabe.zustand ?? "gut"] ?? "Gut",
        selektoren: [
          "#status",
          'select[id*="status" i]',
          'select[name*="status" i]',
          'select[id*="condition" i]',
        ],
      },
      {
        schluessel: "marke",
        label: "Marke",
        wert: marke,
        selektoren: ["#brand", 'input[name="brand"]', 'input[id*="brand" i]'],
      },
    ],
  };
}

export const vintedAdapter: MarktplatzAdapter = {
  id: "vinted",
  name: "Vinted",
  beschreibung: "Verkaufsformular wird automatisch ausgefüllt – du bestätigst nur noch.",
  verfuegbar: true,
  modi: ["browser"],
  istKonfiguriert: () => true,
  pflichtfelderPruefen: vintedPflichtfelder,
  formularplan: vintedFormularplan,
};

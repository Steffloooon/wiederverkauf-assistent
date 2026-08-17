// Marktplatz-Adapter: Kleinanzeigen.
//
// Kleinanzeigen bietet keine offizielle Schnittstelle für Privat- und
// Kleinverkäufer. Deshalb ausschließlich Browser-Modus: das Anzeigenformular
// wird im eigenen, angemeldeten Browser ausgefüllt.
import type { Formularplan, MarktplatzAdapter, VeroeffentlichenEingabe } from "./typen";

const ZUSTAND_FORMULAR: Record<string, string> = {
  neu: "Neu",
  neu_sonstige: "Neu",
  wie_neu: "Sehr Gut",
  sehr_gut: "Sehr Gut",
  gut: "Gut",
  akzeptabel: "In Ordnung",
  defekt: "Defekt",
};

export function kleinanzeigenPflichtfelder(eingabe: VeroeffentlichenEingabe): string[] {
  const fehlt: string[] = [];
  if (!eingabe.titel.trim()) fehlt.push("Titel");
  if (!eingabe.beschreibung.trim()) fehlt.push("Beschreibung");
  if (!(eingabe.preis > 0)) fehlt.push("Preis");
  return fehlt;
}

export function kleinanzeigenFormularplan(eingabe: VeroeffentlichenEingabe): Formularplan {
  return {
    formularUrl: "https://www.kleinanzeigen.de/p-anzeige-aufgeben.html",
    bildEingabe: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    hinweis:
      "Kategorie, Ort und die Preisart (Festpreis oder VB) prüfst du bei Kleinanzeigen selbst – alles andere ist ausgefüllt.",
    felder: [
      {
        schluessel: "titel",
        label: "Titel",
        wert: eingabe.titel.slice(0, 65),
        selektoren: [
          "#postad-title",
          'input[name="title"]',
          'input[id*="title" i]:not([type="hidden"])',
        ],
      },
      {
        schluessel: "beschreibung",
        label: "Beschreibung",
        wert: eingabe.beschreibung,
        selektoren: [
          "#pstad-descrptn",
          'textarea[name="description"]',
          'textarea[id*="descr" i]',
          "textarea",
        ],
      },
      {
        schluessel: "preis",
        label: "Preis",
        wert: Math.round(eingabe.preis),
        selektoren: ["#pstad-price", 'input[name="price"]', 'input[id*="price" i]'],
      },
      {
        schluessel: "zustand",
        label: "Zustand",
        wert: ZUSTAND_FORMULAR[eingabe.zustand ?? "gut"] ?? "Gut",
        selektoren: [
          'select[id*="condition" i]',
          'select[name*="condition" i]',
          'select[id*="zustand" i]',
          'select[id*="art" i][id*="condition" i]',
        ],
      },
      {
        schluessel: "marke",
        label: "Marke",
        wert: eingabe.marke?.trim() || null,
        selektoren: [
          'input[id*="brand" i]:not([type="hidden"])',
          'input[name*="brand" i]',
          'select[id*="brand" i]',
          'input[id*="marke" i]',
        ],
      },
      {
        schluessel: "preistyp",
        label: "Preisart (Festpreis/VB)",
        wert: "VB",
        selektoren: [
          'select[id*="price_type" i]',
          'select[name*="priceType" i]',
          'select[id*="priceType" i]',
        ],
      },
    ],
  };
}

export const kleinanzeigenAdapter: MarktplatzAdapter = {
  id: "kleinanzeigen",
  name: "Kleinanzeigen",
  beschreibung: "Anzeigenformular wird automatisch ausgefüllt – du bestätigst nur noch.",
  verfuegbar: true,
  modi: ["browser"],
  istKonfiguriert: () => true,
  pflichtfelderPruefen: kleinanzeigenPflichtfelder,
  formularplan: kleinanzeigenFormularplan,
};

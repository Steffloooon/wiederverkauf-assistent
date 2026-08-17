// KI-Logik: Artikelanalyse, Preisanalyse und Feedback-Auswertung.
import { kiAnfrage, kiJson, type KiInhalt, type KiNachricht } from "./ai.server";
import { ANALYSE_PROMPT, FEEDBACK_PROMPT } from "./ki/prompts";
import type { MarktVergleich } from "./marktplatz/typen";

export type AnalyseErgebnis = {
  titel: string;
  beschreibung: string;
  zustandsbeschreibung: string;
  suchbegriffe: string[];
  kategorie: string;
  ebay_kategorie_id: string | null;
  technische_daten: Record<string, string>;
  versandempfehlung: string;
  fehlende_angaben: string[];
  rueckfragen: string[];
  neupreis_min: number | null;
  neupreis_max: number | null;
  neupreis_quelle: string;
  neupreis_guenstigst: number | null;
  neupreis_guenstigst_quelle: string;
  gebrauchtpreis_min: number | null;
  gebrauchtpreis_max: number | null;
  plattform_preise: Array<{
    plattform: string;
    von: number | null;
    bis: number | null;
    hinweis: string;
  }>;
  preis_empfehlung: number | null;
  preis_start: number | null;
  preis_schnell: number | null;
  preis_maximum: number | null;
  preis_begruendung: string;
  preis_vertrauen: "hoch" | "mittel" | "niedrig";
  preis_erklaerungen: {
    schnell: string;
    empfehlung: string;
    start: string;
    maximum: string;
  };
  erkannte_daten: {
    produktname: string;
    hersteller: string;
    modell: string;
    artikelnummer: string;
    barcode: string;
    ean: string;
    abmessungen: string;
    materialien: string;
    kategorie: string;
    spezifikationen: Record<string, string>;
  };
  verkaufsgeschwindigkeit: string;
  marktanalyse: {
    datenlage: string;
    vergleichsbasis: string;
    nachfrage: string;
    seltenheit: string;
    wertfaktoren: string[];
    hinweise: string[];
  };
};

export type AnalyseEingabe = {
  zustand: string | null;
  ist_neu: boolean;
  marke: string | null;
  modell: string | null;
  maengel: string | null;
  details: string | null;
  zubehoer: string | null;
  notizen: string | null;
  verkaeufer_status?: string | null;
  land?: string | null;
};


const ZUSTAND_TEXT: Record<string, string> = {
  neu: "Neu (originalverpackt, unbenutzt)",
  neu_sonstige: "Neu, sonstige (z. B. Rückware, geöffnete Verpackung)",
  wie_neu: "Wie neu",
  sehr_gut: "Gebraucht – sehr gut",
  gut: "Gebraucht – gut",
  akzeptabel: "Gebraucht – akzeptabel",
  defekt: "Defekt / für Ersatzteile",
};



function marktdatenBlock(vergleiche: MarktVergleich[], istNeu: boolean): string {
  if (vergleiche.length === 0) {
    return `LIVE-MARKTDATEN: Keine Live-Vergleichsangebote verfuegbar. Bewerte auf Basis von aehnlichen Produkten, Markenwert, technischer Einordnung und Nachfrage und mache diese Datenlage im Feld "datenlage" transparent.`;
  }
  const zeilen = vergleiche
    .slice(0, 25)
    .map((v) => `- ${v.preis.toFixed(2)} ${v.waehrung} | Zustand: ${v.zustand} | ${v.titel}`)
    .join("\n");
  return `LIVE-MARKTDATEN (aktuelle Angebote von eBay Deutschland, Sofort-Kauf):
${zeilen}

Nutze nur die Angebote, die zum Zustand passen (${istNeu ? "NEUWARE" : "GEBRAUCHTWARE"}). Ignoriere offensichtliche Zubehoer- oder Ersatzteilangebote sowie Ausreisser.`;
}

/** Preisstufen eines Analyseergebnisses. */
type Stufen = {
  preis_schnell: number | null;
  preis_empfehlung: number | null;
  preis_start: number | null;
  preis_maximum: number | null;
};

function zahl(wert: unknown): number | null {
  const n = typeof wert === "string" ? Number(wert.replace(",", ".")) : wert;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Sicherung gegen zu hohe Preise: Gebrauchtware darf nie so viel kosten wie
 * neu erhaeltliche Ware. Deckelt die vier Stufen auf den guenstigsten real
 * verfuegbaren Neupreis und sortiert sie anschliessend aufsteigend.
 */
export function preiseBegrenzen(
  stufen: Stufen,
  guenstigsterNeupreis: number | null,
  istNeu: boolean,
): Stufen {
  const werte = [
    zahl(stufen.preis_schnell),
    zahl(stufen.preis_empfehlung),
    zahl(stufen.preis_start),
    zahl(stufen.preis_maximum),
  ];

  // Obergrenze: neu darf leicht darueber liegen, gebraucht deutlich darunter.
  const grenze = guenstigsterNeupreis
    ? istNeu
      ? guenstigsterNeupreis * 1.1
      : guenstigsterNeupreis * 0.85
    : null;

  const gedeckelt = werte.map((w) =>
    w === null ? null : grenze !== null && w > grenze ? Math.round(grenze * 100) / 100 : w,
  );

  const vorhanden = gedeckelt.filter((w): w is number => w !== null).sort((a, b) => a - b);
  let i = 0;
  const sortiert = gedeckelt.map((w) => (w === null ? null : (vorhanden[i++] ?? w)));

  return {
    preis_schnell: sortiert[0] ?? null,
    preis_empfehlung: sortiert[1] ?? null,
    preis_start: sortiert[2] ?? null,
    preis_maximum: sortiert[3] ?? null,
  };
}


export async function analyseAusfuehren(args: {
  eingabe: AnalyseEingabe;
  bildUrls: string[];
  erkennungsBildUrls?: string[];
  regeln: string[];
  verlauf: string[];
  marktdaten: MarktVergleich[];
  marktdatenQuelle: string;
}): Promise<AnalyseErgebnis> {
  const { eingabe, bildUrls, regeln, verlauf, marktdaten } = args;
  const erkennung = args.erkennungsBildUrls ?? [];

  const angaben = [
    `Zustand: ${eingabe.zustand ? (ZUSTAND_TEXT[eingabe.zustand] ?? eingabe.zustand) : "nicht angegeben"}`,
    `Warenart: ${eingabe.ist_neu ? "Neuware" : "Gebrauchtware / Rueckware / Einzelstueck"}`,
    `Marke: ${eingabe.marke || "nicht angegeben"}`,
    `Modell: ${eingabe.modell || "nicht angegeben"}`,
    `Bekannte Maengel: ${eingabe.maengel || "keine angegeben"}`,
    `Produktdetails: ${eingabe.details || "keine angegeben"}`,
    `Mitgeliefertes Zubehoer: ${eingabe.zubehoer || "keines angegeben"}`,
    `Zusaetzliche Notizen: ${eingabe.notizen || "keine"}`,
    `Verkaeuferstatus: ${eingabe.verkaeufer_status || "nicht angegeben"}`,
    `Land des Verkaeufers: ${eingabe.land || "Deutschland"}`,
  ].join("\n");

  const inhalt: KiInhalt[] = [
    {
      type: "text",
      text: `ANGABEN DER VERKAEUFERIN/DES VERKAEUFERS:
${angaben}

${marktdatenBlock(marktdaten, eingabe.ist_neu)}

${regeln.length ? `PERSOENLICHE REGELN (haben Vorrang vor Standardformulierungen):\n${regeln.join("\n")}` : "PERSOENLICHE REGELN: keine hinterlegt."}

${verlauf.length ? `EIGENE VERKAUFSHISTORIE (fuer Preis-Lernfunktion beruecksichtigen):\n${verlauf.join("\n")}` : "EIGENE VERKAUFSHISTORIE: noch keine Daten."}

${bildUrls.length ? `Es folgen ${bildUrls.length} Produktfoto(s). Beschreibe nur, was tatsaechlich sichtbar ist.` : "Es wurden keine Fotos hochgeladen. Weise in fehlende_angaben darauf hin."}${erkennung.length ? `\nDanach folgen ${erkennung.length} KI-Erkennungsbild(er) (Verpackung, Etiketten, Barcodes, Typenschilder). Diese dienen NUR der Datenerkennung und werden nie veroeffentlicht.` : ""}`,
    },
    ...bildUrls.slice(0, 8).map<KiInhalt>((url) => ({
      type: "image_url",
      image_url: { url },
    })),
    ...erkennung.slice(0, 6).map<KiInhalt>((url) => ({
      type: "image_url",
      image_url: { url },
    })),
  ];

  const nachrichten: KiNachricht[] = [
    { role: "system", content: ANALYSE_PROMPT.text },
    { role: "user", content: inhalt },
  ];

  const rohtext = await kiAnfrage(nachrichten, { denken: "high" });
  const ergebnis = kiJson<AnalyseErgebnis>(rohtext);

  const vertrauen: AnalyseErgebnis["preis_vertrauen"] =
    ergebnis.preis_vertrauen === "hoch" || ergebnis.preis_vertrauen === "niedrig"
      ? ergebnis.preis_vertrauen
      : "mittel";

  // Guenstigster real verfuegbarer Neupreis: Angabe der KI, sonst die
  // untere Grenze der offiziellen Neupreisspanne.
  const guenstigst = zahl(ergebnis.neupreis_guenstigst) ?? zahl(ergebnis.neupreis_min);

  const stufen = preiseBegrenzen(
    {
      preis_schnell: ergebnis.preis_schnell,
      preis_empfehlung: ergebnis.preis_empfehlung,
      preis_start: ergebnis.preis_start,
      preis_maximum: ergebnis.preis_maximum,
    },
    guenstigst,
    eingabe.ist_neu,
  );

  return {
    ...ergebnis,
    ...stufen,
    titel: (ergebnis.titel ?? "").slice(0, 80),
    suchbegriffe: Array.isArray(ergebnis.suchbegriffe) ? ergebnis.suchbegriffe : [],
    fehlende_angaben: Array.isArray(ergebnis.fehlende_angaben) ? ergebnis.fehlende_angaben : [],
    rueckfragen: Array.isArray(ergebnis.rueckfragen) ? ergebnis.rueckfragen : [],
    technische_daten: ergebnis.technische_daten ?? {},
    preis_vertrauen: vertrauen,
    neupreis_min: ergebnis.neupreis_min ?? null,
    neupreis_max: ergebnis.neupreis_max ?? null,
    neupreis_quelle: ergebnis.neupreis_quelle ?? "",
    neupreis_guenstigst: guenstigst,
    neupreis_guenstigst_quelle: ergebnis.neupreis_guenstigst_quelle ?? "",
    gebrauchtpreis_min: ergebnis.gebrauchtpreis_min ?? null,
    gebrauchtpreis_max: ergebnis.gebrauchtpreis_max ?? null,
    plattform_preise: Array.isArray(ergebnis.plattform_preise)
      ? ergebnis.plattform_preise.slice(0, 6).map((p) => ({
          plattform: p?.plattform ?? "",
          von: p?.von ?? null,
          bis: p?.bis ?? null,
          hinweis: p?.hinweis ?? "",
        }))
      : [],
    preis_erklaerungen: {
      schnell: ergebnis.preis_erklaerungen?.schnell ?? "",
      empfehlung: ergebnis.preis_erklaerungen?.empfehlung ?? "",
      start: ergebnis.preis_erklaerungen?.start ?? "",
      maximum: ergebnis.preis_erklaerungen?.maximum ?? "",
    },
    erkannte_daten: {
      produktname: ergebnis.erkannte_daten?.produktname ?? "",
      hersteller: ergebnis.erkannte_daten?.hersteller ?? "",
      modell: ergebnis.erkannte_daten?.modell ?? "",
      artikelnummer: ergebnis.erkannte_daten?.artikelnummer ?? "",
      barcode: ergebnis.erkannte_daten?.barcode ?? "",
      ean: ergebnis.erkannte_daten?.ean ?? "",
      abmessungen: ergebnis.erkannte_daten?.abmessungen ?? "",
      materialien: ergebnis.erkannte_daten?.materialien ?? "",
      kategorie: ergebnis.erkannte_daten?.kategorie ?? "",
      spezifikationen: ergebnis.erkannte_daten?.spezifikationen ?? {},
    },
    marktanalyse: {
      datenlage: ergebnis.marktanalyse?.datenlage ?? "",
      vergleichsbasis: ergebnis.marktanalyse?.vergleichsbasis ?? "",
      nachfrage: ergebnis.marktanalyse?.nachfrage ?? "",
      seltenheit: ergebnis.marktanalyse?.seltenheit ?? "",
      wertfaktoren: ergebnis.marktanalyse?.wertfaktoren ?? [],
      hinweise: ergebnis.marktanalyse?.hinweise ?? [],
    },
  };
}


export type FeedbackErgebnis = {
  regeln: Array<{ regel: string; bereich: string }>;
  antwort: string;
};

export async function feedbackAuswerten(
  feedback: string,
  bestehendeRegeln: string[],
): Promise<FeedbackErgebnis> {
  const rohtext = await kiAnfrage([
    {
      role: "system",
      content: FEEDBACK_PROMPT.text,
    },
    {
      role: "user",
      content: `Bestehende Regeln:\n${bestehendeRegeln.join("\n") || "keine"}\n\nNeues Feedback:\n${feedback}`,
    },
  ]);
  const ergebnis = kiJson<FeedbackErgebnis>(rohtext);
  return {
    regeln: Array.isArray(ergebnis.regeln) ? ergebnis.regeln.slice(0, 6) : [],
    antwort: ergebnis.antwort ?? "Feedback gespeichert.",
  };
}

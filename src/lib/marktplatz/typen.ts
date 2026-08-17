// Gemeinsamer Vertrag für alle Marktplatz-Anbindungen.
//
// Grundsatz der Architektur: Der Artikel ist die zentrale Wahrheit und bleibt
// marktplatzneutral. Alles Plattformabhängige (Kategorien, Pflichtfelder,
// Formate, Gebühren) gehört ausschließlich in den jeweiligen Connector.
export type MarktVergleich = {
  titel: string;
  preis: number;
  waehrung: string;
  zustand: string;
  url: string;
  /** Kennung des Marktplatzes, von dem der Vergleich stammt. */
  quelle?: string;
};

/** Neutrale Artikeldaten, wie sie jeder Connector erhält. */
export type PlattformDaten = Record<string, string | number | boolean | null>;

export type VeroeffentlichenEingabe = {
  artikelId: string;
  titel: string;
  beschreibung: string;
  zustand: string | null;
  zustandsbeschreibung: string | null;
  marke: string | null;
  modell: string | null;
  technischeDaten: Record<string, string[]>;
  bildUrls: string[];
  preis: number;
  /** Neutrale Kategoriebezeichnung der KI (keine Plattform-ID). */
  kategorie: string | null;
  /** Plattformspezifische Zusatzdaten, z. B. Kategorie-IDs je Marktplatz. */
  plattformDaten: PlattformDaten;
};

export type VeroeffentlichenErgebnis = {
  angebotId: string;
  url: string | null;
  /** Plattformspezifische Rückgabewerte für die Veröffentlichungs-Ablage. */
  plattformDaten?: PlattformDaten;
};

/**
 * Ein einzelnes Formularfeld der Plattform inklusive der Stellen, an denen der
 * Assistent es im Verkaufsformular findet. Reine Plattformkenntnis – gehört
 * ausschließlich in den Connector.
 */
export type Formularfeld = {
  schluessel: string;
  label: string;
  wert: string | number | null;
  /** CSS-Auswahlausdrücke, in dieser Reihenfolge probiert. */
  selektoren: string[];
};

/** Bauplan zum Ausfüllen des Verkaufsformulars einer Plattform. */
export type Formularplan = {
  /** Adresse des Verkaufsformulars. */
  formularUrl: string;
  felder: Formularfeld[];
  /** Auswahlausdrücke für das Datei-Feld der Fotos. */
  bildEingabe: string[];
  hinweis: string | null;
};

/**
 * `api`     = offizielle Schnittstelle der Plattform
 * `browser` = Verkaufsformular wird im eigenen Browser ausgefüllt
 */
export type MarktplatzModus = "api" | "browser";

export type MarktplatzAdapter = {
  id: string;
  name: string;
  beschreibung: string;
  /** false = für später vorbereitet, noch nicht freigeschaltet */
  verfuegbar: boolean;
  /** Unterstützte Veröffentlichungswege, in Reihenfolge der Vorliebe. */
  modi: MarktplatzModus[];
  istKonfiguriert: () => boolean;
  authUrl?: (state: string) => string;
  codeEinloesen?: (code: string) => Promise<{
    accessToken: string;
    refreshToken: string | null;
    gueltigBis: string;
  }>;
  tokenErneuern?: (
    refreshToken: string,
  ) => Promise<{ accessToken: string; gueltigBis: string }>;
  marktdaten?: (suchbegriff: string) => Promise<MarktVergleich[]>;
  /**
   * Plattformeigene Pflichtfeldprüfung. Gibt eine Liste fehlender Angaben
   * zurück; leer = veröffentlichungsbereit. So bleibt der Kern neutral.
   */
  pflichtfelderPruefen?: (eingabe: VeroeffentlichenEingabe) => string[];
  veroeffentlichen?: (
    token: string,
    eingabe: VeroeffentlichenEingabe,
  ) => Promise<VeroeffentlichenErgebnis>;
  /**
   * Bauplan für den Browser-Weg. Wird von Chrome-Erweiterung und Android-App
   * gemeinsam genutzt – die Zuordnung existiert nur einmal.
   */
  formularplan?: (eingabe: VeroeffentlichenEingabe) => Formularplan;
};


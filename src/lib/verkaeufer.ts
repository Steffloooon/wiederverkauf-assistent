// Gemeinsame Angaben zum Verkäuferprofil (Client und Server).
export type VerkaeuferStatus = "privat" | "kleinunternehmer" | "gewerblich";

export const VERKAEUFER_STATUS: Array<{
  wert: VerkaeuferStatus;
  label: string;
  hinweis: string;
}> = [
  {
    wert: "privat",
    label: "Privatverkäufer",
    hinweis: "Gelegentlicher Verkauf eigener Sachen, kein Gewerbe.",
  },
  {
    wert: "kleinunternehmer",
    label: "Kleinunternehmer",
    hinweis: "Gewerblich, aber ohne Umsatzsteuerausweis (§ 19 UStG).",
  },
  {
    wert: "gewerblich",
    label: "Gewerblicher Verkäufer",
    hinweis: "Regelmäßiger Verkauf mit vollen Pflichtangaben.",
  },
];

export const STATUS_LABEL_VERKAEUFER: Record<VerkaeuferStatus, string> = {
  privat: "Privatverkäufer",
  kleinunternehmer: "Kleinunternehmer",
  gewerblich: "Gewerblicher Verkäufer",
};

export const LAENDER = [
  "Deutschland",
  "Österreich",
  "Schweiz",
  "Luxemburg",
  "Belgien",
  "Niederlande",
] as const;

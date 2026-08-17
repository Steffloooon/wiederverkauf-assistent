// Modularer Marktplatz-Adapter: eBay.
// Weitere Marktplätze (Kleinanzeigen, Vinted, TikTok Shop) können denselben
// Vertrag (MarktplatzAdapter) implementieren – siehe registry.server.ts.
import type {
  Formularplan,
  MarktplatzAdapter,
  MarktVergleich,
  VeroeffentlichenEingabe,
  VeroeffentlichenErgebnis,
} from "./typen";


const EBAY_PROD = {
  auth: "https://auth.ebay.com/oauth2/authorize",
  token: "https://api.ebay.com/identity/v1/oauth2/token",
  api: "https://api.ebay.com",
};
const EBAY_SANDBOX = {
  auth: "https://auth.sandbox.ebay.com/oauth2/authorize",
  token: "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
  api: "https://api.sandbox.ebay.com",
};

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
].join(" ");

function umgebung() {
  return process.env["EBAY_UMGEBUNG"] === "sandbox" ? EBAY_SANDBOX : EBAY_PROD;
}

function zugangsdaten() {
  const clientId = process.env["EBAY_CLIENT_ID"];
  const clientSecret = process.env["EBAY_CLIENT_SECRET"];
  const redirectUri = process.env["EBAY_REDIRECT_URI"];
  return { clientId, clientSecret, redirectUri };
}

export function ebayKonfiguriert(): boolean {
  const { clientId, clientSecret, redirectUri } = zugangsdaten();
  return Boolean(clientId && clientSecret && redirectUri);
}

function basicAuth(): string {
  const { clientId, clientSecret } = zugangsdaten();
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

/** Login-Link für den eBay-OAuth-Ablauf (kein Passwort wird gespeichert). */
export function ebayAuthUrl(state: string): string {
  const { clientId, redirectUri } = zugangsdaten();
  const url = new URL(umgebung().auth);
  url.searchParams.set("client_id", clientId!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri!);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("locale", "de-DE");
  return url.toString();
}

type TokenAntwort = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function tokenAnfrage(body: URLSearchParams): Promise<TokenAntwort> {
  const antwort = await fetch(umgebung().token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body,
  });
  if (!antwort.ok) {
    const text = await antwort.text();
    console.error("[eBay] Token-Fehler", antwort.status, text);
    throw new Error("Die Verbindung zu eBay ist fehlgeschlagen.");
  }
  return (await antwort.json()) as TokenAntwort;
}

export async function ebayCodeEinloesen(code: string) {
  const { redirectUri } = zugangsdaten();
  const daten = await tokenAnfrage(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri!,
    }),
  );
  return {
    accessToken: daten.access_token,
    refreshToken: daten.refresh_token ?? null,
    gueltigBis: new Date(Date.now() + daten.expires_in * 1000).toISOString(),
  };
}

export async function ebayTokenErneuern(refreshToken: string) {
  const daten = await tokenAnfrage(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  );
  return {
    accessToken: daten.access_token,
    gueltigBis: new Date(Date.now() + daten.expires_in * 1000).toISOString(),
  };
}

/** Anwendungs-Token für die öffentliche Suche (Marktdaten). */
async function appToken(): Promise<string> {
  const daten = await tokenAnfrage(
    new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  );
  return daten.access_token;
}

/** Aktuelle Vergleichsangebote von eBay Deutschland. */
export async function ebayMarktdaten(suchbegriff: string): Promise<MarktVergleich[]> {
  if (!ebayKonfiguriert() || !suchbegriff.trim()) return [];
  try {
    const token = await appToken();
    const url = new URL(`${umgebung().api}/buy/browse/v1/item_summary/search`);
    url.searchParams.set("q", suchbegriff);
    url.searchParams.set("limit", "30");
    url.searchParams.set("filter", "buyingOptions:{FIXED_PRICE}");
    const antwort = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
        "Accept-Language": "de-DE",
      },
    });
    if (!antwort.ok) {
      console.error("[eBay] Suche fehlgeschlagen", antwort.status, await antwort.text());
      return [];
    }
    const daten = (await antwort.json()) as {
      itemSummaries?: Array<{
        title?: string;
        price?: { value?: string; currency?: string };
        condition?: string;
        itemWebUrl?: string;
      }>;
    };
    return (daten.itemSummaries ?? [])
      .filter((a) => a.price?.value)
      .map((a) => ({
        titel: a.title ?? "",
        preis: Number(a.price!.value),
        waehrung: a.price?.currency ?? "EUR",
        zustand: a.condition ?? "unbekannt",
        url: a.itemWebUrl ?? "",
      }));
  } catch (fehler) {
    console.error("[eBay] Marktdaten-Fehler", fehler);
    return [];
  }
}

const ZUSTAND_EBAY: Record<string, string> = {
  neu: "NEW",
  neu_sonstige: "NEW_OTHER",
  wie_neu: "LIKE_NEW",
  sehr_gut: "USED_EXCELLENT",
  gut: "USED_VERY_GOOD",
  akzeptabel: "USED_GOOD",
  defekt: "FOR_PARTS_OR_NOT_WORKING",
};

async function ebayFetch(
  token: string,
  pfad: string,
  init: RequestInit & { body?: string } = {},
) {
  const antwort = await fetch(`${umgebung().api}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Language": "de-DE",
      "Accept-Language": "de-DE",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_DE",
      ...(init.headers ?? {}),
    },
  });
  const text = await antwort.text();
  if (!antwort.ok) {
    console.error("[eBay] API-Fehler", pfad, antwort.status, text);
    let meldung = "eBay hat die Veröffentlichung abgelehnt.";
    try {
      const fehler = JSON.parse(text) as { errors?: Array<{ message?: string }> };
      if (fehler.errors?.[0]?.message) meldung = `eBay: ${fehler.errors[0].message}`;
    } catch {
      /* Rohtext behalten */
    }
    throw new Error(meldung);
  }
  return text ? (JSON.parse(text) as unknown) : null;
}

/**
 * eBay-Kategorie-ID ermitteln. Plattformspezifische Zuordnung bleibt
 * ausschliesslich hier im Connector – der Artikel selbst kennt nur eine
 * neutrale Kategoriebezeichnung.
 */
export function ebayKategorieId(eingabe: VeroeffentlichenEingabe): string | null {
  const wert = eingabe.plattformDaten["ebay_kategorie_id"];
  return typeof wert === "string" && wert.trim() ? wert.trim() : null;
}

/** eBay-eigene Pflichtfeldprüfung (Kern bleibt neutral). */
export function ebayPflichtfelder(eingabe: VeroeffentlichenEingabe): string[] {
  const fehlt: string[] = [];
  if (!eingabe.titel.trim()) fehlt.push("Titel");
  if (!eingabe.beschreibung.trim()) fehlt.push("Beschreibung");
  if (eingabe.bildUrls.length === 0) fehlt.push("mindestens ein Produktfoto");
  if (!(eingabe.preis > 0)) fehlt.push("Verkaufspreis");
  if (!eingabe.zustand) fehlt.push("Zustand");
  return fehlt;
}

/**
 * Veröffentlicht einen Artikel über die eBay Sell-APIs.
 * Erfordert im eBay-Konto hinterlegte Zahlungs-, Rückgabe- und Versandrichtlinien.
 */
export async function ebayVeroeffentlichen(
  token: string,
  eingabe: VeroeffentlichenEingabe,
): Promise<VeroeffentlichenErgebnis> {
  const sku = `LA-${eingabe.artikelId.slice(0, 8)}-${Date.now().toString(36)}`;

  await ebayFetch(token, `/sell/inventory/v1/inventory_item/${sku}`, {
    method: "PUT",
    body: JSON.stringify({
      availability: { shipToLocationAvailability: { quantity: 1 } },
      condition: ZUSTAND_EBAY[eingabe.zustand ?? "gut"] ?? "USED_GOOD",
      conditionDescription: eingabe.zustandsbeschreibung ?? undefined,
      product: {
        title: eingabe.titel.slice(0, 80),
        description: eingabe.beschreibung,
        brand: eingabe.marke ?? undefined,
        mpn: eingabe.modell ?? undefined,
        aspects: eingabe.technischeDaten,
        imageUrls: eingabe.bildUrls,
      },
    }),
  });

  const richtlinien = await ebayFetch(token, "/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_DE").catch(
    () => null,
  );
  const zahlung = await ebayFetch(token, "/sell/account/v1/payment_policy?marketplace_id=EBAY_DE").catch(
    () => null,
  );
  const rueckgabe = await ebayFetch(token, "/sell/account/v1/return_policy?marketplace_id=EBAY_DE").catch(
    () => null,
  );

  const ersteId = (daten: unknown, feld: string) => {
    const liste = (daten as Record<string, Array<Record<string, string>>> | null)?.[feld];
    return liste?.[0]?.[`${feld.replace(/ies$/, "y").replace(/s$/, "")}Id`] ?? liste?.[0]?.["policyId"];
  };

  const fulfillmentPolicyId = ersteId(richtlinien, "fulfillmentPolicies");
  const paymentPolicyId = ersteId(zahlung, "paymentPolicies");
  const returnPolicyId = ersteId(rueckgabe, "returnPolicies");

  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    throw new Error(
      "In deinem eBay-Konto fehlen Versand-, Zahlungs- oder Rücknahmerichtlinien. Bitte lege diese zuerst bei eBay an.",
    );
  }

  const angebot = (await ebayFetch(token, "/sell/inventory/v1/offer", {
    method: "POST",
    body: JSON.stringify({
      sku,
      marketplaceId: "EBAY_DE",
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId: ebayKategorieId(eingabe) ?? undefined,
      listingDescription: eingabe.beschreibung,
      pricingSummary: {
        price: { value: eingabe.preis.toFixed(2), currency: "EUR" },
      },
      listingPolicies: { fulfillmentPolicyId, paymentPolicyId, returnPolicyId },
      merchantLocationKey: process.env["EBAY_LAGERORT"] ?? undefined,
    }),
  })) as { offerId?: string } | null;

  const offerId = angebot?.offerId;
  if (!offerId) throw new Error("eBay hat keine Angebots-Nummer zurückgegeben.");

  const veroeffentlicht = (await ebayFetch(
    token,
    `/sell/inventory/v1/offer/${offerId}/publish`,
    { method: "POST" },
  )) as { listingId?: string } | null;

  const listingId = veroeffentlicht?.listingId ?? offerId;
  return {
    angebotId: listingId,
    plattformDaten: { sku, offerId, kategorie_id: ebayKategorieId(eingabe) ?? null },
    url: veroeffentlicht?.listingId
      ? `https://www.ebay.de/itm/${veroeffentlicht.listingId}`
      : null,
  };
}

/** Zustandsbezeichnungen, wie sie im eBay-Verkaufsformular stehen. */
const ZUSTAND_FORMULAR: Record<string, string> = {
  neu: "Neu",
  neu_sonstige: "Neu: Sonstige",
  wie_neu: "Neuwertig",
  sehr_gut: "Sehr gut",
  gut: "Gut",
  akzeptabel: "Akzeptabel",
  defekt: "Defekt oder nicht funktionsfähig",
};

/**
 * Bauplan für den Browser-Weg: Welche Felder des eBay-Verkaufsformulars mit
 * welchem Wert gefüllt werden. Wird von der Chrome-Erweiterung und der
 * Android-App gemeinsam genutzt.
 */
export function ebayFormularplan(eingabe: VeroeffentlichenEingabe): Formularplan {
  return {
    formularUrl: "https://www.ebay.de/sl/sell",
    bildEingabe: ['input[type="file"][accept*="image"]', 'input[type="file"]'],
    hinweis:
      "Kategorie und Versandart legt eBay teils selbst fest – bitte kurz prüfen, bevor du einstellst.",
    felder: [
      {
        schluessel: "titel",
        label: "Titel",
        wert: eingabe.titel.slice(0, 80),
        selektoren: [
          'input[name="title"]',
          'input[id*="title" i]:not([type="hidden"])',
          'input[aria-label*="Titel" i]',
          'input[placeholder*="Titel" i]',
        ],
      },
      {
        schluessel: "beschreibung",
        label: "Beschreibung",
        wert: eingabe.beschreibung,
        selektoren: [
          'textarea[name="description"]',
          'textarea[id*="description" i]',
          'textarea[aria-label*="Beschreibung" i]',
          "textarea",
        ],
      },
      {
        schluessel: "preis",
        label: "Preis",
        wert: eingabe.preis.toFixed(2).replace(".", ","),
        selektoren: [
          'input[name="price"]',
          'input[id*="price" i]:not([type="hidden"])',
          'input[aria-label*="Preis" i]',
          'input[placeholder*="Preis" i]',
        ],
      },
      {
        schluessel: "menge",
        label: "Menge",
        wert: 1,
        selektoren: ['input[name="quantity"]', 'input[id*="quantity" i]'],
      },
      {
        schluessel: "zustand",
        label: "Zustand",
        wert: ZUSTAND_FORMULAR[eingabe.zustand ?? "gut"] ?? "Gut",
        selektoren: [
          'select[name="condition"]',
          'select[id*="condition" i]',
          'select[aria-label*="Zustand" i]',
        ],
      },
      {
        schluessel: "marke",
        label: "Marke",
        wert: eingabe.marke,
        selektoren: ['input[name*="brand" i]', 'input[aria-label*="Marke" i]'],
      },
    ],
  };
}

export const ebayAdapter: MarktplatzAdapter = {
  id: "ebay",
  name: "eBay",
  beschreibung: "Verkaufsformular wird automatisch ausgefüllt – du bestätigst nur noch.",
  verfuegbar: true,
  modi: ["api", "browser"],
  istKonfiguriert: ebayKonfiguriert,
  authUrl: ebayAuthUrl,
  codeEinloesen: ebayCodeEinloesen,
  tokenErneuern: ebayTokenErneuern,
  marktdaten: ebayMarktdaten,
  pflichtfelderPruefen: ebayPflichtfelder,
  veroeffentlichen: ebayVeroeffentlichen,
  formularplan: ebayFormularplan,
};


// Serverseitige Hilfsfunktionen für Artikel (nur aus Server-Funktionen aufrufen).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ArtikelZeile = Database["public"]["Tables"]["artikel"]["Row"];

export async function ladeArtikel(
  supabase: SupabaseClient<Database>,
  artikelId: string,
): Promise<ArtikelZeile> {
  const { data, error } = await supabase
    .from("artikel")
    .select("*")
    .eq("id", artikelId)
    .maybeSingle();
  if (error) throw new Error("Der Artikel konnte nicht geladen werden.");
  if (!data) throw new Error("Artikel nicht gefunden.");
  return data;
}

export async function ladeBildUrls(
  supabase: SupabaseClient<Database>,
  artikelId: string,
  gueltigkeitSekunden = 60 * 60,
  typ: "produkt" | "erkennung" = "produkt",
): Promise<string[]> {
  const { data: bilder } = await supabase
    .from("artikel_bilder")
    .select("pfad")
    .eq("artikel_id", artikelId)
    .eq("typ", typ)
    .order("reihenfolge", { ascending: true });

  const urls: string[] = [];
  for (const bild of bilder ?? []) {
    const { data } = await supabase.storage
      .from("artikel-bilder")
      .createSignedUrl(bild.pfad, gueltigkeitSekunden);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }
  return urls;
}


export async function ladeRegeln(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data } = await supabase
    .from("ki_regeln")
    .select("regel, bereich")
    .eq("aktiv", true)
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []).map((r) => `[${r.bereich}] ${r.regel}`);
}

export async function ladeVerkaufsverlauf(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data } = await supabase
    .from("verkaufsverlauf")
    .select("verkaufspreis, tage_bis_verkauf, preis_gesenkt, anfragen, einschaetzung, notiz")
    .order("created_at", { ascending: false })
    .limit(25);
  return (data ?? []).map(
    (v) =>
      `Verkauft für ${v.verkaufspreis ?? "?"} € nach ${v.tage_bis_verkauf ?? "?"} Tagen, ` +
      `Preis gesenkt: ${v.preis_gesenkt ? "ja" : "nein"}, Anfragen: ${v.anfragen}, ` +
      `Einschätzung: ${v.einschaetzung ?? "-"}${v.notiz ? ` (${v.notiz})` : ""}`,
  );
}

/**
 * Baut die marktplatzneutralen Veröffentlichungsdaten eines Artikels.
 * Jeder Connector erhält genau diese Struktur – egal ob API oder Browser-Weg.
 */
export async function veroeffentlichenEingabeBauen(
  supabase: SupabaseClient<Database>,
  artikelId: string,
  bildGueltigkeitSekunden = 60 * 60 * 24 * 7,
) {
  const artikel = await ladeArtikel(supabase, artikelId);
  if (!artikel.titel || !artikel.beschreibung) {
    throw new Error("Bitte erst die KI-Analyse ausführen und das Inserat prüfen.");
  }
  const preis = artikel.preis_empfehlung;
  if (!preis || Number(preis) <= 0) {
    throw new Error("Bitte einen gültigen Verkaufspreis festlegen.");
  }

  const bildUrls = await ladeBildUrls(supabase, artikel.id, bildGueltigkeitSekunden);
  if (bildUrls.length === 0) {
    throw new Error("Für die Veröffentlichung wird mindestens ein Produktfoto benötigt.");
  }

  const aspekte: Record<string, string[]> = {};
  const daten = (artikel.technische_daten ?? {}) as Record<string, unknown>;
  for (const [schluessel, wert] of Object.entries(daten)) {
    if (typeof wert === "string" && wert.trim()) aspekte[schluessel] = [wert];
  }

  return {
    artikelId: artikel.id,
    titel: artikel.titel,
    beschreibung: [artikel.beschreibung, artikel.zustandsbeschreibung, artikel.abschlusstext]
      .filter(Boolean)
      .join("\n\n"),
    zustand: artikel.zustand,
    zustandsbeschreibung: artikel.zustandsbeschreibung,
    marke: artikel.marke,
    modell: artikel.modell,
    technischeDaten: aspekte,
    bildUrls,
    preis: Number(preis),
    kategorie: artikel.kategorie,
    plattformDaten: { ebay_kategorie_id: artikel.ebay_kategorie_id },
  };
}

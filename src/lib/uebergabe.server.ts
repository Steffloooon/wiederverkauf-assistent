// Übergabe-Pakete: die Brücke zwischen App und Verkaufsformular.
//
// Die App erzeugt eine kurzlebige, nicht erratbare Kennung. Der Assistent
// (Chrome-Erweiterung oder Android-Verkaufsfenster) holt damit genau einmal die
// fertigen Anzeigendaten. Keine Konto- oder Zahlungsdaten im Paket.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { marktplatzAdapter } from "./marktplatz/registry.server";
import { veroeffentlichenEingabeBauen } from "./artikel.server";
import type { Formularplan } from "./marktplatz/typen";

/** Gültigkeitsdauer einer Übergabe in Minuten. */
export const UEBERGABE_MINUTEN = 30;

export type UebergabePaket = {
  marktplatz: string;
  name: string;
  formularUrl: string;
  felder: Formularplan["felder"];
  bildEingabe: string[];
  bilder: string[];
  hinweis: string | null;
};

function kennungErzeugen(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Erzeugt eine neue Übergabe für einen Artikel und prüft dabei, dass alle
 * Pflichtangaben der Plattform vorhanden sind.
 */
export async function uebergabeAnlegen(
  supabase: SupabaseClient<Database>,
  userId: string,
  artikelId: string,
  marktplatzId: string,
): Promise<{ token: string; formularUrl: string; name: string; gueltigBis: string }> {
  const adapter = marktplatzAdapter(marktplatzId);
  if (!adapter?.formularplan) {
    throw new Error("Für diesen Marktplatz ist der Verkaufs-Assistent noch nicht vorbereitet.");
  }

  const eingabe = await veroeffentlichenEingabeBauen(supabase, artikelId);
  const fehlt = adapter.pflichtfelderPruefen?.(eingabe) ?? [];
  if (fehlt.length > 0) {
    throw new Error(`Für ${adapter.name} fehlt noch: ${fehlt.join(", ")}.`);
  }

  const plan = adapter.formularplan(eingabe);
  const token = kennungErzeugen();
  const gueltigBis = new Date(Date.now() + UEBERGABE_MINUTEN * 60_000).toISOString();

  const db = await admin();
  const { error } = await db.from("uebergabe_token").insert({
    token,
    artikel_id: artikelId,
    user_id: userId,
    marktplatz: marktplatzId,
    gueltig_bis: gueltigBis,
  });
  if (error) {
    console.error("[Uebergabe] Anlegen fehlgeschlagen", error);
    throw new Error("Die Übergabe konnte nicht vorbereitet werden.");
  }

  return { token, formularUrl: plan.formularUrl, name: adapter.name, gueltigBis };
}

/**
 * Liest ein Paket über die Kennung – ohne Anmeldung, dafür streng begrenzt.
 * Gibt null zurück, wenn die Kennung unbekannt, abgelaufen oder widerrufen ist.
 */
export async function uebergabePaketLesen(token: string): Promise<UebergabePaket | null> {
  if (!token || token.length < 32 || !/^[a-f0-9]+$/.test(token)) return null;

  const db = await admin();
  const { data: eintrag } = await db
    .from("uebergabe_token")
    .select("artikel_id, user_id, marktplatz, gueltig_bis, widerrufen")
    .eq("token", token)
    .maybeSingle();

  if (!eintrag) return null;
  if (eintrag.widerrufen) return null;
  if (new Date(eintrag.gueltig_bis).getTime() < Date.now()) return null;

  const adapter = marktplatzAdapter(eintrag.marktplatz);
  if (!adapter?.formularplan) return null;

  const eingabe = await veroeffentlichenEingabeBauen(db, eintrag.artikel_id);
  const plan = adapter.formularplan(eingabe);

  await db
    .from("uebergabe_token")
    .update({ verwendet_am: new Date().toISOString() })
    .eq("token", token);

  return {
    marktplatz: adapter.id,
    name: adapter.name,
    formularUrl: plan.formularUrl,
    felder: plan.felder,
    bildEingabe: plan.bildEingabe,
    bilder: eingabe.bildUrls,
    hinweis: plan.hinweis,
  };
}

/** Alle offenen Übergaben eines Artikels ungültig machen. */
export async function uebergabenWiderrufen(
  supabase: SupabaseClient<Database>,
  artikelId: string,
): Promise<void> {
  const db = await admin();
  await db.from("uebergabe_token").update({ widerrufen: true }).eq("artikel_id", artikelId);
  void supabase;
}

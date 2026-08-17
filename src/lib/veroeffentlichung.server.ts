// Veröffentlichungen sind vom Artikel getrennt gespeichert:
// ein Artikel kann auf mehreren Marktplätzen laufen, ohne den Kern zu ändern.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PlattformDaten } from "./marktplatz/typen";

export type Veroeffentlichung = {
  marktplatz: string;
  externe_id: string | null;
  url: string | null;
  status: string;
  veroeffentlicht_am: string | null;
};

export async function veroeffentlichungenLesen(
  supabase: SupabaseClient<Database>,
  artikelId: string,
): Promise<Veroeffentlichung[]> {
  const { data } = await supabase
    .from("artikel_veroeffentlichungen")
    .select("marktplatz, externe_id, url, status, veroeffentlicht_am")
    .eq("artikel_id", artikelId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function veroeffentlichungSpeichern(
  supabase: SupabaseClient<Database>,
  werte: {
    artikelId: string;
    userId: string;
    marktplatz: string;
    externeId: string | null;
    url: string | null;
    plattformDaten?: PlattformDaten | undefined;
  },
): Promise<void> {
  const { error } = await supabase.from("artikel_veroeffentlichungen").upsert(
    {
      artikel_id: werte.artikelId,
      user_id: werte.userId,
      marktplatz: werte.marktplatz,
      externe_id: werte.externeId,
      url: werte.url,
      status: "veroeffentlicht",
      fehler: null,
      plattform_daten: (werte.plattformDaten ?? {}) as never,
      veroeffentlicht_am: new Date().toISOString(),
    },
    { onConflict: "artikel_id,marktplatz" },
  );
  if (error) {
    console.error("[Veroeffentlichung] Speichern fehlgeschlagen", error);
    throw new Error("Die Veröffentlichung konnte nicht gespeichert werden.");
  }
}

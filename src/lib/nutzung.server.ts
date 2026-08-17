// Nutzungsprotokoll – Grundlage für spätere Tarife/Abrechnung.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type NutzungArt =
  | "analyse"
  | "bildoptimierung"
  | "veroeffentlichung"
  | "abschlusstext"
  | "uebergabe";


/** Ereignis protokollieren. Fehler hier dürfen den Ablauf nie stoppen. */
export async function nutzungMerken(
  supabase: SupabaseClient<Database>,
  userId: string,
  art: NutzungArt,
  details: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  try {
    await supabase.from("nutzung_ereignisse").insert({
      user_id: userId,
      art,
      details: details as never,
    });
  } catch (fehler) {
    console.error("[Nutzung] konnte nicht protokolliert werden", fehler);
  }
}

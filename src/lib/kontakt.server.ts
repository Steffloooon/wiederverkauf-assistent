// Serverseitige Logik für das Kontaktformular.
import { createHash } from "node:crypto";

export const KONTAKT_EMPFAENGER = "info.stefflon@gmx.de";

export type KontaktEingabe = {
  name: string;
  email: string;
  betreff: string;
  nachricht: string;
  userAgent?: string | null;
};

export function ipKennung(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** Einfache Ratenbegrenzung: max. 3 Nachrichten pro IP-Kennung in 15 Minuten. */
export async function ratenGrenzeErreicht(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const seit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("kontakt_nachrichten")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", seit);
  if (error) {
    console.error("[Kontakt] Ratenprüfung fehlgeschlagen", error);
    return false;
  }
  return (count ?? 0) >= 3;
}

export async function nachrichtSpeichern(
  eingabe: KontaktEingabe,
  ipHash: string | null,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("kontakt_nachrichten").insert({
    name: eingabe.name,
    email: eingabe.email,
    betreff: eingabe.betreff,
    nachricht: eingabe.nachricht,
    user_agent: eingabe.userAgent ?? null,
    ip_hash: ipHash,
  });
  if (error) {
    console.error("[Kontakt] Speichern fehlgeschlagen", error);
    throw new Error("Ihre Nachricht konnte leider nicht versendet werden.");
  }
}

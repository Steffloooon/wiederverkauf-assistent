// Serverseitige Verwaltung der Marktplatz-Verbindungen (Tokens).
import { marktplatzAdapter } from "./marktplatz/registry.server";

type Verbindung = {
  access_token: string | null;
  refresh_token: string | null;
  gueltig_bis: string | null;
  konto_name: string | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function verbindungSpeichern(
  userId: string,
  marktplatz: string,
  werte: {
    accessToken: string;
    refreshToken: string | null;
    gueltigBis: string;
  },
) {
  const db = await admin();
  const { error } = await db.from("marktplatz_verbindungen").upsert(
    {
      user_id: userId,
      marktplatz,
      access_token: werte.accessToken,
      refresh_token: werte.refreshToken,
      gueltig_bis: werte.gueltigBis,
      aktiv: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,marktplatz" },
  );
  if (error) {
    console.error("[Marktplatz] Speichern fehlgeschlagen", error);
    throw new Error("Die Verbindung konnte nicht gespeichert werden.");
  }
}

export async function verbindungLesen(
  userId: string,
  marktplatz: string,
): Promise<Verbindung | null> {
  const db = await admin();
  const { data } = await db
    .from("marktplatz_verbindungen")
    .select("access_token, refresh_token, gueltig_bis, konto_name")
    .eq("user_id", userId)
    .eq("marktplatz", marktplatz)
    .eq("aktiv", true)
    .maybeSingle();
  return data ?? null;
}

export async function verbindungLoeschen(userId: string, marktplatz: string) {
  const db = await admin();
  await db
    .from("marktplatz_verbindungen")
    .delete()
    .eq("user_id", userId)
    .eq("marktplatz", marktplatz);
}

/** Gültiges Zugriffstoken holen und bei Bedarf automatisch erneuern. */
export async function gueltigesToken(
  userId: string,
  marktplatzId: string,
): Promise<string> {
  const adapter = marktplatzAdapter(marktplatzId);
  const verbindung = await verbindungLesen(userId, marktplatzId);
  if (!verbindung?.access_token) {
    throw new Error(`Es ist kein ${adapter?.name ?? marktplatzId}-Konto verbunden.`);
  }

  const laeuftAb =
    verbindung.gueltig_bis && new Date(verbindung.gueltig_bis).getTime() - 120_000 < Date.now();

  if (laeuftAb && verbindung.refresh_token && adapter?.tokenErneuern) {
    const neu = await adapter.tokenErneuern(verbindung.refresh_token);
    await verbindungSpeichern(userId, marktplatzId, {
      accessToken: neu.accessToken,
      refreshToken: verbindung.refresh_token,
      gueltigBis: neu.gueltigBis,
    });
    return neu.accessToken;
  }

  return verbindung.access_token;
}

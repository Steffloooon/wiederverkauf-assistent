// Server-Funktionen für den Verkaufs-Assistenten (nur Deklarationen).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uebergabeAnlegen, uebergabenWiderrufen } from "./uebergabe.server";
import { veroeffentlichungSpeichern } from "./veroeffentlichung.server";
import { nutzungMerken } from "./nutzung.server";

/** Bereitet die Übergabe an das Verkaufsformular vor und liefert die Adresse. */
export const uebergabeStarten = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string; marktplatz: string }) => {
    if (!data?.artikelId || !data?.marktplatz) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const uebergabe = await uebergabeAnlegen(
      supabase,
      userId,
      data.artikelId,
      data.marktplatz,
    );

    await nutzungMerken(supabase, userId, "uebergabe", {
      marktplatz: data.marktplatz,
      artikel_id: data.artikelId,
    });

    return {
      token: uebergabe.token,
      formularUrl: uebergabe.formularUrl,
      name: uebergabe.name,
      gueltigBis: uebergabe.gueltigBis,
    };
  });

/** Macht offene Übergaben eines Artikels sofort ungültig. */
export const uebergabeWiderrufen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string }) => {
    if (!data?.artikelId) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data, context }) => {
    await uebergabenWiderrufen(context.supabase, data.artikelId);
    return { erfolg: true };
  });

/**
 * Der Nutzer bestätigt, dass das Angebot auf der Plattform online ist.
 * Beim Browser-Weg kennt die App das Ergebnis nicht selbst.
 */
export const veroeffentlichungBestaetigen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string; marktplatz: string; url?: string }) => {
    if (!data?.artikelId || !data?.marktplatz) throw new Error("Angaben unvollständig.");
    const url = data.url?.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      throw new Error("Bitte einen vollständigen Link mit https:// angeben.");
    }
    return { artikelId: data.artikelId, marktplatz: data.marktplatz, url: url || null };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await veroeffentlichungSpeichern(supabase, {
      artikelId: data.artikelId,
      userId,
      marktplatz: data.marktplatz,
      externeId: null,
      url: data.url,
      plattformDaten: { weg: "browser" },
    });

    await supabase
      .from("artikel")
      .update({ status: "veroeffentlicht", veroeffentlicht_am: new Date().toISOString() })
      .eq("id", data.artikelId);

    // Offene Übergaben sind ab jetzt nicht mehr nötig.
    await uebergabenWiderrufen(supabase, data.artikelId);

    await nutzungMerken(supabase, userId, "veroeffentlichung", {
      marktplatz: data.marktplatz,
      artikel_id: data.artikelId,
      weg: "browser",
    });

    return { erfolg: true };
  });

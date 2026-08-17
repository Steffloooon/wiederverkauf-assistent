// Server-Funktionen rund um den zentralen Artikel (marktplatzunabhängig).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const artikelLoeschen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string }) => {
    if (!data?.artikelId) throw new Error("Artikel-Kennung fehlt.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Bilddateien entfernen; alle abhängigen Datensätze löscht die Datenbank
    // selbst über die eingerichteten Kaskaden.
    const { data: bilder } = await supabase
      .from("artikel_bilder")
      .select("pfad, pfad_original")
      .eq("artikel_id", data.artikelId);

    const pfade = (bilder ?? [])
      .flatMap((b) => [b.pfad, b.pfad_original])
      .filter((p): p is string => Boolean(p));
    if (pfade.length > 0) {
      await supabase.storage.from("artikel-bilder").remove(pfade);
    }

    const { error } = await supabase.from("artikel").delete().eq("id", data.artikelId);
    if (error) {
      console.error("[Artikel] Löschen fehlgeschlagen", error);
      throw new Error("Der Artikel konnte nicht gelöscht werden.");
    }

    return { erfolg: true };
  });

/** Setzt ein bearbeitetes Foto wieder auf das Originalbild zurück. */
export const bildZuruecksetzen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bildId: string }) => {
    if (!data?.bildId) throw new Error("Bild-Kennung fehlt.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: bild, error } = await supabase
      .from("artikel_bilder")
      .select("id, pfad, pfad_original")
      .eq("id", data.bildId)
      .maybeSingle();
    if (error || !bild) throw new Error("Das Foto konnte nicht geladen werden.");
    if (!bild.pfad_original) throw new Error("Für dieses Foto gibt es kein Original mehr.");

    const bearbeitet = bild.pfad;
    const { error: updateFehler } = await supabase
      .from("artikel_bilder")
      .update({ pfad: bild.pfad_original, pfad_original: null, optimierung: {} })
      .eq("id", bild.id);
    if (updateFehler) throw new Error("Das Foto konnte nicht zurückgesetzt werden.");

    if (bearbeitet && bearbeitet !== bild.pfad_original) {
      await supabase.storage.from("artikel-bilder").remove([bearbeitet]);
    }

    return { erfolg: true };
  });

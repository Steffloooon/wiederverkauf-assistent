// Server-Funktionen für das Verkäuferprofil (nur Deklarationen).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { abschlusstextVorschlagLogik, ladeProfil } from "./profil.server";

export const abschlusstextVorschlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profil = await ladeProfil(supabase, userId);
    const text = await abschlusstextVorschlagLogik(profil);
    if (!text) throw new Error("Die KI konnte keinen Vorschlag erstellen. Bitte erneut versuchen.");
    return { text };
  });

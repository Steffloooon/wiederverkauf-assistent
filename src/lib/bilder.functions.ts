// Server-Funktionen für die Bildoptimierung (nur Deklarationen).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bilderOptimierenLogik } from "./bilder.server";
import type { OptimierungsEinstellungen } from "./bildoptimierung";

export const bilderOptimieren = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { artikelId: string; einstellungen: OptimierungsEinstellungen }) => {
      if (!data?.artikelId) throw new Error("Artikel-Kennung fehlt.");
      if (!data?.einstellungen?.global) throw new Error("Optimierungseinstellungen fehlen.");
      return data;
    },
  )
  .handler(async ({ data, context }) =>
    bilderOptimierenLogik({
      supabase: context.supabase,
      userId: context.userId,
      artikelId: data.artikelId,
      einstellungen: data.einstellungen,
    }),
  );

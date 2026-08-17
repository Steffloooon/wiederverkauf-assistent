// Server-Funktionen für das Kontaktformular (nur Deklaration).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { ipKennung, nachrichtSpeichern, ratenGrenzeErreicht } from "./kontakt.server";

export const kontaktSenden = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      email: string;
      betreff: string;
      nachricht: string;
      falle?: string;
    }) => {
      const name = (data?.name ?? "").trim();
      const email = (data?.email ?? "").trim();
      const betreff = (data?.betreff ?? "").trim();
      const nachricht = (data?.nachricht ?? "").trim();
      const falle = (data?.falle ?? "").trim();

      if (falle.length > 0) throw new Error("Ungültige Eingabe.");
      if (name.length < 2 || name.length > 100)
        throw new Error("Bitte geben Sie Ihren Namen an (2–100 Zeichen).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255)
        throw new Error("Bitte geben Sie eine gültige E-Mail-Adresse an.");
      if (betreff.length < 2 || betreff.length > 150)
        throw new Error("Bitte geben Sie einen Betreff an (2–150 Zeichen).");
      if (nachricht.length < 10 || nachricht.length > 3000)
        throw new Error("Bitte geben Sie eine Nachricht an (10–3000 Zeichen).");

      return { name, email, betreff, nachricht };
    },
  )
  .handler(async ({ data }) => {
    const userAgent = getRequestHeader("user-agent") ?? null;
    const ipHash = ipKennung(getRequestIP({ xForwardedFor: true }) ?? null);

    if (await ratenGrenzeErreicht(ipHash)) {
      throw new Error(
        "Es wurden zu viele Nachrichten gesendet. Bitte versuchen Sie es später erneut.",
      );
    }

    await nachrichtSpeichern({ ...data, userAgent }, ipHash);
    return { erfolg: true };
  });

export const nachrichtenLesen = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("kontakt_nachrichten")
      .select("id, name, email, betreff, nachricht, user_agent, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[Kontakt] Nachrichten konnten nicht geladen werden.", error);
      throw new Error("Die Nachrichten konnten nicht geladen werden.");
    }
    return { nachrichten: data ?? [] };
  });

export const nachrichtLoeschen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id || typeof data.id !== "string" || data.id.length === 0) {
      throw new Error("Ungültige Nachrichten-ID.");
    }
    return { id: data.id };
  })
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("kontakt_nachrichten").delete().eq("id", data.id);
    if (error) {
      console.error("[Kontakt] Nachricht konnte nicht gelöscht werden.", error);
      throw new Error("Die Nachricht konnte nicht gelöscht werden.");
    }
    return { erfolg: true };
  });

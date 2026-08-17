// Serverseitige Logik für Verkäuferprofil und Standard-Abschlusstext.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { kiAnfrage, kiJson } from "./ai.server";
import { ABSCHLUSSTEXT_PROMPT } from "./ki/prompts";
import { STATUS_LABEL_VERKAEUFER, type VerkaeuferStatus } from "./verkaeufer";

export type VerkaeuferProfil = {
  land: string;
  verkaeufer_status: VerkaeuferStatus;
  abschlusstext: string | null;
};

export async function ladeProfil(
  supabase: SupabaseClient<Database>,
  benutzerId: string,
): Promise<VerkaeuferProfil> {
  const { data } = await supabase
    .from("profiles")
    .select("land, verkaeufer_status, abschlusstext")
    .eq("id", benutzerId)
    .maybeSingle();
  return {
    land: data?.land ?? "Deutschland",
    verkaeufer_status: (data?.verkaeufer_status ?? "privat") as VerkaeuferStatus,
    abschlusstext: data?.abschlusstext ?? null,
  };
}

export async function abschlusstextVorschlagLogik(
  profil: VerkaeuferProfil,
): Promise<string> {
  const status = STATUS_LABEL_VERKAEUFER[profil.verkaeufer_status];
  const rohtext = await kiAnfrage(
    [
      {
        role: "system",
        content: ABSCHLUSSTEXT_PROMPT.text,
      },
      {
        role: "user",
        content: `Verkaeuferstatus: ${status}\nLand: ${profil.land}\nBisheriger Text: ${profil.abschlusstext || "keiner"}`,
      },
    ],
    { denken: "low" },
  );
  const ergebnis = kiJson<{ text?: string }>(rohtext);
  return (ergebnis.text ?? "").trim().slice(0, 1500);
}

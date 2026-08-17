// KI-Bildoptimierung: verbessert nur die fotografische Darstellung, niemals den Zustand.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  brauchtBearbeitung,
  einstellungFuer,
  type BildEinstellung,
  type OptimierungsEinstellungen,
} from "./bildoptimierung";
import { BILD_EHRLICHKEIT_PROMPT } from "./ki/prompts";

const BILD_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const BILD_MODELL = "google/gemini-3-pro-image";


function bildAnweisung(e: BildEinstellung): string {
  const teile: string[] = [];

  if (e.modus === "auto") {
    teile.push(
      "Bildqualitaet automatisch fuer ein professionelles Marktplatz-Angebot verbessern. Entscheide selbst, welche Anpassungen an Licht, Schaerfe, Kontrast, Farbtreue, Schatten und Bildaufbau sinnvoll sind.",
    );
  } else if (e.modus === "manuell") {
    const o = e.optionen;
    if (o.schaerfe) teile.push("Schaerfe natuerlich verbessern (keine Artefakte).");
    if (o.helligkeit) teile.push("Helligkeit ausgleichen und Belichtung optimieren.");
    if (o.kontrast) teile.push("Kontrast dezent verbessern.");
    if (o.farben) teile.push("Farben natuerlich und farbtreu verbessern, keine Uebersaettigung.");
    if (o.schatten) teile.push("Harte Schatten abmildern, Schattenzeichnung aufhellen.");
    if (o.zuschneiden) teile.push("Bild sinnvoll auf das Produkt zuschneiden.");
    if (o.zentrieren) teile.push("Produkt mittig ausrichten mit ruhigem Rand.");
  }

  if (e.hintergrundModus === "auto") {
    teile.push("Hintergrund automatisch so aufbereiten, dass er ruhig und professionell wirkt.");
  } else if (e.hintergrundModus === "manuell") {
    const h = e.hintergrund;
    if (h.eigenesBild) {
      teile.push("Produkt freistellen und exakt auf den mitgelieferten Hintergrund setzen.");
    } else if (h.farbe) {
      teile.push(`Produkt freistellen und auf einen einfarbigen Hintergrund (${h.farbe}) setzen.`);
    } else if (h.entfernen) {
      teile.push("Hintergrund entfernen und durch reines Weiss ersetzen.");
    }
    if (h.verbessern) teile.push("Vorhandenen Hintergrund saeubern und beruhigen, ohne ihn zu ersetzen.");
  }

  return teile.join("\n- ");
}

type Inhalt =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function bildBearbeiten(
  datenUrl: string,
  einstellung: BildEinstellung,
): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("KI-Zugang ist nicht konfiguriert.");

  const inhalt: Inhalt[] = [
    {
      type: "text",
      text: `Bearbeite dieses Produktfoto fuer ein deutsches Verkaufsinserat.

Aufgaben:
- ${bildAnweisung(einstellung)}

${BILD_EHRLICHKEIT_PROMPT.text}

Gib ausschliesslich das bearbeitete Bild zurueck.`,
    },
    { type: "image_url", image_url: { url: datenUrl } },
  ];

  if (einstellung.hintergrund.eigenesBild) {
    inhalt.push({
      type: "image_url",
      image_url: { url: einstellung.hintergrund.eigenesBild },
    });
  }

  const antwort = await fetch(BILD_GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: BILD_MODELL,
      messages: [{ role: "user", content: inhalt }],
      modalities: ["image", "text"],
    }),
  });

  if (antwort.status === 429) throw new Error("Das KI-Limit ist erreicht. Bitte später erneut versuchen.");
  if (antwort.status === 402)
    throw new Error("Das KI-Guthaben ist aufgebraucht. Bitte im Arbeitsbereich Guthaben nachladen.");
  if (!antwort.ok) {
    console.error("[Bild] Fehler", antwort.status, await antwort.text());
    return null;
  }

  const daten = (await antwort.json()) as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const ausChat = daten.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (ausChat) return ausChat;
  const b64 = daten.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  const url = daten.data?.[0]?.url;
  if (url) return url;
  return null;
}

function base64Zu (datenUrl: string): { bytes: Uint8Array; typ: string } {
  const treffer = /^data:([^;]+);base64,(.*)$/s.exec(datenUrl);
  const typ = treffer?.[1] ?? "image/png";
  const roh = treffer?.[2] ?? datenUrl;
  const binaer = atob(roh);
  const bytes = new Uint8Array(binaer.length);
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i);
  return { bytes, typ };
}

async function alsDatenUrl(blob: Blob): Promise<string> {
  const puffer = new Uint8Array(await blob.arrayBuffer());
  let binaer = "";
  for (let i = 0; i < puffer.length; i += 8192) {
    binaer += String.fromCharCode(...puffer.subarray(i, i + 8192));
  }
  return `data:${blob.type || "image/jpeg"};base64,${btoa(binaer)}`;
}

export async function bilderOptimierenLogik(args: {
  supabase: SupabaseClient<Database>;
  userId: string;
  artikelId: string;
  einstellungen: OptimierungsEinstellungen;
}): Promise<{ bearbeitet: number; uebersprungen: number }> {
  const { supabase, userId, artikelId, einstellungen } = args;

  const { data: bilder, error } = await supabase
    .from("artikel_bilder")
    .select("id, pfad, pfad_original, reihenfolge")
    .eq("artikel_id", artikelId)
    .eq("typ", "produkt")
    .order("reihenfolge", { ascending: true });
  if (error) throw new Error("Die Fotos konnten nicht geladen werden.");

  let bearbeitet = 0;
  let uebersprungen = 0;

  for (const bild of bilder ?? []) {
    const einstellung = einstellungFuer(einstellungen, bild.reihenfolge);
    if (!brauchtBearbeitung(einstellung)) {
      uebersprungen++;
      continue;
    }

    const quelle = bild.pfad_original ?? bild.pfad;
    const { data: datei } = await supabase.storage.from("artikel-bilder").download(quelle);
    if (!datei) {
      uebersprungen++;
      continue;
    }

    let ergebnis: string | null = null;
    try {
      ergebnis = await bildBearbeiten(await alsDatenUrl(datei), einstellung);
    } catch (fehler) {
      console.error("[Bild] Bearbeitung fehlgeschlagen", fehler);
      throw fehler;
    }
    if (!ergebnis) {
      uebersprungen++;
      continue;
    }

    const { bytes, typ } = base64Zu(ergebnis);
    const neuerPfad = `${userId}/${artikelId}/opt-${bild.reihenfolge}-${Date.now()}.png`;
    const { error: uploadFehler } = await supabase.storage
      .from("artikel-bilder")
      .upload(neuerPfad, bytes, { contentType: typ, upsert: true });
    if (uploadFehler) {
      uebersprungen++;
      continue;
    }

    await supabase
      .from("artikel_bilder")
      .update({
        pfad: neuerPfad,
        pfad_original: quelle,
        optimierung: JSON.parse(JSON.stringify(einstellung)),
      })
      .eq("id", bild.id);
    bearbeitet++;
  }

  return { bearbeitet, uebersprungen };
}

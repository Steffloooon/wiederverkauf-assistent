// Serverseitiger Zugang zum Lovable AI Gateway.
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const KI_MODELL = "openai/gpt-5.6-sol";

export type KiInhalt =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type KiNachricht = {
  role: "system" | "user" | "assistant";
  content: string | KiInhalt[];
};

export class KiFehler extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export type KiOptionen = {
  modell?: string;
  denken?: "none" | "low" | "medium" | "high";
};

export async function kiAnfrage(
  nachrichten: KiNachricht[],
  optionen: KiOptionen = {},
): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new KiFehler("KI-Zugang ist nicht konfiguriert.", 500);

  const antwort = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: optionen.modell ?? KI_MODELL,
      reasoning_effort: optionen.denken ?? "none",
      response_format: { type: "json_object" },
      messages: nachrichten,
    }),
  });

  if (antwort.status === 429) {
    throw new KiFehler(
      "Das KI-Limit ist momentan erreicht. Bitte versuche es in einigen Minuten erneut.",
      429,
    );
  }
  if (antwort.status === 402) {
    throw new KiFehler(
      "Das KI-Guthaben ist aufgebraucht. Bitte lade im Arbeitsbereich Guthaben nach.",
      402,
    );
  }
  if (!antwort.ok) {
    const text = await antwort.text();
    console.error("[KI] Fehler", antwort.status, text);
    throw new KiFehler("Die KI-Analyse ist fehlgeschlagen. Bitte erneut versuchen.", 500);
  }

  const daten = (await antwort.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const inhalt = daten.choices?.[0]?.message?.content;
  if (!inhalt) throw new KiFehler("Die KI hat keine Antwort geliefert.", 500);
  return inhalt;
}

/** Robustes Parsen der JSON-Antwort (auch mit Code-Fence). */
export function kiJson<T>(rohtext: string): T {
  let text = rohtext.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start > 0 || end < text.length - 1) {
    text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new KiFehler("Die KI-Antwort war nicht lesbar. Bitte erneut versuchen.", 500);
  }
}

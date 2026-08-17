// Server-Funktionen für Marktplätze (nur Deklarationen).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aktiverModus, marktplaetze, marktplatzAdapter } from "./marktplatz/registry.server";
import {
  gueltigesToken,
  verbindungLesen,
  verbindungLoeschen,
  verbindungSpeichern,
} from "./marktplatz.server";
import { ladeArtikel, ladeBildUrls } from "./artikel.server";
import {
  veroeffentlichungSpeichern,
  veroeffentlichungenLesen,
} from "./veroeffentlichung.server";
import { nutzungMerken } from "./nutzung.server";


export const marktplatzUebersicht = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const liste = [];
    for (const m of marktplaetze) {
      const konfiguriert = m.istKonfiguriert();
      const verbindung = konfiguriert ? await verbindungLesen(context.userId, m.id) : null;
      liste.push({
        id: m.id,
        name: m.name,
        beschreibung: m.beschreibung,
        verfuegbar: m.verfuegbar,
        konfiguriert,
        verbunden: Boolean(verbindung?.access_token),
        gueltigBis: verbindung?.gueltig_bis ?? null,
        // "api" = ein Klick direkt aus der App, "browser" = Assistent füllt das Formular.
        modus: aktiverModus(m, Boolean(verbindung?.access_token)),
      });

    }
    return liste;
  });

export const marktplatzAuthLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { marktplatz: string; state: string }) => {
    if (!data?.marktplatz || !data?.state) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data }) => {
    const adapter = marktplatzAdapter(data.marktplatz);
    if (!adapter?.authUrl || !adapter.istKonfiguriert()) {
      throw new Error(
        "Für diesen Marktplatz sind noch keine Zugangsdaten hinterlegt. Bitte zuerst die API-Schlüssel eintragen.",
      );
    }
    return { url: adapter.authUrl(data.state) };
  });

export const marktplatzVerbindungAbschliessen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { marktplatz: string; code: string }) => {
    if (!data?.marktplatz || !data?.code) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const adapter = marktplatzAdapter(data.marktplatz);
    if (!adapter?.codeEinloesen) throw new Error("Marktplatz nicht unterstützt.");
    const tokens = await adapter.codeEinloesen(data.code);
    await verbindungSpeichern(context.userId, data.marktplatz, tokens);
    return { erfolg: true, name: adapter.name };
  });

export const marktplatzTrennen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { marktplatz: string }) => {
    if (!data?.marktplatz) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data, context }) => {
    await verbindungLoeschen(context.userId, data.marktplatz);
    return { erfolg: true };
  });

export const artikelVeroeffentlichen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string; marktplatz: string; bestaetigt: boolean }) => {
    if (!data?.artikelId || !data?.marktplatz) throw new Error("Angaben unvollständig.");
    if (data.bestaetigt !== true) {
      throw new Error("Die Veröffentlichung muss ausdrücklich bestätigt werden.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const adapter = marktplatzAdapter(data.marktplatz);
    if (!adapter?.veroeffentlichen) {
      throw new Error("Dieser Marktplatz unterstützt das Veröffentlichen noch nicht.");
    }

    const artikel = await ladeArtikel(supabase, data.artikelId);
    if (!artikel.titel || !artikel.beschreibung) {
      throw new Error("Bitte erst die KI-Analyse ausführen und das Inserat prüfen.");
    }
    const preis = artikel.preis_empfehlung;
    if (!preis || Number(preis) <= 0) {
      throw new Error("Bitte einen gültigen Verkaufspreis festlegen.");
    }

    const bildUrls = await ladeBildUrls(supabase, artikel.id, 60 * 60 * 24 * 7);
    if (bildUrls.length === 0) {
      throw new Error("Für die Veröffentlichung wird mindestens ein Produktfoto benötigt.");
    }

    const token = await gueltigesToken(userId, data.marktplatz);

    const aspekte: Record<string, string[]> = {};
    const daten = (artikel.technische_daten ?? {}) as Record<string, unknown>;
    for (const [schluessel, wert] of Object.entries(daten)) {
      if (typeof wert === "string" && wert.trim()) aspekte[schluessel] = [wert];
    }

    const eingabe = {
      artikelId: artikel.id,
      titel: artikel.titel,
      beschreibung: [artikel.beschreibung, artikel.zustandsbeschreibung, artikel.abschlusstext]
        .filter(Boolean)
        .join("\n\n"),
      zustand: artikel.zustand,
      zustandsbeschreibung: artikel.zustandsbeschreibung,
      marke: artikel.marke,
      modell: artikel.modell,
      technischeDaten: aspekte,
      bildUrls,
      preis: Number(preis),
      kategorie: artikel.kategorie,
      plattformDaten: { ebay_kategorie_id: artikel.ebay_kategorie_id },
    };

    // Pflichtfelder prüft der Marktplatz selbst – der Kern bleibt neutral.
    const fehlt = adapter.pflichtfelderPruefen?.(eingabe) ?? [];
    if (fehlt.length > 0) {
      throw new Error(`Für ${adapter.name} fehlt noch: ${fehlt.join(", ")}.`);
    }

    const ergebnis = await adapter.veroeffentlichen(token, eingabe);

    await veroeffentlichungSpeichern(supabase, {
      artikelId: artikel.id,
      userId,
      marktplatz: adapter.id,
      externeId: ergebnis.angebotId,
      url: ergebnis.url,
      plattformDaten: ergebnis.plattformDaten,
    });

    await supabase
      .from("artikel")
      .update({ status: "veroeffentlicht", veroeffentlicht_am: new Date().toISOString() })
      .eq("id", artikel.id);

    await nutzungMerken(supabase, userId, "veroeffentlichung", {
      marktplatz: adapter.id,
      artikel_id: artikel.id,
    });

    return { angebotId: ergebnis.angebotId, url: ergebnis.url, marktplatz: adapter.id };
  });

/** Alle Veröffentlichungen eines Artikels (marktplatzunabhängig). */
export const artikelVeroeffentlichungen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string }) => {
    if (!data?.artikelId) throw new Error("Angaben unvollständig.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const liste = await veroeffentlichungenLesen(context.supabase, data.artikelId);
    return liste.map((v) => ({
      marktplatz: v.marktplatz,
      name: marktplatzAdapter(v.marktplatz)?.name ?? v.marktplatz,
      url: v.url,
      status: v.status,
      veroeffentlichtAm: v.veroeffentlicht_am,
    }));
  });


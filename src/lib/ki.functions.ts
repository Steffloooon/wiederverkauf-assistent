// Server-Funktionen für die KI (nur Deklarationen – Logik liegt in *.server.ts).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyseAusfuehren } from "./analyse.server";
import { feedbackAuswerten } from "./analyse.server";
import {
  ladeArtikel,
  ladeBildUrls,
  ladeRegeln,
  ladeVerkaufsverlauf,
} from "./artikel.server";
import { marktdatenSammeln } from "./marktplatz/registry.server";
import { nutzungMerken } from "./nutzung.server";
import { ladeProfil } from "./profil.server";
import { STATUS_LABEL_VERKAEUFER } from "./verkaeufer";

export const artikelAnalysieren = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string }) => {
    if (!data?.artikelId) throw new Error("Artikel-Kennung fehlt.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const artikel = await ladeArtikel(supabase, data.artikelId);
    const profil = await ladeProfil(supabase, userId);
    const [bildUrls, erkennungsBildUrls, regeln, verlauf] = await Promise.all([
      ladeBildUrls(supabase, artikel.id),
      ladeBildUrls(supabase, artikel.id, 60 * 60, "erkennung"),
      ladeRegeln(supabase),
      ladeVerkaufsverlauf(supabase),
    ]);

    const suchbegriff = [artikel.marke, artikel.modell, artikel.details]
      .filter(Boolean)
      .join(" ")
      .slice(0, 120);
    // Marktdaten kommen aus allen verbundenen Marktplaetzen (Registry),
    // nicht aus einer einzelnen Plattform.
    const { vergleiche: marktdaten, quellen } = await marktdatenSammeln(suchbegriff);

    const ergebnis = await analyseAusfuehren({
      eingabe: {
        zustand: artikel.zustand,
        ist_neu: artikel.ist_neu,
        marke: artikel.marke,
        modell: artikel.modell,
        maengel: artikel.maengel,
        details: artikel.details,
        zubehoer: artikel.zubehoer,
        notizen: artikel.notizen,
        verkaeufer_status: STATUS_LABEL_VERKAEUFER[profil.verkaeufer_status],
        land: profil.land,
      },
      bildUrls,
      erkennungsBildUrls,
      regeln,
      verlauf,
      marktdaten,
      marktdatenQuelle: quellen.length > 0 ? quellen.join(", ") : "keine",
    });

    const { error } = await supabase
      .from("artikel")
      .update({
        status: "analysiert",
        abschlusstext: artikel.abschlusstext ?? profil.abschlusstext,
        titel: ergebnis.titel,
        beschreibung: ergebnis.beschreibung,
        zustandsbeschreibung: ergebnis.zustandsbeschreibung,
        suchbegriffe: ergebnis.suchbegriffe,
        kategorie: ergebnis.kategorie,
        ebay_kategorie_id: ergebnis.ebay_kategorie_id,
        technische_daten: ergebnis.technische_daten,
        versandempfehlung: ergebnis.versandempfehlung,
        fehlende_angaben: ergebnis.fehlende_angaben,
        preis_empfehlung: ergebnis.preis_empfehlung,
        preis_start: ergebnis.preis_start,
        preis_schnell: ergebnis.preis_schnell,
        preis_maximum: ergebnis.preis_maximum,
        preis_begruendung: ergebnis.preis_begruendung,
        preis_vertrauen: ergebnis.preis_vertrauen,
        preis_erklaerungen: ergebnis.preis_erklaerungen,
        erkannte_daten: ergebnis.erkannte_daten,
        verkaufsgeschwindigkeit: ergebnis.verkaufsgeschwindigkeit,
        marktanalyse: {
          ...ergebnis.marktanalyse,
          rueckfragen: ergebnis.rueckfragen,
          vergleichsangebote: marktdaten.slice(0, 12),
          live_marktdaten: marktdaten.length > 0,
          neupreis_min: ergebnis.neupreis_min,
          neupreis_max: ergebnis.neupreis_max,
          neupreis_quelle: ergebnis.neupreis_quelle,
          neupreis_guenstigst: ergebnis.neupreis_guenstigst,
          neupreis_guenstigst_quelle: ergebnis.neupreis_guenstigst_quelle,
          gebrauchtpreis_min: ergebnis.gebrauchtpreis_min,
          gebrauchtpreis_max: ergebnis.gebrauchtpreis_max,
          plattform_preise: ergebnis.plattform_preise,
        },
      })
      .eq("id", artikel.id);


    if (error) {
      console.error("[Analyse] Speichern fehlgeschlagen", error);
      throw new Error("Die Analyse konnte nicht gespeichert werden.");
    }

    await nutzungMerken(supabase, userId, "analyse", { artikel_id: artikel.id });

    return { erfolg: true, vergleicheGefunden: marktdaten.length };
  });

export const feedbackSpeichern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artikelId: string; feedback: string }) => {
    const feedback = (data?.feedback ?? "").trim();
    if (!data?.artikelId) throw new Error("Artikel-Kennung fehlt.");
    if (feedback.length < 3) throw new Error("Bitte gib ein etwas ausführlicheres Feedback ein.");
    if (feedback.length > 1000) throw new Error("Das Feedback ist zu lang (max. 1000 Zeichen).");
    return { artikelId: data.artikelId, feedback };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ladeArtikel(supabase, data.artikelId);

    await supabase.from("artikel_feedback").insert({
      artikel_id: data.artikelId,
      user_id: userId,
      feedback: data.feedback,
    });

    const bestehende = await ladeRegeln(supabase);
    const ergebnis = await feedbackAuswerten(data.feedback, bestehende);

    if (ergebnis.regeln.length > 0) {
      await supabase.from("ki_regeln").insert(
        ergebnis.regeln.map((r) => ({
          user_id: userId,
          regel: r.regel,
          bereich: r.bereich,
        })),
      );
    }

    await nutzungMerken(supabase, userId, "abschlusstext", { artikel_id: data.artikelId });

    return { antwort: ergebnis.antwort, neueRegeln: ergebnis.regeln.length };
  });

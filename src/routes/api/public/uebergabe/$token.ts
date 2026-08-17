// Öffentlicher Abruf eines Übergabe-Pakets.
//
// Sicherheit: Der Zugang erfolgt ausschließlich über eine 64-stellige
// Zufallskennung, die maximal 30 Minuten gültig ist und widerrufen werden kann.
// Das Paket enthält nur Anzeigendaten und zeitlich begrenzte Foto-Links –
// keine Namen, Adressen, Konto- oder Zahlungsdaten.
import { createFileRoute } from "@tanstack/react-router";

const KOPFZEILEN = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  // Der Assistent läuft auf der Plattformseite, also anderer Ursprung.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const Route = createFileRoute("/api/public/uebergabe/$token")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: KOPFZEILEN }),
      GET: async ({ params }) => {
        const { uebergabePaketLesen } = await import("@/lib/uebergabe.server");
        try {
          const paket = await uebergabePaketLesen(params.token);
          if (!paket) {
            return new Response(
              JSON.stringify({ fehler: "Die Übergabe ist abgelaufen oder unbekannt." }),
              { status: 410, headers: KOPFZEILEN },
            );
          }
          return new Response(JSON.stringify(paket), { status: 200, headers: KOPFZEILEN });
        } catch (fehler) {
          console.error("[Uebergabe] Abruf fehlgeschlagen", fehler);
          return new Response(
            JSON.stringify({ fehler: "Die Anzeigendaten konnten nicht geladen werden." }),
            { status: 500, headers: KOPFZEILEN },
          );
        }
      },
    },
  },
});

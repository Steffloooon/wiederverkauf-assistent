// Liefert den Ausfüll-Assistenten als JavaScript aus.
//
// Die Android-App spielt dieses Skript in ihr Verkaufsfenster ein. Es ist
// dieselbe Datei, die auch in der Chrome-Erweiterung steckt – damit gibt es die
// Formular-Logik nur einmal im Projekt.
import { createFileRoute } from "@tanstack/react-router";
import fuellSkript from "../../../../../extension/fuellen.js?raw";

export const Route = createFileRoute("/api/public/assistent/skript")({
  server: {
    handlers: {
      GET: async () =>
        new Response(fuellSkript, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        }),
    },
  },
});

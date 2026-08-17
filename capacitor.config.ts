import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android-Hülle für den Wiederverkauf-Assistenten.
 *
 * Die App lädt die veröffentlichte Web-App und stellt zusätzlich das
 * Verkaufsfenster bereit, in dem der Ausfüll-Assistent laufen kann –
 * das ersetzt auf Android die Chrome-Erweiterung.
 */
const config: CapacitorConfig = {
  appId: "de.wiederverkauf.assistent",
  appName: "Wiederverkauf-Assistent",
  // Die App laedt die veroeffentlichte Web-App (server.url). "dist" dient nur
  // als Platzhalter-Ordner, den der Bauauftrag vor dem Sync anlegt.
  webDir: "dist",
  server: {
    // Die App laedt immer die aktuelle Web-App – Aenderungen sind ohne
    // Neuinstallation sofort im Handy sichtbar.
    url: "https://stefflon.lovable.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

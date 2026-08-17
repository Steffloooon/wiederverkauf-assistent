// Verkaufs-Assistent: öffnet das Formular der Plattform und lässt es ausfüllen.
//
// Zwei Wege, dieselbe Logik:
//  - Android-App (Capacitor): eigenes Verkaufsfenster, Skript wird eingespielt.
//  - Chrome am Rechner: neuer Tab, die Erweiterung erkennt die Kennung selbst.

/** Läuft die App in der Android-Hülle? */
export function istAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Ist die Chrome-Erweiterung auf dieser Seite installiert? */
export function istErweiterungAktiv(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.hasAttribute("data-listing-assistent");
}

function adresseMitKennung(formularUrl: string, token: string): string {
  const basis = window.location.origin;
  const trenner = formularUrl.includes("#") ? "&" : "#";
  return `${formularUrl}${trenner}la-token=${encodeURIComponent(token)}&la-api=${encodeURIComponent(basis)}`;
}

export type AssistentErgebnis = { weg: "android" | "chrome" };

/**
 * Öffnet das Verkaufsformular der Plattform mit der Übergabe-Kennung.
 * Der Assistent füllt aus – abgeschickt wird immer von Hand.
 */
export async function verkaufsformularOeffnen(
  formularUrl: string,
  token: string,
): Promise<AssistentErgebnis> {
  const ziel = adresseMitKennung(formularUrl, token);

  if (istAndroidApp()) {
    const { InAppBrowser } = await import("@capgo/inappbrowser");
    const skript = await fetch("/api/public/assistent/skript").then((r) => r.text());

    await InAppBrowser.openWebView({
      url: ziel,
      title: "Angebot einstellen",
      toolbarColor: "#101828",
      isPresentAfterPageLoad: true,
    });

    // Nach dem Laden das Ausfüllen starten. Die Angaben werden direkt gesetzt,
    // weil die Plattform die Adresse mit Kennung teilweise umschreibt.
    await InAppBrowser.addListener("browserPageLoaded", async () => {
      try {
        await InAppBrowser.executeScript({
          code: `window.__laUebergabe={token:${JSON.stringify(token)},api:${JSON.stringify(window.location.origin)}};\n${skript}`,
        });
      } catch (fehler) {
        console.error("[Assistent] Einspielen fehlgeschlagen", fehler);
      }
    });

    return { weg: "android" };
  }

  window.open(ziel, "_blank", "noopener,noreferrer");
  return { weg: "chrome" };
}

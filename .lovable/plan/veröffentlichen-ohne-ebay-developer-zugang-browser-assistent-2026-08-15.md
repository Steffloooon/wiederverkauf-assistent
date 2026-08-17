# Veröffentlichen ohne eBay-Developer-Zugang: Browser-Assistent

## Die ehrliche Lage
Ein Klick in der App, der direkt auf eBay landet, geht technisch **nur** über die offizielle API – und die braucht zwingend einen Developer-Zugang. Den bekommst du nicht. Also drehen wir den Weg um: nicht die App spricht mit eBay, sondern **dein eigener Browser** – eingeloggt in deinem normalen eBay-Konto.

Das ist erlaubt (du füllst dein eigenes Formular in deinem eigenen Konto), kostenlos, und funktioniert genauso für Kleinanzeigen und Vinted, wo es überhaupt keine API gibt.

## So fühlt es sich an

```text
App: Artikel fertig analysiert
        |
   "Auf eBay veröffentlichen"  <-- 1 Klick in der App
        |
        v
eBay-Formular öffnet sich, bereits komplett gefüllt:
Titel, Beschreibung, Zustand, Preis, Kategorie,
Merkmale, Abschlusstext, alle Fotos
        |
        v
Du prüfst kurz und drückst bei eBay "Angebot einstellen"
```

Kein Feld wird kopiert, keine Datei hochgeladen, kein Zwischendienst. Nach der einmaligen Einrichtung sind es genau zwei Klicks.

## Was gebaut wird

### 1. Übergabe-Paket pro Artikel
- Beim Klick auf "Veröffentlichen" erzeugt die App ein einmaliges, nicht erratbares Token für den Artikel.
- Ein öffentlicher Endpunkt liefert unter diesem Token die fertigen Anzeigendaten plus zeitlich begrenzte Bild-Links. Der Bilder-Speicher bleibt privat, die Links laufen automatisch ab.
- Das Token gilt nur kurz (z. B. 30 Minuten) und kann jederzeit widerrufen werden. Keine Klarnamen oder Kontodaten im Paket.

### 2. Zwei Wege zum selben Ziel – Desktop und Android

**Am Rechner (Chrome, Edge, Brave, Opera): Chrome-Erweiterung**
- Echte Erweiterung (Manifest V3), Download direkt aus der App.
- Einrichtung einmalig: ZIP herunterladen, entpacken, in Chrome unter Erweiterungen den Entwicklermodus einschalten, Ordner laden. Anleitung Schritt für Schritt auf Deutsch in der App.

**Am Android-Handy: eigene Android-App mit eingebautem Verkaufsfenster**
- Chrome für Android erlaubt grundsätzlich keine Erweiterungen – das ist eine Google-Beschränkung, daran kann keine App etwas ändern.
- Lösung: Wir verpacken deine App zusätzlich als richtige Android-App. Darin öffnet sich beim Klick auf "Veröffentlichen" ein eingebautes Browserfenster mit dem eBay-Verkaufsformular, und der Assistent füllt es dort aus.
- Du meldest dich einmal in diesem Fenster bei eBay an; die Anmeldung bleibt gespeichert. Danach ist es auf dem Handy genau ein Klick.
- Die App wird per Capacitor gebaut und einmalig auf dein Handy installiert. Änderungen an der App landen weiterhin automatisch darin, ohne Neuinstallation.

**Beiden gemeinsam:** Abschicken machst immer **du** selbst. Der Assistent klickt nie "Einstellen" – so entstehen keine Angebote aus Versehen.

### 3. Plattform-Regeln bleiben modular
- Der bestehende Adapter-Vertrag bekommt einen zweiten Modus: `api` (wie bisher vorbereitet) und `browser`.
- Pro Plattform wird nur eine kleine Feldzuordnung hinterlegt (welches Feld heißt wie, welche Zustandswerte gibt es). Der Artikel selbst bleibt plattformneutral.
- Die Feldzuordnung wird **einmal** geschrieben und von Erweiterung und Android-App gemeinsam genutzt – kein doppelter Pflegeaufwand.
- Damit lassen sich Kleinanzeigen und Vinted mit demselben Mechanismus nachziehen, ohne den Kern zu ändern.
- Sollte irgendwann doch ein Developer-Zugang kommen, wird bei eBay einfach wieder auf `api` umgestellt – dann sogar ganz ohne Browser-Schritt.

### 4. Status in der App
- Nach dem Einstellen bestätigst du in der App mit einem Tipp "veröffentlicht" und kannst den Angebotslink einfügen; der Artikel wandert in `artikel_veroeffentlichungen`.
- Die Übersicht zeigt weiterhin klar: Entwurf, analysiert, veröffentlicht, verkauft.

### 5. Reihenfolge der Umsetzung
1. Übergabe-Paket + Token-Endpunkt + Widerruf
2. Gemeinsame Feldzuordnung für eBay (wird von beiden Wegen genutzt)
3. Veröffentlichungs-Knopf im Artikel auf den neuen Weg umstellen
4. Android-App mit Verkaufsfenster (dein Haupt-Anwendungsfall)
5. Chrome-Erweiterung für den Rechner inkl. Download- und Anleitungsseite
6. Kleinanzeigen, danach Vinted

## Was du zum Android-Teil wissen musst
Die Android-App wird nicht über den Play Store installiert, sondern einmal direkt auf dein Handy gebracht (die App zeigt dir dazu eine deutsche Anleitung). Der Bau der Android-Datei passiert einmalig auf einem Rechner mit Android Studio – danach brauchst du das nie wieder.


## Was unangetastet bleibt
KI-Analyse, Preisanalyse mit Plattformpreisen, Bildoptimierung, Bildgalerie, Verkäuferprofil, Abschlusstext, Löschfunktion, Kontaktformular und Postfach.

## Technische Details
- `src/lib/marktplatz/typen.ts`: Adapter-Modus `api` | `browser`, neue optionale `feldZuordnung()`.
- `src/lib/marktplatz/ebay.server.ts`: Feldzuordnung für das eBay-Verkaufsformular (Zustandswerte, Kategorie, Merkmale).
- `src/lib/uebergabe.server.ts` / `uebergabe.functions.ts` (neu): Token erzeugen, Paket bauen, widerrufen.
- `src/routes/api/public/uebergabe/$token.ts` (neu): liefert Paket und Ausfüll-Skript, streng zeitbegrenzt.
- `extension/` (neu): Chrome-Erweiterung, Manifest V3 – Content-Script, Service Worker, Popup mit Statusanzeige; gepackt als `public/inserate-assistent.zip`.
- Capacitor (`@capacitor/core`, `@capacitor/android`, In-App-Browser mit Skript-Injektion) für die Android-App; `capacitor.config.ts` neu.
- `src/routes/_authenticated/assistent.tsx` (neu): Download der Erweiterung, Android-Anleitung, Verbindungsstatus.
- Migration: Tabelle für Übergabe-Token mit Ablaufzeit und RLS.



# Vinted anbinden, Kleinanzeigen vervollständigen

## Ausgangslage
Kleinanzeigen ist bereits als Browser-Adapter aktiv (Titel, Beschreibung, Preis, Zustand, Fotos). Vinted steht in der Registry nur als "Anbindung in Vorbereitung" und hat noch keinen Formularplan. Beide Plattformen haben keine offene Schnittstelle für Privat-/Kleinverkäufer, also läuft alles über den bestehenden Browser-Assistenten (Chrome-Erweiterung am Rechner, Verkaufsfenster in der Android-App).

## Was gebaut wird

### 1. Vinted-Adapter (neu)
- Neuer Connector mit Browser-Modus und Formularplan für das Vinted-Verkaufsformular: Titel, Beschreibung, Preis, Zustand, Marke sowie das Foto-Feld.
- Zustands-Übersetzung auf die Vinted-Stufen (Neu mit Etikett, Neu ohne Etikett, Sehr gut, Gut, Befriedigend).
- Pflichtfeldprüfung: Titel, Beschreibung, Preis, Zustand, mindestens ein Foto – Vinted verlangt zwingend ein Bild.
- Hinweis in der App: Kategorie, Größe und Versandpaketgröße wählst du bei Vinted selbst; alles andere ist ausgefüllt.
- Vinted wird in der Registry von "geplant" auf verfügbar umgestellt.

### 2. Kleinanzeigen nachziehen
- Zusätzliche Felder im Formularplan, soweit ohne Kategorieauswahl möglich: Marke/Zustand-Merkmale und die Auswahl "Preis ist Festpreis / VB".
- Zusätzliche Ersatz-Selektoren, damit das Ausfüllen auch bei kleinen Layout-Änderungen greift.

### 3. Assistent kennt beide Plattformen
- Erweiterung und Verkaufsfenster erhalten Vinted als erlaubte Seite (Berechtigungen und Content-Script im Manifest, neu gepacktes ZIP zum Download).
- Die Assistent-Seite listet eBay, Kleinanzeigen und Vinted als unterstützt.

### 4. Artikelansicht
- Im Bereich "Veröffentlichen" erscheinen alle drei Plattformen mit demselben Ablauf: ein Klick öffnet das gefüllte Formular, danach bestätigst du in der App "veröffentlicht" und kannst den Angebotslink einfügen.
- Fehlende Pflichtangaben werden pro Plattform klar benannt, bevor etwas geöffnet wird.

## Was unverändert bleibt
KI-Analyse, Preisanalyse, Bildoptimierung, Galerie, Verkäuferprofil, Abschlusstext, eBay-Weg, Kontaktformular und Postfach.

## Technische Details
- `src/lib/marktplatz/vinted.server.ts` (neu): `vintedPflichtfelder`, `vintedFormularplan`, `vintedAdapter` mit `modi: ["browser"]`.
- `src/lib/marktplatz/registry.server.ts`: Vinted-Adapter statt Platzhalter registrieren.
- `src/lib/marktplatz/kleinanzeigen.server.ts`: Felder und Selektoren ergänzen.
- `extension/manifest.json` + neu gepacktes `public/inserate-assistent.zip`; `fuellen.js` bleibt generisch (Plan kommt vom Server).
- `src/routes/_authenticated/assistent.tsx` und `artikel.$artikelId.tsx`: Texte/Plattformliste anpassen.
- Keine Datenbankänderung nötig – `uebergabe_token` und `artikel_veroeffentlichungen` speichern die Plattform schon als Kennung.

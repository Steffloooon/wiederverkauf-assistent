# Preise, Titel, Ladehinweis und Android ohne Rechner

## 1. Preise: günstige Massenartikel realistisch bewerten

Problem am Beispiel „Magic Tracks Race Car blau“: Der Artikel ist neu ab ca. 4 EUR zu haben, die App empfiehlt aber mindestens 8 EUR. Ursache liegt in der Preis-Engine: sie geht vom Herstellerneupreis aus und rechnet nur prozentual herunter, statt tatsächlich verfügbare Billigangebote als Obergrenze zu nehmen.

Änderungen:
- Neue Pflichtstufe in der Preis-Engine: Vor den Preisstufen wird der **tatsächlich verfügbare günstigste Neupreis** bestimmt (Kleinanzeigen neu/OVP, Massenware-Shops, Sets/Mehrfachpackungen einzeln gerechnet) – getrennt vom offiziellen Neupreis.
- Harte Regel: Gebrauchtpreise dürfen diesen günstigsten Neupreis **nicht erreichen**; bei Artikeln unter 15 EUR Neupreis liegen alle Stufen deutlich darunter (Kleinteile, Spielzeug, Zubehör).
- Set-Logik: Ist der Artikel Teil eines Sets, muss der Stückpreis gerechnet werden, nicht der Setpreis.
- Zusätzliche Sicherung im Code (nicht nur im Prompt): Nach der KI-Antwort werden alle vier Preisstufen automatisch auf den günstigsten erkannten Neupreis begrenzt und die Reihenfolge (schnell ≤ Empfehlung ≤ Start ≤ Maximum) korrigiert. So kann kein zu hoher Preis mehr durchrutschen, auch wenn die KI sich verschätzt.
- Genauere Analyse: Die Preisanalyse läuft mit höherer Denkstufe, weil Genauigkeit hier wichtiger ist als Sekunden.
- Neues Feld in der Anzeige: „Günstigster Neupreis am Markt“ mit Quelle, damit die Herleitung sichtbar ist.

## 2. Titel: Suchbegriffe müssen drin sein

Aktuell erzwingt der Prompt nur Marke + Modell + Zustand. „Magic Tracks Race Car blau“ enthält damit kein Wort, nach dem tatsächlich gesucht wird.

Änderung:
- Titel-Regel wird erweitert: Der Titel muss **immer den allgemeinen Produkttyp** enthalten, mit dem Käufer suchen (z. B. „Spielzeugauto“, „Auto“, „Kinderspielzeug“), zusätzlich Marke, Modell, Variante/Farbe und Zustand.
- Reihenfolge: Marke + Modell + Produkttyp + Merkmal/Farbe + Zustand, 80 Zeichen ausnutzen statt kurz halten.
- Die Suchbegriffe müssen Synonyme und Oberbegriffe enthalten (Auto, Rennauto, Spielzeug, Kinder), damit sie auch für Kleinanzeigen/Vinted taugen.

## 3. Ladehinweis

- Text wird angepasst: kein „bis zu einer Minute“ mehr, sondern ein realistischer Hinweis, dass die Analyse etwas dauern kann und die Seite offen bleiben muss.
- Der Hinweis bekommt einen deckenden Hintergrund (Karte statt transparenter Fläche), damit er über dem darunterliegenden Text der Übersicht klar lesbar bleibt – gleiches gilt für die Verarbeitungs-Overlays in der Bildbearbeitung.

## 4. Android-App ohne eigenen Rechner

Ziel: APK aufs Handy, ohne Android Studio und ohne PC.

### APK wird in der Cloud gebaut
- Es wird ein automatischer Bauauftrag im Projekt hinterlegt (GitHub Actions). Der Bau läuft auf GitHubs Servern, nicht bei dir.
- Auslösen geht komplett vom Handy: In GitHub auf „Actions“ → „Android-App bauen“ → „Run workflow“. Nach wenigen Minuten liegt die fertige APK als Download bereit (zusätzlich als Release, damit der Download-Link direkt im Handy-Browser funktioniert).
- Die App-Seite „Assistent“ bekommt statt der Android-Studio-Anleitung eine Handy-Anleitung mit Direktlink zum Bau und zum letzten APK sowie den Hinweis, „Installation aus unbekannten Quellen“ einmalig zu erlauben.

Die Android-App nutzt dasselbe Ausfüll-Skript wie die Chrome-Erweiterung – es gibt weiterhin nur eine Stelle mit der Formular-Logik. Der letzte Klick auf „Angebot einstellen“ bleibt immer bei dir.


## Was unangetastet bleibt
Bildoptimierung inkl. Mehrfachauswahl, Galerie, Verkäuferprofil, Abschlusstext, Kontaktformular, Postfach, Löschfunktion, Chrome-Erweiterung am Rechner.

## Technische Details
- `src/lib/ki/prompts.ts`: `ANALYSE_PROMPT` v2 – neue Stufe „günstigster real verfügbarer Neupreis“, Set-/Stückpreis-Logik, Niedrigpreis-Deckel, neue Titel- und Suchbegriff-Regeln; neue JSON-Felder `neupreis_guenstigst`, `neupreis_guenstigst_quelle`.
- `src/lib/analyse.server.ts`: Typ erweitert, Denkstufe `high`, neue Normalisierung `preiseBegrenzen()` (Deckelung auf günstigsten Neupreis, Sortierung der Stufen).
- Migration: Spalten `neupreis_guenstigst`, `neupreis_guenstigst_quelle` in `artikel`.
- `src/routes/_authenticated/artikel.$artikelId.tsx`: Anzeige des günstigsten Neupreises in der Preisanalyse.
- `src/routes/_authenticated/neu.tsx`: Ladehinweis als deckende Karte, neuer Text.
- `src/components/BildGalerieDialog.tsx`: Overlay-Hintergrund deckend.
- `.github/workflows/android.yml` (neu): `bun install`, `bun run build`, `npx cap add android`, `npx cap sync`, `gradlew assembleDebug`, Upload als Artifact + Release.
- `extension/fuellen.js` bleibt Single Source für die Formular-Logik (Erweiterung und Android-App).
- `src/routes/_authenticated/assistent.tsx`: Android-Karte neu (Cloud-Bau-Anleitung, APK-Link).


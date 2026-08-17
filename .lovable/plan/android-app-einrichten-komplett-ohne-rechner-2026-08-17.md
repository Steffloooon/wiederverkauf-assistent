# Android-App einrichten – komplett ohne Rechner

## Warum aktuell nichts passiert

Der Knopf „Erweiterung herunterladen“ lädt eine **Chrome-Erweiterung** herunter. Erweiterungen gibt es nur im Chrome am Rechner – auf dem Handy nützt die Datei nichts, und der Download bricht dort still ab. Für das Handy ist die Android-App gedacht; deren Installationsdatei (APK) wird auf GitHubs Servern gebaut. Diese Bau-Anleitung steht bisher nur als Text weit unten und ohne anklickbare Links – deshalb wirkt es, als ginge es nicht.

## Änderungen an der Seite „Assistent“

1. **Handy zuerst**
   - Auf dem Handy steht die Karte „Android-App“ oben und ist direkt aufgeklappt.
   - Die Rechner-Karte (Erweiterung) rutscht nach unten und wird eingeklappt, mit dem Hinweis: „Nur für Chrome am Rechner – auf dem Handy nicht nötig.“

2. **Zwei echte Knöpfe statt Textanleitung**
   - „App bauen lassen“ – öffnet direkt den Bauauftrag auf GitHub (dort einmal „Run workflow“ tippen).
   - „Neueste App-Datei (APK)“ – öffnet direkt die Release-Seite, wo die fertige Datei liegt.
   - Beide Links entstehen aus einer einmalig eingegebenen GitHub-Projektadresse (z. B. `name/projekt`), die im Handy gespeichert bleibt. Solange sie fehlt, erscheint ein Eingabefeld mit Erklärung, wo man sie findet.

3. **Verständliche Kurzanleitung in 4 Schritten**
   - Bau starten → 5–10 Minuten warten → APK antippen → Installation aus unbekannten Quellen einmalig erlauben. Dazu ein Satz, dass die App danach immer automatisch die neueste Version dieser Web-App zeigt.
   - Ein Hinweis vorab: Das Projekt muss einmal mit GitHub verbunden sein, damit der Bauauftrag dort erscheint.

4. **Download-Knopf reparieren**
   - Der Erweiterungs-Download funktioniert am Rechner wieder zuverlässig (Link wird korrekt eingefügt, Adresse erst später freigegeben) und meldet Erfolg bzw. Fehler sichtbar. Am Handy erscheint statt eines stillen Abbruchs der Hinweis, dass hier die Android-App der richtige Weg ist.

## Was unangetastet bleibt

Ausfüll-Skript, Erweiterung selbst, Bauauftrag, Veröffentlichen-Ablauf, Preisanalyse, Bildbearbeitung und alle übrigen Funktionen.

## Technische Details

- `src/routes/_authenticated/assistent.tsx`: Reihenfolge der Karten abhängig von `useIsMobile()`; Android-Karte ohne Accordion (aufgeklappt), Erweiterungs-Karte im Accordion; `herunterladen()` mit `appendChild`/`remove`, verzögertem `revokeObjectURL`, Erfolgs-Toast und Mobil-Hinweis.
- Neuer kleiner Zustand `githubRepo` in `localStorage` (`assistent.github`), Eingabefeld + Validierung auf `owner/repo`; daraus `https://github.com/<repo>/actions/workflows/android.yml` und `https://github.com/<repo>/releases/latest`.
- `.github/workflows/android.yml` bleibt unverändert.

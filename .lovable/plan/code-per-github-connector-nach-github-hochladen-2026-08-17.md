# Code per GitHub-Connector nach GitHub hochladen

Ziel: Der komplette Projektcode – inklusive des Android-Build-Workflows unter `.github/workflows/android.yml` – landet in einem neuen GitHub-Repository, ohne dass du im Lovable-Interface klicken musst.

## Ablauf

1. **GitHub verbinden**
   Ich öffne die GitHub-Verbindungskarte im Chat. Du autorisierst dort einmal mit deinem GitHub-Konto (OAuth) oder trägst einen Personal Access Token mit `repo`- und `workflow`-Rechten ein. Ohne `workflow`-Recht darf der Build-Workflow nicht mitgeladen werden.

2. **Repository anlegen**
   Ich erstelle über die GitHub-API ein privates Repository (Vorschlag: `inserate-assistent`).

3. **Dateien hochladen**
   Alle 153 versionierten Dateien werden in einem einzigen Commit („Initial import aus Lovable“) auf den Standard-Branch geschrieben. Enthalten sind unter anderem:
   - kompletter `src/`-Code (Routen, KI-Logik, Marktplatz-Connectoren)
   - `extension/` (Browser-Assistent)
   - `supabase/` Migrationen
   - `.github/workflows/android.yml` (APK-Build)
   - Konfiguration: `package.json`, `bun.lock`, `capacitor.config.ts`, `vite.config.ts` usw.

   **Nicht hochgeladen:** `.env` mit den Backend-Zugangsdaten – Schlüssel gehören nicht in ein Repository. Die Build-Umgebung bekommt diese Werte separat.

4. **Ergebnis prüfen und melden**
   Ich prüfe, dass der Commit angekommen ist und der Workflow unter „Actions“ sichtbar ist, und schicke dir die Repository-URL.

## Danach: APK bauen

Auf GitHub unter **Actions → Android APK → Run workflow** starten. Nach dem Durchlauf liegt die APK als Artefakt zum Download bereit. Diesen Hinweis ergänze ich auf der Seite „Assistent“, damit du den Weg direkt in der App findest.

## Wichtige Einschränkung

Dieser Weg ist ein **einmaliger Upload**, keine laufende Synchronisierung. Späteren Änderungen in Lovable folgt das Repository nicht automatisch – ich müsste sie auf Wunsch erneut hochladen. Nur die Lovable-GitHub-Verbindung liefert dauerhafte Zwei-Wege-Synchronisierung.

## Technische Details

- Upload über die Git-Data-API: Blobs (base64 für Binärdateien wie `public/inserate-assistent.zip` und Bilder) → Tree → Commit → Ref-Update. So entsteht genau ein Commit statt 153 einzelner Schreibvorgänge.
- Aufrufe laufen über das Connector-Gateway (`connector-gateway.lovable.dev/github`), es werden keine Tokens im Code gespeichert.
- Dateiliste kommt aus `git ls-files`, damit `.gitignore` (node_modules, dist, Caches) respektiert wird; `.env` wird zusätzlich explizit ausgeschlossen.

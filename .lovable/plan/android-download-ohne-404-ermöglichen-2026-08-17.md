# Android-Download ohne 404 ermöglichen

## Bestätigte Ursache

Das Projekt ist aktuell **nicht mit GitHub verbunden**. Die vorhandene Datei für den Android-Bauauftrag (`.github/workflows/android.yml`) liegt nur im internen Lovable-Projekt und wurde nicht zu GitHub übertragen. Deshalb kann GitHub sie nicht finden und zeigt trotz erfolgreicher GitHub-Anmeldung eine 404-Seite.

Die Anmeldung bei GitHub oder eine andere Schreibweise der Adresse behebt das allein nicht.

## Einmal notwendiger Schritt

Das Lovable-Projekt muss über die **GitHub-Projektverknüpfung** einmal in ein GitHub-Repository übertragen werden. Danach liegt dort auch der Android-Bauauftrag und kann vollständig vom Handy aus gestartet werden. Ein Rechner oder Android Studio ist weiterhin nicht nötig.

## Änderungen an der Seite „Assistent“

1. **Falschen Bau-Link nicht mehr vorschnell anbieten**
   - Die Seite prüft zuerst, ob das angegebene GitHub-Projekt und der Android-Bauauftrag erreichbar sind.
   - „App bauen lassen“ wird erst aktiv, wenn beides wirklich vorhanden ist.

2. **Klare Meldungen statt GitHub-404**
   - Projekt nicht gefunden: „Dieses Projekt ist noch nicht mit GitHub verbunden oder die Adresse stimmt nicht.“
   - Projekt vorhanden, Bauauftrag fehlt: „Die Verbindung besteht, aber die neuesten Projektdateien wurden noch nicht übertragen.“
   - Alles vorhanden: „Bereit – du kannst die Android-App bauen lassen.“

3. **Einfacher Ablauf auf dem Handy**
   - Schritt 1: Projekt in Lovable mit GitHub verbinden.
   - Schritt 2: GitHub-Adresse in der App eintragen und prüfen.
   - Schritt 3: „App bauen lassen“ öffnen und auf „Run workflow“ tippen.
   - Schritt 4: Nach dem Bau die APK über „Neueste App-Datei“ herunterladen.

4. **Robuste GitHub-Ziele**
   - Primärer Knopf öffnet die Actions-Übersicht des bestätigten Projekts.
   - Separater Knopf öffnet anschließend den konkreten Android-Bauauftrag.
   - Die gespeicherte Adresse kann jederzeit sichtbar korrigiert werden.

## Was unangetastet bleibt

Android-Bauauftrag, Verkaufs-Assistent, Chrome-Erweiterung, Ausfüll-Skript, Preisanalyse, Bildbearbeitung und alle übrigen Funktionen.

## Technische Details

- Nur `src/routes/_authenticated/assistent.tsx` ändern.
- Öffentliche GitHub-Prüfung für Repository und `.github/workflows/android.yml`; private Projekte werden verständlich als „nicht öffentlich prüfbar“ behandelt und erhalten einen direkten Anmelde-/Projektlink.
- Kein Backend und keine Datenbankänderung.
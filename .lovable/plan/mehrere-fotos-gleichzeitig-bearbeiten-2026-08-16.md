# Mehrere Fotos gleichzeitig bearbeiten

Heute bearbeitet die Galerie immer nur das aktuell geöffnete Foto. Neu: du kannst direkt beim Öffnen der Galerie Fotos ankreuzen (z. B. 4 von 6) und diese Auswahl in einem Durchgang mit denselben Einstellungen bearbeiten. Die Einzelbearbeitung bleibt unverändert möglich.

## Was du sehen wirst

- In der Vorschauleiste unter dem großen Foto ist jedes Thumbnail direkt mit einem Haken (Checkbox oben links) auswählbar – ohne erst einen Modus einschalten zu müssen.
- Oben in der Leiste ein Kästchen **„Alle auswählen"** bzw. **„Auswahl aufheben"**.
- Der **„Bearbeiten"**-Button zeigt automatisch die Anzahl an: **„3 Fotos bearbeiten"**. Ohne Auswahl bleibt es **„Bearbeiten"** für das aktuell gezeigte Foto.
- Im Optimierungs-Dialog werden die ausgewählten Fotos als Vorschau angezeigt. Die dort gewählten Einstellungen gelten für alle ausgewählten Fotos. Wer einzelne davon abweichend einstellen will, nutzt weiterhin den Bereich „Einzelne Fotos abweichend einstellen".
- Fortschritt während der Bearbeitung (z. B. „Foto 2 von 3 …") und abschließende Erfolgsmeldung mit der Anzahl.
- Nach dem Speichern wird die Auswahl geleert und die Anzeige aktualisiert.

## Umsetzung (technisch)

Nur Frontend, keine Server- oder Datenbankänderung nötig.

- `src/components/BildGalerieDialog.tsx`
  - Neuer State: `auswahl: Set<string>` (Bild-IDs). Kein separater Auswahlmodus.
  - Vorschauleiste: Checkbox-Overlay (shadcn `Checkbox`) je Thumbnail, Klick auf das Kästchen toggelt die Auswahl; Klick auf das Bild selbst blättert weiterhin zum Foto.
  - Oben neben der Leiste: `Checkbox` „Alle auswählen" / „Auswahl aufheben".
  - `speichern(einstellungen)` baut `einzeln` aus allen ausgewählten `reihenfolge`-Werten. Abweichende Einzelwerte aus `einstellungen.einzeln` (Index = Position in der Vorschauliste) werden auf die passende `reihenfolge` gemappt. `global` bleibt `STANDARD_EINSTELLUNG`, damit nicht ausgewählte Fotos unangetastet bleiben.
  - `BildOptimierungDialog` bekommt `vorschau` = URLs der ausgewählten Fotos. Erscheint automatisch der Bereich „Einzelne Fotos abweichend einstellen", sobald mehr als ein Foto ausgewählt ist.
  - „Original" und „Herunterladen" bleiben auf dem aktuell angezeigten Foto (unverändert).
- `src/components/BildOptimierungDialog.tsx`: unverändert, nur die Beschreibung wird auf „Gilt für die ausgewählten Fotos" angepasst.
- Erstellungs-Workflow (`neu.tsx`) und `src/lib/bilder.server.ts` bleiben unverändert.

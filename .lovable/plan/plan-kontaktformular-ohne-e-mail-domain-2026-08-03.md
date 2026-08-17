# Plan: Kontaktformular ohne E-Mail-Domain

## Ziel
Das Kontaktformular soll funktionieren und Nachrichten dauerhaft in der Datenbank speichern – auch ohne eigene Absender-Domain. Sie bekommen eine einfache interne Übersicht, um eingehende Nachrichten zu lesen und zu löschen.

## Was passt bereits
- `src/routes/kontakt.tsx` ist vorhanden mit deutschem Formular, Pflichtfeld-Validierung, Honeypot und Erfolgsmeldung.
- `src/lib/kontakt.functions.ts` und `src/lib/kontakt.server.ts` speichern Nachrichten sicher serverseitig über `supabaseAdmin` (RLS-Bypass) mit Ratenbegrenzung.
- Tabelle `kontakt_nachrichten` existiert.

## Was noch fehlt
1. **Nachrichten-Postfach**: Es gibt noch keine Möglichkeit, gespeicherte Nachrichten anzuzeigen.
2. **Datenbank-Richtlinien**: Die Tabelle `kontakt_nachrichten` hat aktuell keine RLS-Policies. Lesen/Löschen durch den Eigentümer muss ermöglicht werden.
3. **Hydration-Fehler auf `/anmelden`**: Im Hintergrund ist ein Hydration-Mismatch aufgetreten, weil `useEffect` clientseitig eine Weiterleitung auslöst, während der Server die Seite statisch rendert. Das sollte behoben werden, damit die Anmeldung stabil läuft.

## Geplante Änderungen

### 1. Datenbank-Policies für `kontakt_nachrichten`
- `GRANT` für `authenticated` und `service_role`.
- `ENABLE ROW LEVEL SECURITY`.
- Policy: Eingeloggte Benutzer dürfen alle Nachrichten lesen und löschen (persönliche Einzelnutzung). Öffentliche Einfügungen laufen weiterhin ausschließlich über die serverseitige Funktion mit `supabaseAdmin`.

### 2. Nachrichten-Postfach
- Neue Datei `src/routes/_authenticated/nachrichten.tsx`.
- Listet alle Kontakt-Nachrichten mit Name, E-Mail, Betreff, Nachricht, Zeitpunkt und User-Agent.
- Ermöglicht einfaches Löschen einzelner Nachrichten.
- Verwendet den bestehenden `AppRahmen` und die deutsche UI-Sprache.
- Neue serverseitige Funktion `nachrichtenLesen` und `nachrichtLoeschen` in `src/lib/kontakt.functions.ts` (nur authentifiziert).

### 3. Navigation
- Link im Einstellungsbereich oder in der Navigation, um das Postfach zu erreichen.
- Optional: Badge mit Anzahl ungelesener Nachrichten (z.B. in der Navigation oder im Einstellungsbereich).

### 4. Hydration-Fehler auf `/anmelden` (optional mitabgedeckt)
- Route `src/routes/anmelden.tsx` mit `ssr: false` markieren, damit die clientseitige Session-Prüfung und Weiterleitung nicht gegen das Server-Rendering laufen.
- Alternativ: Weiterleitung aus `useEffect` entfernen und stattdessen einen sichtbaren Hinweis "Sie sind bereits angemeldet" anzeigen.

## Was absichtlich nicht gemacht wird
- Keine eigene E-Mail-Domain wird eingerichtet (auf Wunsch des Nutzers).
- Kein automatischer E-Mail-Versand an `info.stefflon@gmx.de`.
- Keine Marketing-E-Mails oder Newsletter-Funktion.

## Ergebnis
- Besucher können das Kontaktformular ausfüllen.
- Nachrichten werden sicher in der Datenbank gespeichert.
- Sie können Nachrichten über `/nachrichten` (nach Login) lesen und löschen.
- Die Anmeldeseite läuft ohne Hydration-Mismatch.

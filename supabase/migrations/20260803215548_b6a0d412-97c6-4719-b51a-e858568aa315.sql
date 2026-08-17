DROP POLICY IF EXISTS "Eigentümer kann Kontakt-Nachrichten löschen" ON public.kontakt_nachrichten;

CREATE POLICY "Eigentümer kann Kontakt-Nachrichten löschen"
ON public.kontakt_nachrichten
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);
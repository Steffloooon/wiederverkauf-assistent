ALTER TABLE public.kontakt_nachrichten ENABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON public.kontakt_nachrichten TO authenticated;
GRANT ALL ON public.kontakt_nachrichten TO service_role;

CREATE POLICY "Eigentümer kann Kontakt-Nachrichten lesen"
ON public.kontakt_nachrichten
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Eigentümer kann Kontakt-Nachrichten löschen"
ON public.kontakt_nachrichten
FOR DELETE
TO authenticated
USING (true);
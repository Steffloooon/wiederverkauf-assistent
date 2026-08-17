CREATE TABLE public.uebergabe_token (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  artikel_id uuid NOT NULL REFERENCES public.artikel(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marktplatz text NOT NULL,
  gueltig_bis timestamp with time zone NOT NULL,
  verwendet_am timestamp with time zone,
  widerrufen boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.uebergabe_token TO authenticated;
GRANT ALL ON public.uebergabe_token TO service_role;

ALTER TABLE public.uebergabe_token ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uebergabe_eigene_lesen" ON public.uebergabe_token
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "uebergabe_eigene_loeschen" ON public.uebergabe_token
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX uebergabe_token_artikel_idx ON public.uebergabe_token (artikel_id);
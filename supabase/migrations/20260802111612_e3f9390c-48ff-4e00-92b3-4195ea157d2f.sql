-- 1. Veröffentlichungen getrennt vom Artikel
CREATE TABLE public.artikel_veroeffentlichungen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artikel_id uuid NOT NULL REFERENCES public.artikel(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marktplatz text NOT NULL,
  externe_id text,
  url text,
  status text NOT NULL DEFAULT 'veroeffentlicht',
  fehler text,
  plattform_daten jsonb NOT NULL DEFAULT '{}'::jsonb,
  veroeffentlicht_am timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (artikel_id, marktplatz)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel_veroeffentlichungen TO authenticated;
GRANT ALL ON public.artikel_veroeffentlichungen TO service_role;

ALTER TABLE public.artikel_veroeffentlichungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "veroeffentlichungen_eigene"
ON public.artikel_veroeffentlichungen FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER veroeffentlichungen_updated_at
BEFORE UPDATE ON public.artikel_veroeffentlichungen
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX artikel_veroeffentlichungen_artikel_idx
ON public.artikel_veroeffentlichungen (artikel_id);

-- Bestehende eBay-Daten übernehmen
INSERT INTO public.artikel_veroeffentlichungen
  (artikel_id, user_id, marktplatz, externe_id, url, status, veroeffentlicht_am)
SELECT a.id, a.user_id, 'ebay', a.ebay_angebot_id, a.ebay_url, 'veroeffentlicht', a.veroeffentlicht_am
FROM public.artikel a
WHERE a.ebay_angebot_id IS NOT NULL
ON CONFLICT (artikel_id, marktplatz) DO NOTHING;

-- 2. Nutzungserfassung (Vorbereitung Abo, noch ohne Limit)
CREATE TABLE public.nutzung_ereignisse (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  art text NOT NULL,
  artikel_id uuid REFERENCES public.artikel(id) ON DELETE SET NULL,
  menge integer NOT NULL DEFAULT 1,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nutzung_ereignisse TO authenticated;
GRANT ALL ON public.nutzung_ereignisse TO service_role;

ALTER TABLE public.nutzung_ereignisse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutzung_eigene_lesen"
ON public.nutzung_ereignisse FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX nutzung_ereignisse_user_art_idx
ON public.nutzung_ereignisse (user_id, art, created_at DESC);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tarif text NOT NULL DEFAULT 'frei';

CREATE OR REPLACE FUNCTION public.nutzung_anzahl(_user_id uuid, _art text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(menge), 0)::integer
  FROM public.nutzung_ereignisse
  WHERE user_id = _user_id AND art = _art;
$$;

-- 3. Aufräumen beim Löschen zentral in der Datenbank
ALTER TABLE public.artikel_bilder
  DROP CONSTRAINT IF EXISTS artikel_bilder_artikel_id_fkey,
  ADD CONSTRAINT artikel_bilder_artikel_id_fkey
    FOREIGN KEY (artikel_id) REFERENCES public.artikel(id) ON DELETE CASCADE;

ALTER TABLE public.artikel_feedback
  DROP CONSTRAINT IF EXISTS artikel_feedback_artikel_id_fkey,
  ADD CONSTRAINT artikel_feedback_artikel_id_fkey
    FOREIGN KEY (artikel_id) REFERENCES public.artikel(id) ON DELETE CASCADE;

ALTER TABLE public.verkaufsverlauf
  DROP CONSTRAINT IF EXISTS verkaufsverlauf_artikel_id_fkey,
  ADD CONSTRAINT verkaufsverlauf_artikel_id_fkey
    FOREIGN KEY (artikel_id) REFERENCES public.artikel(id) ON DELETE SET NULL;
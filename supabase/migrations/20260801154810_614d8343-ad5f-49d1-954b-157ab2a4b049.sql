ALTER TABLE public.artikel_bilder
  ADD COLUMN IF NOT EXISTS typ text NOT NULL DEFAULT 'produkt',
  ADD COLUMN IF NOT EXISTS pfad_original text,
  ADD COLUMN IF NOT EXISTS optimierung jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.artikel_bilder
  ADD CONSTRAINT artikel_bilder_typ_check CHECK (typ IN ('produkt', 'erkennung'));

ALTER TABLE public.artikel
  ADD COLUMN IF NOT EXISTS preis_vertrauen text,
  ADD COLUMN IF NOT EXISTS preis_erklaerungen jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS erkannte_daten jsonb NOT NULL DEFAULT '{}'::jsonb;
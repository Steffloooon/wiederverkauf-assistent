-- Enums
CREATE TYPE public.artikel_status AS ENUM ('entwurf', 'analysiert', 'veroeffentlicht', 'verkauft');
CREATE TYPE public.artikel_zustand AS ENUM ('neu', 'neu_sonstige', 'wie_neu', 'sehr_gut', 'gut', 'akzeptabel', 'defekt');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profile
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anzeigename TEXT,
  firmenname TEXT,
  standard_versand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profil_eigenes" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, anzeigename)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'anzeigename', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Artikel
CREATE TABLE public.artikel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.artikel_status NOT NULL DEFAULT 'entwurf',
  zustand public.artikel_zustand,
  marke TEXT,
  modell TEXT,
  maengel TEXT,
  details TEXT,
  zubehoer TEXT,
  originalverpackung BOOLEAN NOT NULL DEFAULT false,
  notizen TEXT,
  ist_neu BOOLEAN NOT NULL DEFAULT false,
  titel TEXT,
  beschreibung TEXT,
  zustandsbeschreibung TEXT,
  suchbegriffe TEXT[] NOT NULL DEFAULT '{}',
  kategorie TEXT,
  ebay_kategorie_id TEXT,
  technische_daten JSONB NOT NULL DEFAULT '{}'::jsonb,
  versandempfehlung TEXT,
  fehlende_angaben TEXT[] NOT NULL DEFAULT '{}',
  preis_empfehlung NUMERIC(10,2),
  preis_start NUMERIC(10,2),
  preis_schnell NUMERIC(10,2),
  preis_maximum NUMERIC(10,2),
  preis_begruendung TEXT,
  verkaufsgeschwindigkeit TEXT,
  marktanalyse JSONB NOT NULL DEFAULT '{}'::jsonb,
  ebay_angebot_id TEXT,
  ebay_url TEXT,
  veroeffentlicht_am TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel TO authenticated;
GRANT ALL ON public.artikel TO service_role;
ALTER TABLE public.artikel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artikel_eigene" ON public.artikel FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER artikel_updated BEFORE UPDATE ON public.artikel
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX artikel_user_idx ON public.artikel (user_id, created_at DESC);

-- Bilder
CREATE TABLE public.artikel_bilder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id UUID NOT NULL REFERENCES public.artikel(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pfad TEXT NOT NULL,
  reihenfolge INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel_bilder TO authenticated;
GRANT ALL ON public.artikel_bilder TO service_role;
ALTER TABLE public.artikel_bilder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bilder_eigene" ON public.artikel_bilder FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX artikel_bilder_idx ON public.artikel_bilder (artikel_id, reihenfolge);

-- KI-Regeln
CREATE TABLE public.ki_regeln (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regel TEXT NOT NULL,
  bereich TEXT NOT NULL DEFAULT 'allgemein',
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ki_regeln TO authenticated;
GRANT ALL ON public.ki_regeln TO service_role;
ALTER TABLE public.ki_regeln ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regeln_eigene" ON public.ki_regeln FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Feedback
CREATE TABLE public.artikel_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id UUID NOT NULL REFERENCES public.artikel(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel_feedback TO authenticated;
GRANT ALL ON public.artikel_feedback TO service_role;
ALTER TABLE public.artikel_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_eigenes" ON public.artikel_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Verkaufsverlauf (Preis-Lernfunktion)
CREATE TABLE public.verkaufsverlauf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id UUID REFERENCES public.artikel(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verkaufspreis NUMERIC(10,2),
  tage_bis_verkauf INTEGER,
  preis_gesenkt BOOLEAN NOT NULL DEFAULT false,
  anfragen INTEGER NOT NULL DEFAULT 0,
  einschaetzung TEXT,
  notiz TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verkaufsverlauf TO authenticated;
GRANT ALL ON public.verkaufsverlauf TO service_role;
ALTER TABLE public.verkaufsverlauf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verlauf_eigener" ON public.verkaufsverlauf FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Marktplatz-Verbindungen (modular)
CREATE TABLE public.marktplatz_verbindungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marktplatz TEXT NOT NULL,
  konto_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  gueltig_bis TIMESTAMPTZ,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, marktplatz)
);
-- Tokens werden ausschliesslich serverseitig gelesen/geschrieben
GRANT ALL ON public.marktplatz_verbindungen TO service_role;
ALTER TABLE public.marktplatz_verbindungen ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER marktplatz_updated BEFORE UPDATE ON public.marktplatz_verbindungen
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
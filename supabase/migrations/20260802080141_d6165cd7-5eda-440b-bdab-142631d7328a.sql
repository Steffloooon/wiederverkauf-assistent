CREATE TYPE public.verkaeufer_status AS ENUM ('privat', 'kleinunternehmer', 'gewerblich');

ALTER TABLE public.profiles
  ADD COLUMN land text NOT NULL DEFAULT 'Deutschland',
  ADD COLUMN verkaeufer_status public.verkaeufer_status NOT NULL DEFAULT 'privat',
  ADD COLUMN abschlusstext text;

ALTER TABLE public.artikel
  ADD COLUMN abschlusstext text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, anzeigename, land, verkaeufer_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'anzeigename', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'land', ''), 'Deutschland'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'verkaeufer_status', ''), 'privat')::public.verkaeufer_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
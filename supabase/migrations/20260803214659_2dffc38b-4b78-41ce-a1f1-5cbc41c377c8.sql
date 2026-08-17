CREATE TABLE public.kontakt_nachrichten (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  betreff TEXT NOT NULL,
  nachricht TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.kontakt_nachrichten TO service_role;
ALTER TABLE public.kontakt_nachrichten ENABLE ROW LEVEL SECURITY;
CREATE INDEX kontakt_nachrichten_ip_idx ON public.kontakt_nachrichten (ip_hash, created_at DESC);
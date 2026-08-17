REVOKE ALL ON FUNCTION public.nutzung_anzahl(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nutzung_anzahl(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.nutzung_anzahl(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.nutzung_anzahl(uuid, text) TO service_role;
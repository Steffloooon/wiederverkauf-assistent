import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSitzung() {
  const [sitzung, setSitzung] = useState<Session | null>(null);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSitzung(data.session);
      setLaedt(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ereignis, neueSitzung) => {
      setSitzung(neueSitzung);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { sitzung, laedt, benutzer: sitzung?.user ?? null };
}

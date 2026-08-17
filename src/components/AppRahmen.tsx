import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutGrid, PlusCircle, Settings, LogOut, Mail, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVIGATION = [
  { pfad: "/start", label: "Übersicht", icon: LayoutGrid },
  { pfad: "/neu", label: "Neuer Artikel", icon: PlusCircle },
  { pfad: "/assistent", label: "Assistent", icon: Wand2 },
  { pfad: "/nachrichten", label: "Nachrichten", icon: Mail },
  { pfad: "/einstellungen", label: "Einstellungen", icon: Settings },

] as const;

export function AppRahmen({
  titel,
  untertitel,
  aktion,
  children,
}: {
  titel: string;
  untertitel?: string;
  aktion?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pfad = useRouterState({ select: (s) => s.location.pathname });

  const abmelden = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/anmelden", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/start" className="font-display text-base font-bold tracking-tight">
            Wiederverkauf<span className="text-primary">-Assistent</span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 md:flex">
              {NAVIGATION.map((eintrag) => (
                <Link
                  key={eintrag.pfad}
                  to={eintrag.pfad}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    pfad === eintrag.pfad && "bg-secondary text-secondary-foreground",
                  )}
                >
                  {eintrag.label}
                </Link>
              ))}
            </nav>
            <Button variant="ghost" size="sm" onClick={abmelden} aria-label="Abmelden">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {titel}
            </h1>
            {untertitel ? (
              <p className="mt-1 text-sm text-muted-foreground">{untertitel}</p>
            ) : null}
          </div>
          {aktion}
        </div>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background md:hidden">
        <div className="flex">
          {NAVIGATION.map((eintrag) => {
            const Icon = eintrag.icon;
            const aktiv = pfad === eintrag.pfad;
            return (
              <Link
                key={eintrag.pfad}
                to={eintrag.pfad}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground",
                  aktiv && "text-primary",
                )}
              >
                <Icon className="size-5" />
                {eintrag.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { artikelLoeschen } from "@/lib/artikel.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppRahmen } from "@/components/AppRahmen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, PackageSearch, Trash2 } from "lucide-react";
import { STATUS_LABEL, euro, datumKurz, zustandLabel } from "@/lib/anzeige";


export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({
    meta: [
      { title: "Übersicht – Wiederverkauf-Assistent" },
      { name: "description", content: "Alle Artikel, Entwürfe und Veröffentlichungen auf einen Blick." },
      { property: "og:title", content: "Übersicht – Wiederverkauf-Assistent" },
      { property: "og:description", content: "Deine Artikel, Preise und Veröffentlichungen." },
    ],
  }),
  component: StartSeite,
});

function StatusFarbe(status: string) {
  if (status === "veroeffentlicht") return "default" as const;
  if (status === "verkauft") return "secondary" as const;
  if (status === "analysiert") return "outline" as const;
  return "outline" as const;
}

function StartSeite() {
  const queryClient = useQueryClient();
  const entferneArtikel = useServerFn(artikelLoeschen);
  const [loeschZiel, setLoeschZiel] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["artikel-liste"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artikel")
        .select("id, titel, marke, modell, status, zustand, preis_empfehlung, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error("Die Artikel konnten nicht geladen werden.");
      return data;
    },
  });

  const loeschen = useMutation({
    mutationFn: async (artikelId: string) => {
      await entferneArtikel({ data: { artikelId } });
    },
    onSuccess: () => {
      toast.success("Artikel gelöscht.");
      setLoeschZiel(null);
      queryClient.invalidateQueries({ queryKey: ["artikel-liste"] });
    },
    onError: (fehler: Error) => toast.error(fehler.message),
  });


  return (
    <AppRahmen
      titel="Übersicht"
      untertitel="Deine Artikel, Entwürfe und Veröffentlichungen."
      aktion={
        <Button asChild>
          <Link to="/neu">
            <PlusCircle className="mr-2 size-4" />
            Neuer Artikel
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <PackageSearch className="size-10 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Noch keine Artikel angelegt</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Lade Fotos hoch, ergänze ein paar Angaben – die KI erstellt Titel, Beschreibung und
              eine nachvollziehbare Preisempfehlung.
            </p>
            <Button asChild className="mt-2">
              <Link to="/neu">Ersten Artikel anlegen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {data.map((artikel) => {
            const name =
              artikel.titel ||
              [artikel.marke, artikel.modell].filter(Boolean).join(" ") ||
              "Unbenannter Entwurf";
            return (
              <li key={artikel.id} className="relative">
                <Link
                  to="/artikel/$artikelId"
                  params={{ artikelId: artikel.id }}
                  className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 pr-10">
                      <p className="truncate font-medium text-card-foreground">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {zustandLabel(artikel.zustand)} · angelegt am {datumKurz(artikel.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={StatusFarbe(artikel.status)}>
                        {STATUS_LABEL[artikel.status] ?? artikel.status}
                      </Badge>
                      <p className="mt-1 font-display text-base font-semibold">
                        {euro(artikel.preis_empfehlung)}
                      </p>
                    </div>
                  </div>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${name} löschen`}
                  className="absolute right-2 top-2 size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setLoeschZiel({ id: artikel.id, name })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={loeschZiel !== null}
        onOpenChange={(offen) => {
          if (!offen && !loeschen.isPending) setLoeschZiel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{loeschZiel?.name}“ wird mit allen Fotos, Feedback-Einträgen und Verlaufsdaten
              endgültig gelöscht. Das kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loeschen.isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={loeschen.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (loeschZiel) loeschen.mutate(loeschZiel.id);
              }}
            >
              {loeschen.isPending ? "Löschen …" : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppRahmen>
  );
}


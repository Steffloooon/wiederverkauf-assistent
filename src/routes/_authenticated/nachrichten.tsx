import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppRahmen } from "@/components/AppRahmen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Mail, Trash2, ArrowLeft } from "lucide-react";
import { nachrichtenLesen, nachrichtLoeschen } from "@/lib/kontakt.functions";

export const Route = createFileRoute("/_authenticated/nachrichten")({
  head: () => ({
    meta: [
      { title: "Nachrichten – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Eingehende Kontaktanfragen und Rückmeldungen im Überblick.",
      },
      { property: "og:title", content: "Nachrichten – Wiederverkauf-Assistent" },
      {
        property: "og:description",
        content: "Eingehende Kontaktanfragen und Rückmeldungen.",
      },
    ],
  }),
  component: NachrichtenSeite,
});

function datumFormatieren(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NachrichtenSeite() {
  const queryClient = useQueryClient();
  const ladeNachrichten = useServerFn(nachrichtenLesen);
  const loescheNachricht = useServerFn(nachrichtLoeschen);
  const [loeschZiel, setLoeschZiel] = useState<{ id: string; betreff: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["kontakt-nachrichten"],
    queryFn: () => ladeNachrichten({ data: undefined }),
  });

  const loeschen = useMutation({
    mutationFn: async (id: string) => {
      await loescheNachricht({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Nachricht gelöscht.");
      setLoeschZiel(null);
      queryClient.invalidateQueries({ queryKey: ["kontakt-nachrichten"] });
    },
    onError: (fehler: Error) => toast.error(fehler.message),
  });

  const nachrichten = data?.nachrichten ?? [];

  return (
    <AppRahmen
      titel="Nachrichten"
      untertitel="Eingehende Kontaktanfragen und Rückmeldungen."
      aktion={
        <Button variant="outline" size="sm" asChild>
          <Link to="/einstellungen">
            <ArrowLeft className="mr-2 size-4" />
            Zurück zu Einstellungen
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-destructive">
              Die Nachrichten konnten nicht geladen werden. Bitte versuchen Sie es erneut.
            </p>
          </CardContent>
        </Card>
      ) : nachrichten.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Mail className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Nachrichten vorhanden. Sobald Besucher das Kontaktformular nutzen,
              erscheinen sie hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {nachrichten.length} {nachrichten.length === 1 ? "Nachricht" : "Nachrichten"} vorhanden
            </p>
            <Badge variant="outline" className="text-xs">
              E-Mail-Versand ist deaktiviert
            </Badge>
          </div>

          {nachrichten.map((nachricht) => (
            <Card key={nachricht.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{nachricht.betreff}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Von {nachricht.name} · {nachricht.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setLoeschZiel({ id: nachricht.id, betreff: nachricht.betreff })
                    }
                    aria-label="Nachricht löschen"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {nachricht.nachricht}
                </p>
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  <p>Eingegangen: {datumFormatieren(nachricht.created_at)}</p>
                  {nachricht.user_agent ? <p className="mt-1">Browser: {nachricht.user_agent}</p> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!loeschZiel} onOpenChange={() => setLoeschZiel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nachricht löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Nachricht „{loeschZiel?.betreff}" wirklich dauerhaft löschen? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoeschZiel(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => loeschZiel && loeschen.mutate(loeschZiel.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppRahmen>
  );
}

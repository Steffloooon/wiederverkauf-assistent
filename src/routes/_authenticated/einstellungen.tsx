import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  marktplatzAuthLink,
  marktplatzTrennen,
  marktplatzUebersicht,
} from "@/lib/marktplatz.functions";
import { abschlusstextVorschlag } from "@/lib/profil.functions";
import { LAENDER, VERKAEUFER_STATUS, type VerkaeuferStatus } from "@/lib/verkaeufer";
import { AppRahmen } from "@/components/AppRahmen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card as InfoCard } from "@/components/ui/card";
import { Loader2, Plug, Trash2, Save, Sparkles } from "lucide-react";
import { BEREICH_LABEL } from "@/lib/anzeige";

/**
 * Marktplätze bleiben technisch vollständig erhalten (Adapter, OAuth, Veröffentlichung).
 * Der Bereich ist aktuell nur in der Oberfläche ausgeblendet.
 */
const MARKTPLAETZE_SICHTBAR = false;

export const Route = createFileRoute("/_authenticated/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Verkäuferprofil, Standard-Abschlusstext, KI-Regeln und Datenschutz verwalten.",
      },
      { property: "og:title", content: "Einstellungen – Wiederverkauf-Assistent" },
      {
        property: "og:description",
        content: "Verkäuferprofil, Standard-Abschlusstext und persönliche KI-Regeln.",
      },
    ],
  }),
  component: EinstellungenSeite,
});

function EinstellungenSeite() {
  const queryClient = useQueryClient();
  const authLink = useServerFn(marktplatzAuthLink);
  const trennen = useServerFn(marktplatzTrennen);
  const vorschlagHolen = useServerFn(abschlusstextVorschlag);
  const [arbeitet, setArbeitet] = useState<string | null>(null);
  const [neueRegel, setNeueRegel] = useState("");

  const { data: profil } = useQuery({
    queryKey: ["profil"],
    queryFn: async () => {
      const { data: benutzer } = await supabase.auth.getUser();
      if (!benutzer.user) throw new Error("Nicht angemeldet.");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", benutzer.user.id)
        .maybeSingle();
      return { profil: data, email: benutzer.user.email ?? "" };
    },
  });

  const [entwurf, setEntwurf] = useState<{
    anzeigename: string;
    land: string;
    verkaeufer_status: VerkaeuferStatus;
  } | null>(null);

  const werte = entwurf ?? {
    anzeigename: profil?.profil?.anzeigename ?? "",
    land: profil?.profil?.land ?? "Deutschland",
    verkaeufer_status: (profil?.profil?.verkaeufer_status ?? "privat") as VerkaeuferStatus,
  };

  const [abschluss, setAbschluss] = useState<string | null>(null);
  const abschlussWert = abschluss ?? profil?.profil?.abschlusstext ?? "";

  const { data: regeln } = useQuery({
    queryKey: ["ki-regeln"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ki_regeln")
        .select("id, regel, bereich, aktiv")
        .eq("aktiv", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: marktplaetze } = useQuery({
    queryKey: ["marktplaetze"],
    queryFn: () => marktplatzUebersicht(),
    enabled: MARKTPLAETZE_SICHTBAR,
  });

  const profilSpeichern = async () => {
    const { data: benutzer } = await supabase.auth.getUser();
    if (!benutzer.user) return;
    setArbeitet("profil");
    const { error } = await supabase.from("profiles").upsert({
      id: benutzer.user.id,
      anzeigename: werte.anzeigename.trim() || null,
      land: werte.land,
      verkaeufer_status: werte.verkaeufer_status,
    });
    setArbeitet(null);
    if (error) {
      toast.error("Das Verkäuferprofil konnte nicht gespeichert werden.");
      return;
    }
    setEntwurf(null);
    await queryClient.invalidateQueries({ queryKey: ["profil"] });
    toast.success("Verkäuferprofil gespeichert.");
  };

  const abschlussSpeichern = async () => {
    const { data: benutzer } = await supabase.auth.getUser();
    if (!benutzer.user) return;
    if (abschlussWert.length > 1500) {
      toast.error("Der Abschlusstext darf maximal 1500 Zeichen lang sein.");
      return;
    }
    setArbeitet("abschluss");
    const { error } = await supabase.from("profiles").upsert({
      id: benutzer.user.id,
      abschlusstext: abschlussWert.trim() || null,
    });
    setArbeitet(null);
    if (error) {
      toast.error("Der Abschlusstext konnte nicht gespeichert werden.");
      return;
    }
    setAbschluss(null);
    await queryClient.invalidateQueries({ queryKey: ["profil"] });
    toast.success("Standard-Abschlusstext gespeichert.");
  };

  const vorschlagErstellen = async () => {
    setArbeitet("vorschlag");
    try {
      const ergebnis = await vorschlagHolen();
      setAbschluss(ergebnis.text);
      toast.success("Vorschlag eingefügt – du kannst ihn frei anpassen.");
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Der Vorschlag konnte nicht erstellt werden.",
      );
    } finally {
      setArbeitet(null);
    }
  };

  const regelHinzufuegen = async () => {
    const text = neueRegel.trim();
    if (text.length < 3) {
      toast.error("Bitte formuliere die Regel etwas ausführlicher.");
      return;
    }
    if (text.length > 200) {
      toast.error("Die Regel darf maximal 200 Zeichen lang sein.");
      return;
    }
    const { data: benutzer } = await supabase.auth.getUser();
    if (!benutzer.user) return;
    setArbeitet("regel");
    const { error } = await supabase
      .from("ki_regeln")
      .insert({ user_id: benutzer.user.id, regel: text, bereich: "allgemein" });
    setArbeitet(null);
    if (error) {
      toast.error("Die Regel konnte nicht gespeichert werden.");
      return;
    }
    setNeueRegel("");
    await queryClient.invalidateQueries({ queryKey: ["ki-regeln"] });
    toast.success("Regel gespeichert.");
  };

  const regelLoeschen = async (id: string) => {
    await supabase.from("ki_regeln").update({ aktiv: false }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["ki-regeln"] });
    toast.success("Regel entfernt.");
  };

  const verbinden = async (marktplatz: string) => {
    setArbeitet(marktplatz);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("marktplatz_state", state);
      const { url } = await authLink({ data: { marktplatz, state } });
      window.location.href = url;
    } catch (fehler) {
      setArbeitet(null);
      toast.error(
        fehler instanceof Error ? fehler.message : "Die Verbindung konnte nicht gestartet werden.",
      );
    }
  };

  const verbindungTrennen = async (marktplatz: string) => {
    setArbeitet(marktplatz);
    await trennen({ data: { marktplatz } });
    setArbeitet(null);
    await queryClient.invalidateQueries({ queryKey: ["marktplaetze"] });
    toast.success("Verbindung getrennt.");
  };

  return (
    <AppRahmen
      titel="Einstellungen"
      untertitel="Verkäuferprofil, Standard-Abschlusstext und KI-Regeln."
    >
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="land">Land</Label>
                <Select
                  value={werte.land}
                  onValueChange={(wert) => setEntwurf({ ...werte, land: wert })}
                >
                  <SelectTrigger id="land">
                    <SelectValue placeholder="Land wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAENDER.map((eintrag) => (
                      <SelectItem key={eintrag} value={eintrag}>
                        {eintrag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Verkäuferstatus</Label>
                <Select
                  value={werte.verkaeufer_status}
                  onValueChange={(wert) =>
                    setEntwurf({ ...werte, verkaeufer_status: wert as VerkaeuferStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERKAEUFER_STATUS.map((eintrag) => (
                      <SelectItem key={eintrag.wert} value={eintrag.wert}>
                        {eintrag.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anzeigename">Verkäufername (öffentlich sichtbar)</Label>
              <Input
                id="anzeigename"
                maxLength={120}
                value={werte.anzeigename}
                onChange={(e) => setEntwurf({ ...werte, anzeigename: e.target.value })}
                placeholder="z. B. Sandra oder Sandras Fundstücke"
              />
            </div>
            <div className="space-y-2">
              <Label>Angemeldete E-Mail-Adresse</Label>
              <Input value={profil?.email ?? ""} readOnly disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Land und Verkäuferstatus nutzt die KI automatisch für Verkaufstexte, Formulierungen
              und Hinweise. Änderungen gelten sofort für alle neuen Anzeigen.
            </p>
            <Button onClick={profilSpeichern} disabled={arbeitet !== null}>
              {arbeitet === "profil" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Profil speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standard-Abschlusstext</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dieser Text wird automatisch am Ende jeder neu erstellten Anzeige eingefügt. In einer
              einzelnen Anzeige kannst du ihn jederzeit nur dort anpassen.
            </p>
            <Textarea
              rows={8}
              maxLength={1500}
              value={abschlussWert}
              onChange={(e) => setAbschluss(e.target.value)}
              placeholder="z. B. Hinweise zu Versand, Zahlung, Rückgabe oder Widerrufsrecht"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={abschlussSpeichern} disabled={arbeitet !== null}>
                {arbeitet === "abschluss" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Speichern
              </Button>
              <Button variant="outline" onClick={vorschlagErstellen} disabled={arbeitet !== null}>
                {arbeitet === "vorschlag" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                KI-Vorschlag erstellen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Der KI-Vorschlag richtet sich nach Verkäuferstatus, Land und üblichen Anforderungen.
              Er ist ein praxisnaher Entwurf und keine Rechtsberatung – bitte vor dem
              Veröffentlichen selbst prüfen.
            </p>
          </CardContent>
        </Card>

        {MARKTPLAETZE_SICHTBAR ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marktplätze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(marktplaetze ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {m.name}{" "}
                      {m.verbunden ? (
                        <Badge className="ml-1">Verbunden</Badge>
                      ) : m.verfuegbar ? (
                        <Badge variant="outline" className="ml-1">
                          Nicht verbunden
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-1">
                          Geplant
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.verfuegbar && !m.konfiguriert
                        ? "Es sind noch keine API-Zugangsdaten hinterlegt."
                        : m.beschreibung}
                    </p>
                  </div>
                  {m.verfuegbar ? (
                    m.verbunden ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verbindungTrennen(m.id)}
                        disabled={arbeitet !== null}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Trennen
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => verbinden(m.id)}
                        disabled={arbeitet !== null || !m.konfiguriert}
                      >
                        {arbeitet === m.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Plug className="mr-2 size-4" />
                        )}
                        Konto verbinden
                      </Button>
                    )
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persönliche KI-Regeln</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Diese Regeln wendet die KI bei jedem neuen Inserat an. Neue Regeln entstehen auch
              automatisch aus deinem Feedback zu einzelnen Artikeln.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                rows={2}
                maxLength={200}
                value={neueRegel}
                onChange={(e) => setNeueRegel(e.target.value)}
                placeholder="z. B. Beschreibung immer mit Hinweis auf Versand per DHL beenden"
              />
              <Button onClick={regelHinzufuegen} disabled={arbeitet !== null}>
                {arbeitet === "regel" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Hinzufügen
              </Button>
            </div>
            {regeln && regeln.length > 0 ? (
              <ul className="space-y-2">
                {regeln.map((regel) => (
                  <li
                    key={regel.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {BEREICH_LABEL[regel.bereich] ?? regel.bereich}
                      </Badge>
                      <p className="text-sm">{regel.regel}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Regel entfernen"
                      onClick={() => regelLoeschen(regel.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Regeln hinterlegt.</p>
            )}
          </CardContent>
        </Card>

        <InfoCard>
          <CardHeader>
            <CardTitle className="text-base">Datenschutz &amp; rechtliche Hinweise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Deine Artikel, Fotos und Regeln sind ausschließlich deinem Konto zugeordnet. Fotos
              liegen in einem privaten Speicher und werden nur über kurzfristig gültige Links
              geladen. Für die Textgenerierung und Preisanalyse werden Angaben und Fotos an einen
              KI-Dienst übermittelt (Auftragsverarbeitung, Art. 28 DSGVO).
            </p>
            <p>
              Je nach Verkäuferstatus gelten unterschiedliche Pflichten: Privatverkäufer verkaufen
              ohne Händlerpflichten, Kleinunternehmer und gewerbliche Verkäufer brauchen unter
              anderem Impressum, Widerrufsbelehrung und Angaben zur Gewährleistung. Prüfe diese
              Angaben in deinem Verkäuferkonto.
            </p>
            <div className="flex gap-3">
              <Link to="/datenschutz" className="text-primary underline">
                Datenschutzerklärung
              </Link>
              <Link to="/impressum" className="text-primary underline">
                Impressum
              </Link>
            </div>
          </CardContent>
        </InfoCard>
      </div>
    </AppRahmen>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LAENDER, VERKAEUFER_STATUS, type VerkaeuferStatus } from "@/lib/verkaeufer";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/anmelden")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Anmelden – Wiederverkauf-Assistent" },
      {
        name: "description",
        content: "Melde dich an, um Inserate zu erstellen, Preise zu analysieren und zu veröffentlichen.",
      },
      { property: "og:title", content: "Anmelden – Wiederverkauf-Assistent" },
      {
        property: "og:description",
        content: "Zugang zu deinem persönlichen KI-Assistenten für Wiederverkauf.",
      },
    ],
  }),
  component: AnmeldeSeite,
});

function AnmeldeSeite() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [land, setLand] = useState<string>("Deutschland");
  const [status, setStatus] = useState<VerkaeuferStatus | "">("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/start", replace: true });
    });
  }, [navigate]);

  const anmelden = async (event: React.FormEvent) => {
    event.preventDefault();
    setLaedt(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
    setLaedt(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "E-Mail-Adresse oder Passwort ist nicht korrekt."
          : "Die Anmeldung hat nicht funktioniert. Bitte versuche es erneut.",
      );
      return;
    }
    toast.success("Willkommen zurück!");
    navigate({ to: "/start", replace: true });
  };

  const registrieren = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwort.length < 8) {
      toast.error("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (!land) {
      toast.error("Bitte wähle dein Land aus.");
      return;
    }
    if (!status) {
      toast.error("Bitte wähle deinen Verkäuferstatus aus.");
      return;
    }
    setLaedt(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwort,
      options: {
        emailRedirectTo: window.location.origin,
        data: { land, verkaeufer_status: status },
      },
    });
    setLaedt(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an."
          : "Die Registrierung hat nicht funktioniert. Bitte versuche es erneut.",
      );
      return;
    }
    if (data.session) {
      navigate({ to: "/start", replace: true });
      return;
    }
    setHinweis(
      "Fast fertig: Wir haben dir eine E-Mail geschickt. Bitte bestätige den Link in der E-Mail, um dein Konto zu aktivieren.",
    );
  };

  const mitGoogle = async () => {
    setLaedt(true);
    const ergebnis = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (ergebnis.error) {
      setLaedt(false);
      toast.error("Die Anmeldung mit Google hat nicht funktioniert.");
      return;
    }
    if (ergebnis.redirected) return;
    navigate({ to: "/start", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zurück zur Startseite
        </Link>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Wiederverkauf-Assistent</CardTitle>
            <CardDescription>
              Dein persönlicher Arbeitsplatz für Inserate, Preise und Veröffentlichungen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hinweis ? (
              <div className="rounded-lg border border-border bg-secondary p-4 text-sm text-secondary-foreground">
                {hinweis}
              </div>
            ) : (
              <Tabs defaultValue="anmelden">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="anmelden">Anmelden</TabsTrigger>
                  <TabsTrigger value="registrieren">Konto erstellen</TabsTrigger>
                </TabsList>

                <TabsContent value="anmelden">
                  <form onSubmit={anmelden} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@beispiel.de"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwort">Passwort</Label>
                      <Input
                        id="passwort"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={passwort}
                        onChange={(e) => setPasswort(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={laedt}>
                      {laedt ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Anmelden
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="registrieren">
                  <form onSubmit={registrieren} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-neu">E-Mail-Adresse</Label>
                      <Input
                        id="email-neu"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={255}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@beispiel.de"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwort-neu">Passwort (mind. 8 Zeichen)</Label>
                      <Input
                        id="passwort-neu"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={passwort}
                        onChange={(e) => setPasswort(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="land">Land</Label>
                      <Select value={land} onValueChange={setLand}>
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
                        value={status}
                        onValueChange={(wert) => setStatus(wert as VerkaeuferStatus)}
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
                      <p className="text-xs text-muted-foreground">
                        Die KI nutzt diese Angabe für Formulierungen und Hinweise. Du kannst sie
                        später in den Einstellungen ändern.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={laedt || !status || !land}>
                      {laedt ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Konto erstellen
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">oder</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={mitGoogle} disabled={laedt}>
              Mit Google anmelden
            </Button>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Mit der Anmeldung akzeptierst du die Verarbeitung deiner Daten gemäß{" "}
              <Link to="/datenschutz" className="underline">
                Datenschutzerklärung
              </Link>
              . Deine Daten werden ausschließlich für den Betrieb dieser Anwendung verwendet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

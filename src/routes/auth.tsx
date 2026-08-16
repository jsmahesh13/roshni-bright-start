import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { WordmarkLink } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useLang";
import { LanguageToggle } from "@/components/roshni/LanguageToggle";
import { DEMO_STAFF, DEMO_PASSWORD } from "@/lib/demo-staff";
import { ensureDemoStaff } from "@/lib/demo-staff.functions";
import { RegisterForm } from "@/components/roshni/RegisterForm";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Roshni" },
      {
        name: "description",
        content: "Staff sign-in for Roshni. Roshni has no student login, and never will.",
      },
      { property: "og:title", content: "Sign in — Roshni" },
      { property: "og:description", content: "Staff sign-in for Roshni." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const seed = useServerFn(ensureDemoStaff);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const t = useT();
  const [ready, setReady] = useState(false);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  // A click before React hydrates submits the form natively (page reloads to
  // /auth? and no sign-in happens). Keep sign-in disabled until hydrated.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedInAs(data.user?.email ?? null);
    });
  }, []);


  useEffect(() => {
    seed()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [seed]);

  async function signIn(withEmail: string, withPassword: string) {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: withEmail,
      password: withPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/this-week", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col paper">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <WordmarkLink size={28} textClass="text-2xl" />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("backhome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-5 pb-16 lg:grid-cols-2">
        <div className="card-paper p-7">
          <h1 className="hand text-4xl text-foreground">{t("au_welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("au_staffonly")}
          </p>

          {signedInAs && (
            <div className="mt-5 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-[13px] text-gold-deep">
              {t("au_stillsigned")} <b>{signedInAs}</b>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate({ to: "/this-week", replace: true })}>
                  {t("au_continue")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setSignedInAs(null);
                  }}
                >
                  {t("signout")}
                </Button>
              </div>
            </div>
          )}

          <Tabs defaultValue="signin" className="mt-6">

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("signin")}</TabsTrigger>
              <TabsTrigger value="register">{t("register")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void signIn(email, password);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.in"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy || !hydrated}>
                  {busy ? "…" : t("enter")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-5">
              <RegisterForm />
            </TabsContent>

          </Tabs>
        </div>

        <div>
          <div className="sticky-note p-6">
            <h2 className="hand text-3xl text-foreground">{t("au_tryas")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("orstaff")}
            </p>
            <ul className="mt-5 space-y-3">
              {DEMO_STAFF.map((s) => (
                <li key={s.email}>
                  <button
                    type="button"
                    disabled={busy || !hydrated}
                    onClick={() => {
                      setEmail(s.email);
                      setPassword(s.password);
                      void signIn(s.email, s.password);
                    }}
                    className="w-full rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-lift focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.blurb}</div>
                      </div>
                      <span className="hand shrink-0 text-xl text-gold-deep">
                        {s.role === "admin" ? t("au_head") : (s.className ?? "")}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-faint">
              {t("au_demopw")}{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span>.{" "}
              {ready ? t("demonote") : "…"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

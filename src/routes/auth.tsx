import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Wordmark } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useLang";
import { LanguageToggle } from "@/components/roshni/LanguageToggle";
import { DEMO_STAFF, DEMO_PASSWORD } from "@/lib/demo-staff";
import { ensureDemoStaff } from "@/lib/demo-staff.functions";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/this-week", replace: true });
    });
  }, [navigate]);

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
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6">
        <Link to="/">
          <Wordmark size={28} textClass="text-2xl" />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("backhome")}
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-5 pb-16 lg:grid-cols-2">
        <div className="card-paper p-7">
          <h1 className="hand text-4xl text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roshni is for staff only. There is no student login, and there never will be.
          </p>

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
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "…" : t("enter")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Request noted — your head teacher will add you to the school.");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="rname">Your name</Label>
                  <Input id="rname" placeholder="Meena Rao" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remail">School email</Label>
                  <Input id="remail" type="email" placeholder="you@school.in" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rschool">School / class</Label>
                  <Input id="rschool" placeholder="GHS Kadugodi — 7B" />
                </div>
                <Button type="submit" variant="outline" className="w-full bg-card">
                  Request access
                </Button>
                <p className="text-xs text-faint">
                  Staff accounts are created by a head teacher, so that a school always knows who
                  can read what its teachers notice.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <div className="sticky-note p-6">
            <h2 className="hand text-3xl text-foreground">Try it as someone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("orstaff")}
            </p>
            <ul className="mt-5 space-y-3">
              {DEMO_STAFF.map((s) => (
                <li key={s.email}>
                  <button
                    type="button"
                    disabled={busy}
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
                        {s.role === "admin" ? "head" : (s.className ?? "")}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-faint">
              Every demo account uses the password{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span>.{" "}
              {ready ? t("demonote") : "…"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

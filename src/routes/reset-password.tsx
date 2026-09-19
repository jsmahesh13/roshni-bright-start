import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { WordmarkLink } from "@/components/roshni/SunLogo";
import { LanguageToggle } from "@/components/roshni/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Roshni" },
      { name: "description", content: "Choose a new password for your Roshni staff account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // The emailed link carries a recovery token; Supabase turns it into a
    // session and fires PASSWORD_RECOVERY. Listen for it, and also accept an
    // already-established recovery session (e.g. hash parsed before mount).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === "checking" ? "ready" : s));
      else setStatus((s) => (s === "checking" ? "invalid" : s));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (password.length < 8) {
      toast.error(t("rp_min"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("rp_mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(t("rp_invalid"));
        setStatus("invalid");
        return;
      }
      // End the recovery session so the next visit to /auth starts clean.
      await supabase.auth.signOut().catch(() => {});
      setStatus("done");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col paper">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <WordmarkLink size={28} textClass="text-2xl" />
        <LanguageToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-start justify-center px-5 pb-16 pt-8">
        <div className="card-paper w-full p-7">
          {status === "checking" && <p className="text-sm text-muted-foreground">…</p>}

          {status === "invalid" && (
            <div>
              <h1 className="hand text-4xl text-foreground">{t("au_reset_title")}</h1>
              <p className="mt-3 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-[13px] text-gold-deep">
                {t("rp_invalid")}
              </p>
              <div className="mt-5">
                <Button asChild className="w-full">
                  <Link to="/auth">{t("rp_request_new")}</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "ready" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <h1 className="hand text-4xl text-foreground">{t("rp_title")}</h1>
              <p className="text-sm text-muted-foreground">{t("rp_sub")}</p>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("rp_new")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("rp_confirm")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !hydrated}>
                {busy ? "…" : t("rp_set")}
              </Button>
            </form>
          )}

          {status === "done" && (
            <div>
              <h1 className="hand text-4xl text-foreground">{t("rp_title")}</h1>
              <p className="mt-3 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-[13px] text-gold-deep">
                {t("rp_success")}
              </p>
              <div className="mt-5">
                <Button asChild className="w-full">
                  <Link to="/auth">{t("au_back_signin")}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useLang";
import { lookupSchoolByCode } from "@/lib/school.functions";


interface ClassOption {
  id: string;
  name: string;
}

/**
 * Real self-registration, gated by a school join code. The code is only ever
 * verified server-side (SECURITY DEFINER RPCs) — the client never receives a
 * list of schools or codes, and the profile is always created as 'teacher'.
 */
export function RegisterForm() {
  const t = useT();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [school, setSchool] = useState<{ id: string; name: string } | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Until React has hydrated, a click on a submit button posts the form
  // natively and the account is never created. Keep it disabled till then.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);


  async function checkCode() {
    if (!code.trim()) return;
    setChecking(true);
    setCodeError(null);
    let result: Awaited<ReturnType<typeof lookupSchoolByCode>> | null = null;
    try {
      result = await lookupSchoolByCode({ data: { code: code.trim() } });
    } catch {
      result = null;
    }
    setChecking(false);
    if (!result?.found) {
      setSchool(null);
      setClasses([]);
      setClassId("");
      setCodeError(t("su_badcode"));
      return;
    }
    setSchool(result.school);
    setClasses(result.classes);
    setClassId("");
  }


  async function submit() {
    if (!school) {
      setCodeError(t("su_needcode"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("su_pwshort"));
      return;
    }
    setBusy(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (signUpError) {
      setBusy(false);
      toast.error(signUpError.message);
      return;
    }

    // Auto-confirm is on for the demo, but sign in explicitly so we always
    // hold a session before creating the staff profile.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setBusy(false);
      toast.error(signInError.message);
      return;
    }

    const { error: joinError } = await supabase.rpc("join_school", {
      p_name: name.trim(),
      p_code: code.trim(),
      p_class_id: classId || (null as unknown as string),
    });
    setBusy(false);
    if (joinError) {
      toast.error(joinError.message);
      return;
    }
    toast.success(t("su_welcome"));
    navigate({ to: "/this-week", replace: true });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="rounded-xl border border-dashed border-gold/60 bg-gold-soft px-3 py-2 text-[12px] text-gold-deep">
        {t("su_democode")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rname">{t("su_name")}</Label>
        <Input
          id="rname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meena Rao"
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="remail">{t("su_email")}</Label>
        <Input
          id="remail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.in"
          maxLength={255}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rpw">{t("su_password")}</Label>
        <Input
          id="rpw"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rcode">{t("su_code")}</Label>
        <div className="flex gap-2">
          <Input
            id="rcode"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setSchool(null);
              setCodeError(null);
            }}
            placeholder="KADUGODI-2026"
            maxLength={64}
            required
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 bg-card"
            disabled={checking || !code.trim()}
            onClick={() => void checkCode()}
          >
            {checking ? t("su_checking") : t("su_check")}
          </Button>
        </div>
        {codeError && <p className="text-xs text-concern">{codeError}</p>}
        {school && (
          <p className="text-xs font-semibold text-strength">{school.name} ✓</p>
        )}
      </div>

      {school && (
        <div className="space-y-2">
          <Label htmlFor="rclass">{t("su_class")}</Label>
          <select
            id="rclass"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("su_noclass")}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={busy || !hydrated}>
        {busy ? t("su_creating") : t("su_create")}
      </Button>


      <p className="text-xs text-faint">{t("su_scope")}</p>
      <p className="text-xs text-faint">{t("su_governance")}</p>
    </form>
  );
}

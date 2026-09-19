import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { saveImpersonatorSession } from "@/components/roshni/ImpersonationBanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  archiveEntity,
  createTeacher,
  resetTeacherPassword,
  restoreEntity,
  startImpersonation,
} from "@/lib/admin.functions";
import {
  adminClassesQuery,
  adminSchoolsQuery,
  adminTeachersQuery,
  type AdminProfile,
} from "@/lib/admin-queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — Roshni Console" },
      { name: "description", content: "Manage teacher and principal accounts across schools." },
      { property: "og:title", content: "Teachers — Roshni Console" },
      { property: "og:description", content: "Manage teacher and principal accounts across schools." },
    ],
  }),
  component: AdminTeachers,
});

function AdminTeachers() {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: teachers } = useQuery(adminTeachersQuery);
  const { data: schools } = useQuery(adminSchoolsQuery);
  const { data: classes } = useQuery(adminClassesQuery);
  const createTeacherFn = useServerFn(createTeacher);
  const archiveFn = useServerFn(archiveEntity);
  const restoreFn = useServerFn(restoreEntity);
  const resetPwFn = useServerFn(resetTeacherPassword);
  const impersonateFn = useServerFn(startImpersonation);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [pwFor, setPwFor] = useState<AdminProfile | null>(null);
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });
  const schoolName = (id: string) => schools?.find((s) => s.id === id)?.name ?? "—";
  const className = (id: string | null) =>
    id ? (classes?.find((c) => c.id === id)?.name ?? "—") : "—";
  const liveSchools = (schools ?? []).filter((s) => !s.archived_at);
  const classOptions = (classes ?? []).filter((c) => !c.archived_at && c.school_id === schoolId);

  const save = useMutation({
    mutationFn: () =>
      createTeacherFn({
        data: {
          name,
          identifier,
          password,
          schoolId,
          classId: classId || null,
        },
      }),
    onSuccess: () => {
      toast.success(t("ad_done_created_teacher"));
      setAddOpen(false);
      setName("");
      setIdentifier("");
      setPassword("");
      setClassId("");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleArchive = useMutation({
    mutationFn: (p: AdminProfile) =>
      p.archived_at
        ? restoreFn({ data: { entityType: "teacher", entityId: p.id } })
        : archiveFn({ data: { entityType: "teacher", entityId: p.id } }),
    onSuccess: (_r, p) => {
      toast.success(p.archived_at ? t("ad_done_restored") : t("ad_done_archived"));
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetPw = useMutation({
    mutationFn: () =>
      resetPwFn({ data: { teacherId: pwFor!.id, newPassword: newPw } }),
    onSuccess: () => {
      toast.success(t("ad_done_pw"));
      setPwFor(null);
      setNewPw("");
    },
    onError: (e) => toast.error(e.message),
  });

  async function loginAs(p: AdminProfile) {
    setBusy(p.id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("No session");
      const res = await impersonateFn({ data: { teacherId: p.id } });
      saveImpersonatorSession({
        access_token: sess.session.access_token,
        refresh_token: sess.session.refresh_token,
        teacherId: p.id,
        teacherName: p.name,
      });
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: res.hashedToken,
        type: "magiclink",
      });
      if (error) throw error;
      toast.success(t("ad_done_imp"));
      navigate({ to: "/this-week" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="hand text-3xl text-foreground">{t("ad_teachers")}</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>{t("ad_add_teacher")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>{t("ad_add_teacher")}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="tname">{t("au_name")}</Label>
                <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tident">{t("ad_identifier")}</Label>
                <Input
                  id="tident"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpw">{t("ad_password")}</Label>
                <Input
                  id="tpw"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tschool">{t("ad_school_col")}</Label>
                <select
                  id="tschool"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={schoolId}
                  onChange={(e) => {
                    setSchoolId(e.target.value);
                    setClassId("");
                  }}
                  required
                >
                  <option value="" disabled>
                    —
                  </option>
                  {liveSchools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tclass">{t("ad_class")}</Label>
                <select
                  id="tclass"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">—</option>
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {t("ad_create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-paper mt-4 divide-y divide-border">
        {(teachers ?? []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{p.name}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {p.role === "admin" ? t("ad_role_admin") : t("ad_role_teacher")}
                </span>
                {p.archived_at && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    {t("ad_archived")}
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {p.email ?? (p.username ? `${t("ad_username")}: ${p.username}` : "—")} ·{" "}
                {schoolName(p.school_id)} · {className(p.class_id)}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!p.archived_at && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card"
                    disabled={busy === p.id}
                    onClick={() => void loginAs(p)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                    {t("ad_login_as")}
                  </Button>
                  <Button variant="outline" size="sm" className="bg-card" onClick={() => setPwFor(p)}>
                    {t("ad_reset_pw")}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (p.archived_at || window.confirm(t("ad_confirm_archive"))) {
                    toggleArchive.mutate(p);
                  }
                }}
              >
                {p.archived_at ? t("ad_restore") : t("ad_archive")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!pwFor} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {t("ad_reset_pw")} — {pwFor?.name}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              resetPw.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="npw">{t("ad_new_pw")}</Label>
              <Input
                id="npw"
                type="text"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetPw.isPending}>
              {t("ad_create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";

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
import { useProfile } from "@/hooks/useSession";
import { useT } from "@/hooks/useLang";
import { archiveEntity, createTeacher, restoreEntity } from "@/lib/admin.functions";
import {
  adminClassesQuery,
  adminSchoolsQuery,
  adminStudentsQuery,
  adminTeachersQuery,
  type AdminProfile,
} from "@/lib/admin-queries";

export const Route = createFileRoute("/_authenticated/manage")({
  head: () => ({
    meta: [
      { title: "My school — Roshni" },
      { name: "description", content: "Manage teachers, classes and the join code for your school." },
      { property: "og:title", content: "My school — Roshni" },
      { property: "og:description", content: "Manage teachers, classes and the join code for your school." },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: schools } = useQuery(adminSchoolsQuery);
  const { data: teachers } = useQuery(adminTeachersQuery);
  const { data: classes } = useQuery(adminClassesQuery);
  const { data: students } = useQuery(adminStudentsQuery);
  const createTeacherFn = useServerFn(createTeacher);
  const archiveFn = useServerFn(archiveEntity);
  const restoreFn = useServerFn(restoreEntity);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");

  const school = (schools ?? []).find((s) => s.id === profile?.school_id);
  const myTeachers = (teachers ?? []).filter((p) => p.school_id === profile?.school_id);
  const myClasses = (classes ?? []).filter((c) => !c.archived_at);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  if (!profileLoading && profile && profile.role !== "admin") {
    throw redirect({ to: "/this-week" });
  }

  const save = useMutation({
    mutationFn: () =>
      createTeacherFn({
        data: { name, identifier, password, classId: classId || null },
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

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="hand text-5xl text-foreground">{t("mg_title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("mg_sub")}</p>

      <div className="card-paper mt-6 flex items-center justify-between gap-3 p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("mg_joincode")}</div>
          <div className="hand mt-1 text-4xl text-gold-deep">{school?.join_code ?? "—"}</div>
        </div>
        <Button
          variant="outline"
          className="bg-card"
          onClick={() => {
            if (school?.join_code) {
              void navigator.clipboard.writeText(school.join_code);
              toast.success(t("au_copied"));
            }
          }}
        >
          <Copy className="mr-2 h-4 w-4" strokeWidth={1.75} />
          {t("au_copy_code")}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="hand flex items-center gap-2 text-3xl text-foreground">
          <Users className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
          {t("mg_teachers")}
        </h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">{t("mg_addteacher")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>{t("mg_addteacher")}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="mname">{t("au_name")}</Label>
                <Input id="mname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mident">{t("ad_identifier")}</Label>
                <Input
                  id="mident"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mpw">{t("ad_password")}</Label>
                <Input
                  id="mpw"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mclass">{t("ad_class")}</Label>
                <select
                  id="mclass"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">—</option>
                  {myClasses.map((c) => (
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

      <div className="card-paper mt-3 divide-y divide-border">
        {myTeachers.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{p.name}</span>
                {p.role === "admin" && (
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs text-gold-deep">
                    {t("ad_role_admin")}
                  </span>
                )}
                {p.archived_at && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    {t("ad_archived")}
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {p.email ?? (p.username ? `${t("ad_username")}: ${p.username}` : "—")} ·{" "}
                {classes?.find((c) => c.id === p.class_id)?.name ?? "—"}
              </div>
            </div>
            {p.id !== profile?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  if (p.archived_at || window.confirm(t("ad_confirm_archive"))) {
                    toggleArchive.mutate(p);
                  }
                }}
              >
                {p.archived_at ? t("ad_restore") : t("ad_archive")}
              </Button>
            )}
          </div>
        ))}
      </div>

      <h2 className="hand mt-8 flex items-center gap-2 text-3xl text-foreground">
        <UsersRound className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
        {t("mg_classes")}
      </h2>
      <div className="card-paper mt-3 divide-y divide-border">
        {myClasses.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div className="font-medium text-foreground">{c.name}</div>
            <span className="text-xs text-muted-foreground">
              {(students ?? []).filter((s) => s.class_id === c.id && !s.archived_at).length}{" "}
              {t("ad_kpi_students").toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

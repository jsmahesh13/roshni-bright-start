import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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
import { archiveEntity, createSchool, createSchoolAdmin, restoreEntity } from "@/lib/admin.functions";
import { adminSchoolsQuery, type AdminSchool } from "@/lib/admin-queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/admin/schools")({
  head: () => ({
    meta: [
      { title: "Schools — Roshni Console" },
      { name: "description", content: "Create and manage Roshni schools." },
      { property: "og:title", content: "Schools — Roshni Console" },
      { property: "og:description", content: "Create and manage Roshni schools." },
    ],
  }),
  component: AdminSchools,
});

function AdminSchools() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: schools } = useQuery(adminSchoolsQuery);
  const createSchoolFn = useServerFn(createSchool);
  const createAdminFn = useServerFn(createSchoolAdmin);
  const archiveFn = useServerFn(archiveEntity);
  const restoreFn = useServerFn(restoreEntity);

  const [schoolOpen, setSchoolOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const [adminFor, setAdminFor] = useState<AdminSchool | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const saveSchool = useMutation({
    mutationFn: () => createSchoolFn({ data: { name, code } }),
    onSuccess: (s) => {
      toast.success(t("ad_done_created_school"));
      setSchoolOpen(false);
      setName("");
      setCode("");
      refresh();
      setAdminFor((schools ?? []).find((x) => x.code === s.code) ?? null);
    },
    onError: (e) => toast.error(e.message),
  });

  const saveAdmin = useMutation({
    mutationFn: () =>
      createAdminFn({
        data: { schoolId: adminFor!.id, name: adminName, email: adminEmail, password: adminPassword },
      }),
    onSuccess: () => {
      toast.success(t("ad_done_created_admin"));
      setAdminFor(null);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleArchive = useMutation({
    mutationFn: (s: AdminSchool) =>
      s.archived_at
        ? restoreFn({ data: { entityType: "school", entityId: s.id } })
        : archiveFn({ data: { entityType: "school", entityId: s.id } }),
    onSuccess: (_r, s) => {
      toast.success(s.archived_at ? t("ad_done_restored") : t("ad_done_archived"));
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="hand text-3xl text-foreground">{t("ad_schools")}</h2>
        <Dialog open={schoolOpen} onOpenChange={setSchoolOpen}>
          <DialogTrigger asChild>
            <Button>{t("ad_new_school")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>{t("ad_new_school")}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveSchool.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="sname">{t("ad_school_name")}</Label>
                <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scode">{t("ad_school_code")}</Label>
                <Input
                  id="scode"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SCHOOL-2026"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saveSchool.isPending}>
                {t("ad_create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-paper mt-4 divide-y divide-border">
        {(schools ?? []).map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{s.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{s.code}</div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {s.is_sandbox && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  {t("ad_sandbox")}
                </span>
              )}
              {s.archived_at && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                  {t("ad_archived")}
                </span>
              )}
              {!s.archived_at && (
                <Button variant="outline" size="sm" className="bg-card" onClick={() => setAdminFor(s)}>
                  {t("ad_add_admin")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (s.archived_at || window.confirm(t("ad_confirm_archive"))) {
                    toggleArchive.mutate(s);
                  }
                }}
              >
                {s.archived_at ? t("ad_restore") : t("ad_archive")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!adminFor} onOpenChange={(o) => !o && setAdminFor(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {t("ad_add_admin")} — {adminFor?.name}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveAdmin.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="aname">{t("ad_admin_name")}</Label>
              <Input id="aname" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aemail">{t("ad_admin_email")}</Label>
              <Input
                id="aemail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apw">{t("ad_password")}</Label>
              <Input
                id="apw"
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saveAdmin.isPending}>
              {t("ad_create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

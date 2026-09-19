import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archiveEntity, restoreEntity } from "@/lib/admin.functions";
import {
  adminClassesQuery,
  adminSchoolsQuery,
  adminStudentsQuery,
  type AdminStudent,
} from "@/lib/admin-queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({
    meta: [
      { title: "Students — Roshni Console" },
      { name: "description", content: "Browse classrooms and students across schools." },
      { property: "og:title", content: "Students — Roshni Console" },
      { property: "og:description", content: "Browse classrooms and students across schools." },
    ],
  }),
  component: AdminStudents,
});

function AdminStudents() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: students } = useQuery(adminStudentsQuery);
  const { data: schools } = useQuery(adminSchoolsQuery);
  const { data: classes } = useQuery(adminClassesQuery);
  const archiveFn = useServerFn(archiveEntity);
  const restoreFn = useServerFn(restoreEntity);
  const [query, setQuery] = useState("");

  const schoolName = (id: string) => schools?.find((s) => s.id === id)?.name ?? "—";
  const className = (id: string) => classes?.find((c) => c.id === id)?.name ?? "—";

  const q = query.trim().toLowerCase();
  const filtered = (students ?? []).filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      schoolName(s.school_id).toLowerCase().includes(q) ||
      className(s.class_id).toLowerCase().includes(q),
  );

  const toggleArchive = useMutation({
    mutationFn: (s: AdminStudent) =>
      s.archived_at
        ? restoreFn({ data: { entityType: "student", entityId: s.id } })
        : archiveFn({ data: { entityType: "student", entityId: s.id } }),
    onSuccess: (_r, s) => {
      toast.success(s.archived_at ? t("ad_done_restored") : t("ad_done_archived"));
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="hand text-3xl text-foreground">{t("ad_students")}</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("ad_global_search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card-paper mt-4 divide-y divide-border">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("ad_no_results")}</p>
        )}
        {filtered.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{s.name}</span>
                {s.archived_at && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    {t("ad_archived")}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                #{s.roll} · {className(s.class_id)} · {schoolName(s.school_id)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => {
                if (s.archived_at || window.confirm(t("ad_confirm_archive"))) {
                  toggleArchive.mutate(s);
                }
              }}
            >
              {s.archived_at ? t("ad_restore") : t("ad_archive")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

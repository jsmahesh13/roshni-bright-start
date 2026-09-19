import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import {
  adminClassesQuery,
  adminNoticingsCountQuery,
  adminSchoolsQuery,
  adminStudentsQuery,
  adminTeachersQuery,
} from "@/lib/admin-queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Console — Roshni" },
      { name: "description", content: "Platform overview across all Roshni schools." },
      { property: "og:title", content: "Console — Roshni" },
      { property: "og:description", content: "Platform overview across all Roshni schools." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const t = useT();
  const schools = useQuery(adminSchoolsQuery);
  const teachers = useQuery(adminTeachersQuery);
  const students = useQuery(adminStudentsQuery);
  const classes = useQuery(adminClassesQuery);
  const noticings = useQuery(adminNoticingsCountQuery);

  const live = (rows: { archived_at: string | null }[] | undefined) =>
    (rows ?? []).filter((r) => !r.archived_at).length;

  const kpis = [
    { label: t("ad_kpi_schools"), value: live(schools.data) },
    { label: t("ad_kpi_teachers"), value: live(teachers.data) },
    { label: t("ad_kpi_classes"), value: live(classes.data) },
    { label: t("ad_kpi_students"), value: live(students.data) },
    { label: t("ad_kpi_noticings"), value: noticings.data ?? 0 },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card-paper p-4 text-center">
            {schools.isLoading ? (
              <Skeleton className="mx-auto h-8 w-12" />
            ) : (
              <div className="hand text-4xl text-gold-deep">{k.value}</div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <h2 className="hand mt-8 text-3xl text-foreground">{t("ad_schools")}</h2>
      <div className="card-paper mt-3 divide-y divide-border">
        {(schools.data ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{s.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{s.code}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {s.is_sandbox && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  {t("ad_sandbox")}
                </span>
              )}
              {s.archived_at ? (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive">
                  {t("ad_archived")}
                </span>
              ) : (
                <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs text-gold-deep">
                  {t("ad_active")}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {(teachers.data ?? []).filter((p) => p.school_id === s.id && !p.archived_at).length}{" "}
                {t("ad_kpi_teachers").toLowerCase()} ·{" "}
                {(students.data ?? []).filter((st) => st.school_id === s.id && !st.archived_at).length}{" "}
                {t("ad_kpi_students").toLowerCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

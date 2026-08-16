import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useSession";
import { useT } from "@/hooks/useLang";
import { classesQuery, noticingsQuery, studentsQuery } from "@/lib/queries";
import { lastSeenLabel, sortSummaries, summarise } from "@/lib/roshni";

export const Route = createFileRoute("/_authenticated/this-week")({
  head: () => ({
    meta: [
      { title: "This week — Roshni" },
      {
        name: "description",
        content: "A quiet weekly view of who has been noticed, and who has not.",
      },
      { property: "og:title", content: "This week — Roshni" },
      {
        property: "og:description",
        content: "A quiet weekly view of who has been noticed, and who has not.",
      },
    ],
  }),
  component: ThisWeek,
});

function ThisWeek() {
  const t = useT();
  const { data: profile } = useProfile();
  const { data: classes } = useQuery(classesQuery);
  const classId = profile?.role === "admin" ? null : (profile?.class_id ?? null);

  const { data: students, isLoading } = useQuery({
    ...studentsQuery(classId),
    enabled: !!profile,
  });
  const ids = useMemo(() => (students ?? []).map((s) => s.id), [students]);
  const { data: noticings } = useQuery(noticingsQuery(ids));

  const rows = useMemo(() => {
    if (!students) return [];
    const byStudent = new Map<string, NonNullable<typeof noticings>>();
    for (const n of noticings ?? []) {
      const list = byStudent.get(n.student_id) ?? [];
      list.push(n);
      byStudent.set(n.student_id, list);
    }
    return students.map((s) => summarise(s, byStudent.get(s.id) ?? []));
  }, [students, noticings]);

  const thisWeek = (noticings ?? []).filter(
    (n) => Date.now() - new Date(n.created_at).getTime() < 7 * 86_400_000,
  );
  const fading = sortSummaries(rows.filter((r) => r.fading), "fading").slice(0, 5);
  const needs = sortSummaries(rows.filter((r) => r.needsYou), "needs").slice(0, 5);
  const className = classes?.find((c) => c.id === profile?.class_id)?.name;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="text-[11px] uppercase tracking-wide text-faint">{t("tw_kicker")}</div>
      <h1 className="hand mt-1 text-5xl text-foreground">{t("nav_home")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile?.name ? `${t("tw_greet")} ${profile.name.split(" ")[0]}. ` : ""}
        {className ? `${t("tw_class")} ${className}.` : t("tw_allclasses")}
      </p>

      {isLoading ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat big={String(thisWeek.length)} label={t("tw_stat_written")} />
            <Stat big={String(rows.filter((r) => r.fading).length)} label={t("tw_stat_fading")} />
            <Stat
              big={String(rows.filter((r) => r.nearlyInvisible).length)}
              label={t("tw_stat_invisible")}
            />
          </div>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <Panel
              title={t("tw_fading_title")}
              blurb={t("tw_fading_blurb")}
              rows={fading.map((r) => ({
                id: r.student.id,
                name: r.student.name,
                note: lastSeenLabelT(r.lastSeenDays, t),
              }))}
              empty={t("tw_fading_empty")}
            />
            <Panel
              title={t("tw_needs_title")}
              blurb={t("tw_needs_blurb")}
              rows={needs.map((r) => ({
                id: r.student.id,
                name: r.student.name,
                note: fill(t("tw_concerns_count"), { n: r.concerns }),
              }))}
              empty={t("tw_needs_empty")}
            />
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/notice">{t("btn_write")}</Link>
            </Button>
            <Button asChild variant="outline" className="bg-card">
              <Link to="/class">{t("btn_openregister")}</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="card-paper p-5">
      <div className="hand text-4xl text-gold-deep">{big}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Panel({
  title,
  blurb,
  rows,
  empty,
}: {
  title: string;
  blurb: string;
  rows: { id: string; name: string; note: string }[];
  empty: string;
}) {
  return (
    <div className="card-paper p-5">
      <h2 className="hand text-3xl text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-4 space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              to="/student/$studentId"
              params={{ studentId: r.id }}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/60"
            >
              <span className="truncate font-medium text-foreground">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.note}</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="px-2 py-3 text-sm text-faint">{empty}</li>}
      </ul>
    </div>
  );
}

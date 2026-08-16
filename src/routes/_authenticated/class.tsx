import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { Constellation } from "@/components/roshni/Constellation";
import { NoticingStrip } from "@/components/roshni/NoticingStrip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useSession";
import { classesQuery, noticingsQuery, studentsQuery } from "@/lib/queries";
import { fill } from "@/lib/i18n";
import {
  FACETS,
  SORTS,
  lastSeenLabelT,
  sortSummaries,
  summarise,
  type SortKey,
} from "@/lib/roshni";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/class")({
  head: () => ({
    meta: [
      { title: "The class register — Roshni" },
      {
        name: "description",
        content:
          "Every child in the class as a two-year noticing strip, so the ones nobody has written about stand out.",
      },
      { property: "og:title", content: "The class register — Roshni" },
      {
        property: "og:description",
        content: "Every child as a two-year noticing strip.",
      },
    ],
  }),
  component: ClassRegister,
});

const SORT_KEYS = {
  needs: "needsyou",
  fading: "fadingfirst",
  most: "mostnoticed",
  roll: "rollnumber",
} as const;

function ClassRegister() {
  const t = useT();
  const { data: profile } = useProfile();
  const { data: classes } = useQuery(classesQuery);
  const [sort, setSort] = useState<SortKey>("needs");
  const [view, setView] = useState<"register" | "sky">("register");
  const [range, setRange] = useState<number>(365);
  const [classId, setClassId] = useState<string | null>(null);

  const activeClassId = profile?.role === "admin" ? (classId ?? classes?.[0]?.id ?? null) : (profile?.class_id ?? null);

  const { data: students, isLoading: loadingStudents } = useQuery({
    ...studentsQuery(activeClassId),
    enabled: !!activeClassId,
  });

  const ids = useMemo(() => (students ?? []).map((s) => s.id), [students]);
  const { data: noticings, isLoading: loadingNoticings } = useQuery(noticingsQuery(ids));

  const rows = useMemo(() => {
    if (!students) return [];
    const byStudent = new Map<string, typeof noticings extends undefined ? never : NonNullable<typeof noticings>>();
    for (const n of noticings ?? []) {
      const list = byStudent.get(n.student_id) ?? [];
      list.push(n);
      byStudent.set(n.student_id, list);
    }
    return sortSummaries(
      students.map((s) => summarise(s, byStudent.get(s.id) ?? [])),
      sort,
    );
  }, [students, noticings, sort]);

  const className = classes?.find((c) => c.id === activeClassId)?.name ?? "";
  const loading = loadingStudents || (ids.length > 0 && loadingNoticings);

  const needsCount = rows.filter((r) => r.needsYou).length;
  const fadingCount = rows.filter((r) => r.fading).length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hand text-5xl text-foreground">{t("h_class")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {className ? `${className} · ` : ""}
            {rows.length} · {view === "register" ? t("p_class_register") : t("p_class_lights")}
          </p>
        </div>

        {profile?.role === "admin" && classes && classes.length > 0 && (
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  c.id === activeClassId
                    ? "bg-gold-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {([
            { key: "register", label: t("v_register") },
            { key: "sky", label: t("v_lights") },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                view === v.key
                  ? "bg-gold-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hand text-lg text-faint">{t("over")}</span>
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
            {([
              { d: 90, label: t("term") },
              { d: 365, label: t("year") },
              { d: 730, label: t("all") },
            ] as const).map((r) => (
              <button
                key={r.d}
                onClick={() => setRange(r.d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  range === r.d
                    ? "bg-gold-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                sort === s.key
                  ? "bg-gold-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(SORT_KEYS[s.key])}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-concern/10 px-2.5 py-1 font-medium text-concern">
            {fill(t("reg_needyou_n"), { n: needsCount })}
          </span>
          <span className="rounded-full bg-gold-soft px-2.5 py-1 font-medium text-gold-deep">
            {fill(t("reg_fading_n"), { n: fadingCount })}
          </span>
        </div>
      </div>

      {/* Facet legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {FACETS.map((f) => (
          <span key={f.key} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-1 rounded-full", f.dot)} />
            {t(`f_${f.key}`)}
          </span>
        ))}
        <span className="text-faint">{t("reg_axis")}</span>
      </div>

      {view === "register" && (
      <div className="card-paper mt-5 overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1.3fr)_24px] gap-4 border-b border-border px-5 py-3 text-[11px] uppercase tracking-wide text-faint md:grid">
          <span>{t("reg_child")}</span>
          <span>{t("reg_twoyears")}</span>
          <span>{t("reg_balance")}</span>
          <span />
        </div>

        {loading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!loading &&
          rows.map((r) => (
            <Link
              key={r.student.id}
              to="/student/$studentId"
              params={{ studentId: r.student.id }}
              className={cn(
                "grid grid-cols-1 items-center gap-3 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-accent/50 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1.3fr)_24px] md:gap-4",
                r.nearlyInvisible && "bg-gold-soft/40",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hand text-lg text-faint">{r.student.roll}</span>
                  <span className="truncate font-semibold text-foreground">{r.student.name}</span>
                </div>
                {r.nearlyInvisible && (
                  <span className="mt-1 inline-block text-xs text-gold-deep">
                    {t("reg_almostnothing")}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <NoticingStrip noticings={r.noticings} />
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-strength">▲ {r.strengths}</span>
                <span className="font-medium text-concern">▼ {r.concerns}</span>
                <span className="text-muted-foreground">{lastSeenLabelT(r.lastSeenDays, t)}</span>
                {r.needsYou && (
                  <span className="rounded-full bg-concern/10 px-2 py-0.5 text-xs font-semibold text-concern">
                    {t("key_needs")}
                  </span>
                )}
                {!r.needsYou && r.fading && (
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold-deep">
                    {t("key_fading")}
                  </span>
                )}
              </div>

              <ChevronRight className="hidden h-4 w-4 text-faint md:block" />
            </Link>
          ))}

        {!loading && rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {t("reg_noclass")}
          </div>
        )}
      </div>
      )}

      {view === "sky" && (
        <Constellation rows={rows} rangeDays={range} classLabel={className} />
      )}

      <p className="mt-4 text-xs text-faint">
        {t("reg_notscores")}
      </p>

      <div className="mt-6">
        <Button asChild variant="outline" className="bg-card">
          <Link to="/notice">{t("btn_write")}</Link>
        </Button>
      </div>
    </div>
  );
}

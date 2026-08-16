import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ConstellationThree } from "@/components/roshni/ConstellationThree";
import { useProfile } from "@/hooks/useSession";
import { classesQuery, noticingsQuery, studentsQuery } from "@/lib/queries";
import { sortSummaries, summarise } from "@/lib/roshni";
import { useT } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/constellation-test")({
  head: () => ({
    meta: [{ title: "Constellation (3D test) — Roshni" }],
  }),
  component: ConstellationTestPage,
});

/**
 * Standalone test bed for the Three.js constellation, kept off the main
 * nav on purpose. Same data path as /class's sky view — if this reads
 * better, it replaces Constellation.tsx there.
 */
function ConstellationTestPage() {
  const t = useT();
  const { data: profile } = useProfile();
  const { data: classes } = useQuery(classesQuery);
  const [classId, setClassId] = useState<string | null>(null);
  const [range, setRange] = useState<number>(365);

  const activeClassId =
    profile?.role === "admin" ? (classId ?? classes?.[0]?.id ?? null) : (profile?.class_id ?? null);

  const { data: students } = useQuery({ ...studentsQuery(activeClassId), enabled: !!activeClassId });
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
    return sortSummaries(
      students.map((s) => summarise(s, byStudent.get(s.id) ?? [])),
      "needs",
    );
  }, [students, noticings]);

  const className = classes?.find((c) => c.id === activeClassId)?.name ?? "";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hand text-5xl text-foreground">{t("ct_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("ct_sub")}{" "}
            <Link to="/class" className="underline hover:text-foreground">
              {t("ct_back")}
            </Link>
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
      </div>

      <div className="mt-4 flex items-center gap-2">
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

      {rows.length > 0 ? (
        <ConstellationThree rows={rows} rangeDays={range} classLabel={className} />
      ) : (
        <div className="card-paper mt-5 p-10 text-center text-sm text-muted-foreground">
          {t("ct_noclass")}
        </div>
      )}
    </div>
  );
}

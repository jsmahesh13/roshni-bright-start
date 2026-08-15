import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { NoticingStrip } from "@/components/roshni/NoticingStrip";
import { Skeleton } from "@/components/ui/skeleton";
import { noticingsQuery, studentQuery } from "@/lib/queries";
import { FACET_LABEL, lastSeenLabel, summarise, daysAgo } from "@/lib/roshni";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/$studentId")({
  head: () => ({
    meta: [
      { title: "A child's page — Roshni" },
      {
        name: "description",
        content: "Everything noticed about one child, in the words the teachers used.",
      },
      { property: "og:title", content: "A child's page — Roshni" },
      { property: "og:description", content: "Everything noticed about one child." },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const { studentId } = Route.useParams();
  const { data: student, isLoading } = useQuery(studentQuery(studentId));
  const { data: noticings } = useQuery(noticingsQuery([studentId]));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <p className="text-sm text-muted-foreground">This child isn't in a class you can see.</p>
      </div>
    );
  }

  const s = summarise(student, noticings ?? []);
  const recent = [...s.noticings].reverse();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link
        to="/class"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the register
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="hand text-5xl text-foreground">{student.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roll {student.roll} · {s.total} noticings · last {lastSeenLabel(s.lastSeenDays)}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="font-medium text-strength">▲ {s.strengths}</span>
          <span className="font-medium text-concern">▼ {s.concerns}</span>
        </div>
      </header>

      <div className="card-paper mt-5 p-5">
        <div className="text-[11px] uppercase tracking-wide text-faint">Two years of noticing</div>
        <div className="mt-3">
          <NoticingStrip noticings={s.noticings} height={64} />
        </div>
      </div>

      <div className="card-paper mt-5 divide-y divide-border">
        {recent.map((n) => (
          <div key={n.id} className="flex gap-3 p-4">
            <span
              className={cn(
                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                `bg-facet-${n.facet}`,
              )}
              style={{ backgroundColor: `var(--facet-${n.facet})` }}
            />
            <div className="min-w-0">
              <p className="text-sm text-foreground">{n.text}</p>
              <p className="mt-1 text-xs text-faint">
                {FACET_LABEL[n.facet]} ·{" "}
                {n.valence > 0 ? "strength" : n.valence < 0 ? "concern" : "action"} ·{" "}
                {lastSeenLabel(daysAgo(n.created_at))}
              </p>
            </div>
          </div>
        ))}
        {recent.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nothing has been written about this child yet.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-faint">
        A longitudinal view, badges and the observation summary arrive in the next phase. Raw
        noticings are removed automatically after 24 months.
      </p>
    </div>
  );
}

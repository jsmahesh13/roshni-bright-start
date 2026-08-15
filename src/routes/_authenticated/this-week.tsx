import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ObservationSummary } from "@/components/roshni/ObservationSummary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useSession";
import { buildDigest } from "@/lib/digest";
import { classesQuery, noticingsQuery, studentsQuery } from "@/lib/queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/this-week")({
  head: () => ({
    meta: [
      { title: "This week — Roshni" },
      {
        name: "description",
        content: "Three things worth your attention — questions drawn from what teachers noticed.",
      },
      { property: "og:title", content: "This week — Roshni" },
      {
        property: "og:description",
        content: "Three things worth your attention — questions, not findings.",
      },
    ],
  }),
  component: ThisWeek,
});

function ThisWeek() {
  const navigate = useNavigate();
  const [quick, setQuick] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [summaryFor, setSummaryFor] = useState<string | null>(null);

  const { data: profile } = useProfile();
  const { data: classes } = useQuery(classesQuery);
  const classId = profile?.role === "admin" ? null : (profile?.class_id ?? null);

  const { data: students, isLoading } = useQuery({
    ...studentsQuery(classId),
    enabled: !!profile,
  });
  const ids = useMemo(() => (students ?? []).map((s) => s.id), [students]);
  const { data: noticings } = useQuery(noticingsQuery(ids));

  const items = useMemo(
    () => buildDigest(students ?? [], noticings ?? []),
    [students, noticings],
  );

  const className = classes?.find((c) => c.id === profile?.class_id)?.name;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
        Monday morning · nothing else interrupts you
      </div>
      <h1 className="hand mt-1 text-5xl text-foreground">{t("h_home")}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {t("p_home")}
      </p>
      <p className="mt-1 text-xs text-faint">
        {profile?.name ? `${profile.name.split(" ")[0]} · ` : ""}
        {className ? `Class ${className}` : "All classes"}
      </p>

      <section className="card-paper mt-6 p-5">
        <h2 className="hand text-3xl text-foreground">{t("noticenow")}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Type it the way you'd say it — Roshni will structure it on the next screen. Nothing is
          saved until you approve every word.
        </p>
        <Textarea
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          rows={3}
          placeholder="Fatima was quiet all morning, one-word answers…"
          className="mt-3 resize-y bg-background text-[15px]"
        />
        <div className="mt-3">
          <Button
            onClick={() =>
              navigate({
                to: "/notice",
                ...(quick.trim() ? { search: { draft: quick.trim() } } : { search: {} }),
              })
            }
          >
            {t("btn_structure")}
          </Button>
        </div>
      </section>

      {isLoading ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : items.length === 0 ? (
        <div className="card-paper mt-6 p-8 text-center text-sm text-muted-foreground">
          Nothing rose above the threshold this week. That is a valid result.
        </div>
      ) : (
        <div className="mt-6">
          {items.map((it, i) => {
            const isOpen = open === it.studentId + it.tag;
            return (
              <article key={it.tag} className="card-paper mb-3.5 overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex gap-4">
                    <div className="hand text-3xl text-gold-deep">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
                        {it.tag}
                      </span>
                      <p className="mt-1.5 max-w-2xl text-lg leading-snug text-foreground">
                        {it.question}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0 bg-card"
                    onClick={() => setOpen(isOpen ? null : it.studentId + it.tag)}
                  >
                    Evidence
                  </Button>
                </div>
                {isOpen && (
                  <div className="border-t border-border bg-background px-5 py-4">
                    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[13.5px] text-muted-foreground">
                      {it.evidence.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          navigate({
                            to: "/student/$studentId",
                            params: { studentId: it.studentId },
                          })
                        }
                      >
                        Open {it.studentName.split(" ")[0]}
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-card"
                        onClick={() => setSummaryFor(it.studentId)}
                      >
                        Prepare a summary →
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {summaryFor && (
        <ObservationSummary studentId={summaryFor} onClose={() => setSummaryFor(null)} />
      )}
    </div>
  );
}

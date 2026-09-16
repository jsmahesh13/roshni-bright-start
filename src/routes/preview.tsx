import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { WordmarkLink } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/roshni/LanguageToggle";
import { NoticingStrip } from "@/components/roshni/NoticingStrip";
import { useT } from "@/hooks/useLang";
import { summarise, FACET_VAR } from "@/lib/roshni";
import { SAMPLE_CLASS, SAMPLE_NOTICINGS, SAMPLE_STUDENTS } from "@/lib/sample-classroom";

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
  head: () => ({
    meta: [
      { title: "A sample Roshni classroom — see how it works" },
      {
        name: "description",
        content:
          "A read-only sample classroom of five invented children, showing how Roshni holds a teacher's noticings over time.",
      },
      { property: "og:title", content: "A sample Roshni classroom" },
      {
        property: "og:description",
        content: "See how Roshni surfaces the child being missed — with invented sample data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PreviewPage() {
  const t = useT();

  const rows = useMemo(
    () =>
      SAMPLE_STUDENTS.map((s) => ({
        student: s,
        summary: summarise(
          s,
          SAMPLE_NOTICINGS.filter((n) => n.student_id === s.id),
        ),
      })),
    [],
  );

  const stream = useMemo(
    () =>
      [...SAMPLE_NOTICINGS]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <WordmarkLink size={26} textClass="text-2xl" />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild size="sm">
            <Link to="/auth">{t("pv_cta")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-16 sm:px-6">
        <div className="rounded-xl border border-dashed border-gold/60 bg-gold-soft px-3 py-2 text-[12px] text-gold-deep">
          {t("pv_banner")}
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-3xl text-foreground">{t("pv_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pv_sub")}</p>
          <p className="text-xs text-faint">{SAMPLE_CLASS.name}</p>
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
          <ul className="divide-y divide-border">
            {rows.map(({ student, summary }) => (
              <li key={student.id} className="flex items-center gap-3 py-3">
                <span className="w-8 shrink-0 text-sm tabular-nums text-faint">{student.roll}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                  {student.name}
                </span>
                <div className="w-[120px] shrink-0 sm:w-[240px]">
                  <NoticingStrip noticings={summary.noticings} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-2xl text-foreground">{t("pv_stream")}</h2>
          <ul className="mt-3 space-y-3">
            {stream.map((n) => {
              const student = SAMPLE_STUDENTS.find((s) => s.id === n.student_id);
              return (
                <li key={n.id} className="border-l-2 pl-3" style={{ borderColor: FACET_VAR[n.facet] }}>
                  <p className="text-[15px] text-foreground">{n.text}</p>
                  <p className="text-xs text-faint">
                    {student?.name} · {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <Button asChild className="min-h-11 w-full">
          <Link to="/auth">{t("pv_cta")}</Link>
        </Button>
      </main>
    </div>
  );
}

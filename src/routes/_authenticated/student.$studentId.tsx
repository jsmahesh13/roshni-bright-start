import { useT } from "@/hooks/useLang";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ObservationSummary } from "@/components/roshni/ObservationSummary";
import { Timeline } from "@/components/roshni/Timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useSession";
import {
  badgesQuery,
  classesQuery,
  staffQuery,
  studentNoticingsQuery,
  studentQuery,
} from "@/lib/queries";
import { fill } from "@/lib/i18n";
import { thresholdReasons } from "@/lib/summary";
import {
  FACET_VAR,
  daysAgo,
  lastSeenLabelT,
  type BadgeKey,
  type Noticing,
} from "@/lib/roshni";

const BADGES: { key: BadgeKey; icon: string; labelKey: string }[] = [
  { key: "pin", icon: "📌", labelKey: "bdg_pin" },
  { key: "watch", icon: "👀", labelKey: "bdg_watch" },
  { key: "follow", icon: "↩︎", labelKey: "bdg_follow" },
  { key: "parent", icon: "✉︎", labelKey: "bdg_parent" },
  { key: "celebrate", icon: "★", labelKey: "bdg_celebrate" },
  { key: "checkin", icon: "🤝", labelKey: "bdg_checkin" },
];

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
  const t = useT();
  const { studentId } = Route.useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery(studentQuery(studentId));
  const { data: all } = useQuery(studentNoticingsQuery(studentId));
  const { data: classes } = useQuery(classesQuery);
  const { data: staff } = useQuery(staffQuery);
  const { data: badges } = useQuery(badgesQuery(studentId, user?.id));

  const [summaryOpen, setSummaryOpen] = useState(false);

  const notes = useMemo(() => (all ?? []).filter((n) => !n.retracted), [all]);
  const authorName = (id: string | null) =>
    staff?.find((s) => s.id === id)?.name ?? t("sp_colleague");

  const toggleBadge = useMutation({
    mutationFn: async (key: BadgeKey) => {
      const existing = badges?.find((b) => b.key === key);
      if (existing) {
        const { error } = await supabase.from("badges").delete().eq("id", existing.id);
        if (error) throw error;
        return { key, on: false };
      }
      const { error } = await supabase
        .from("badges")
        .insert({ student_id: studentId, teacher_id: user!.id, key });
      if (error) throw error;
      return { key, on: true };
    },
    onSuccess: ({ key, on }) => {
      void queryClient.invalidateQueries({ queryKey: ["badges", studentId] });
      const bk = BADGES.find((b) => b.key === key)?.labelKey;
      toast(`${bk ? t(bk) : ""} · ${on ? t("sp_badge_added") : t("sp_badge_cleared")}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const retract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("noticings").update({ retracted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-noticings", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["noticings"] });
      toast(t("sp_retract_toast"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-sm text-muted-foreground">{t("sp_notfound")}</p>
      </div>
    );
  }

  const strengths = notes.filter((n) => n.valence > 0);
  const concerns = notes.filter((n) => n.valence < 0);
  const actions = notes.filter((n) => n.valence === 0);
  // One interleaved stream so a lopsided record never leaves an empty panel.
  const stream = [...strengths, ...concerns].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );

  const lastSeen = notes.length
    ? Math.min(...notes.map((n) => daysAgo(n.created_at)))
    : null;

  const reasons = thresholdReasons(notes);
  const crossed = reasons.length > 0;

  const counts: Record<string, number> = {};
  notes.forEach((n) => (counts[n.facet] = (counts[n.facet] ?? 0) + 1));
  const dominant = Object.keys(counts).sort((a, b) => counts[b]! - counts[a]!)[0];

  const className = classes?.find((c) => c.id === student.class_id)?.name ?? "—";
  const authors = [...new Set(notes.map((n) => authorName(n.author_id).toUpperCase()))];

  const Row = ({ n }: { n: Noticing }) => (
    <div className={`border-b border-border px-4 py-3 last:border-0 ${n.retracted ? "opacity-45" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-faint">
        {new Date(n.created_at)
          .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
          .toUpperCase()}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 normal-case tracking-normal text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FACET_VAR[n.facet] }} />
          {t(`f_${n.facet}`)}
        </span>
        {n.retracted && <span className="text-concern">{t("sp_retracted")}</span>}
      </div>
      <p className="mt-1.5 text-sm text-foreground">{n.text}</p>
      <div className="mt-1 text-xs text-faint">
        {authorName(n.author_id)}
        {!n.retracted && n.author_id === user?.id && (
          <>
            {" · "}
            <button
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                if (
                  window.confirm(t("sp_retract_confirm"))
                )
                  retract.mutate(n.id);
              }}
            >
              {t("sp_retract")}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        to="/class"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("sp_back")}
      </Link>

      <header className="mt-4">
        <h1 className="hand text-5xl text-foreground">{student.name}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-faint">
          {t("sp_class")} {className} · {t("sp_roll")} {student.roll} · {t("sp_authoredby")}{" "}
          {authors.join(", ") || "—"}
        </p>
      </header>

      <div className="card-paper mt-5 grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Stat label={t("sp_total")} value={fill(t("sp_total_v"), { n: notes.length })} />
        <Stat label={t("sp_balance")} value={`${strengths.length}▲ · ${concerns.length}▼`} />
        <Stat label={t("sp_lastnoticed")} value={lastSeenLabelT(lastSeen, t)} />
        <Stat label={t("sp_dominant")} value={dominant ? t(`f_${dominant}`) : "—"} />
      </div>

      <div
        className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${
          crossed ? "border-concern/50 bg-concern/8" : "border-border bg-card"
        }`}
      >
        <p className="max-w-2xl text-sm text-foreground">
          {crossed ? (
            <>
              <b>{t("sp_crossed")}</b> {reasons.map((r) => t(r)).join(" ")} {t("sp_crossed_tail")}
            </>
          ) : (
            t("sp_notcrossed")
          )}
        </p>
        <Button
          variant={crossed ? "default" : "outline"}
          className={crossed ? "" : "bg-card"}
          onClick={() => setSummaryOpen(true)}
        >
          {t("btn_summary")}
        </Button>
      </div>

      <section className="card-paper mt-5 p-5">
        <h2 className="hand text-3xl text-foreground">{t("sp_markers")}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {t("sp_markers_sub")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const on = !!badges?.some((x) => x.key === b.key);
            return (
              <button
                key={b.key}
                onClick={() => toggleBadge.mutate(b.key)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-gold bg-gold-soft font-semibold text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-gold"
                }`}
              >
                <span className="mr-1.5">{b.icon}</span>
                {t(b.labelKey)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-paper mt-5 p-5">
        <div className="text-[11px] uppercase tracking-wide text-faint">{t("sp_twoyears")}</div>
        <div className="mt-2">
          <Timeline noticings={notes} />
        </div>
      </section>

      <section className="card-paper mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <span className="text-sm font-semibold text-foreground">{t("sp_stream")}</span>{" "}
            <span className="text-xs text-faint">{t("sp_stream_sub")}</span>
          </div>
          <div className="flex gap-3 text-sm font-semibold">
            <span className="text-strength">▲ {strengths.length}</span>
            <span className="text-concern">▼ {concerns.length}</span>
          </div>
        </div>
        <div className="columns-1 gap-0 md:columns-2 md:gap-5 md:p-2">
          {stream.map((n) => (
            <div
              key={n.id}
              className={`mb-0 break-inside-avoid border-l-4 md:mb-2 md:rounded-lg md:border ${
                n.valence > 0
                  ? "border-l-strength bg-strength/6 md:border-strength/30"
                  : "border-l-concern bg-concern/6 md:border-concern/30"
              }`}
            >
              <Row n={n} />
            </div>
          ))}
          {stream.length === 0 && <Empty text={t("sp_nothinghere")} />}
        </div>
      </section>


      <section className="card-paper mt-5">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          {t("sp_actions")} <span className="text-faint">· {actions.length}</span>
        </div>
        {actions.map((n) => (
          <Row key={n.id} n={n} />
        ))}
        {actions.length === 0 && <Empty text={t("sp_noactions")} />}
      </section>

      <p className="mt-4 text-xs text-faint">
        {t("sp_retention")}
      </p>

      {summaryOpen && (
        <ObservationSummary studentId={studentId} onClose={() => setSummaryOpen(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Column({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-paper">
      <div className={`border-b border-border px-4 py-3 text-sm font-semibold ${accent}`}>
        {title} <span className="text-faint">· {count}</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

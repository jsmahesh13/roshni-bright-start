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
import {
import { useT } from "@/hooks/useLang";
  FACET_LABEL,
  FACET_VAR,
  daysAgo,
  lastSeenLabel,
  type BadgeKey,
  type Noticing,
} from "@/lib/roshni";

const BADGES: { key: BadgeKey; icon: string; label: string }[] = [
  { key: "pin", icon: "📌", label: "Keep visible" },
  { key: "watch", icon: "👀", label: "Watching" },
  { key: "follow", icon: "↩︎", label: "Follow up" },
  { key: "parent", icon: "✉︎", label: "Told a parent" },
  { key: "celebrate", icon: "★", label: "Celebrate" },
  { key: "checkin", icon: "🤝", label: "Check in" },
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
    staff?.find((s) => s.id === id)?.name ?? "A colleague";

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
      const label = BADGES.find((b) => b.key === key)?.label;
      toast(`${label} · ${on ? "added" : "cleared"}`);
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
      toast("Retracted — still in the record, no longer feeding patterns");
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
        <p className="text-sm text-muted-foreground">This child isn't in a class you can see.</p>
      </div>
    );
  }

  const strengths = notes.filter((n) => n.valence > 0);
  const concerns = notes.filter((n) => n.valence < 0);
  const actions = notes.filter((n) => n.valence === 0);
  const lastSeen = notes.length
    ? Math.min(...notes.map((n) => daysAgo(n.created_at)))
    : null;

  const recentConcerns = concerns.filter((n) => daysAgo(n.created_at) <= 21).length;
  const reasons: string[] = [];
  if (recentConcerns >= 3) reasons.push("A run of recent concern.");
  if (notes.length >= 8 && concerns.length / notes.length >= 0.7)
    reasons.push("The record is heavily one-sided.");
  if (lastSeen !== null && lastSeen > 90) reasons.push("No entry for a long stretch.");
  if (notes.length === 0) reasons.push("Almost nothing on record.");
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
          {FACET_LABEL[n.facet]}
        </span>
        {n.retracted && <span className="text-concern">retracted</span>}
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
                  window.confirm(
                    "Retracting keeps the note in the record but stops it feeding patterns. Retract it?",
                  )
                )
                  retract.mutate(n.id);
              }}
            >
              Retract
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
        <ArrowLeft className="h-4 w-4" /> Back to the register
      </Link>

      <header className="mt-4">
        <h1 className="hand text-5xl text-foreground">{student.name}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-faint">
          CLASS {className} · ROLL {student.roll} · AUTHORED BY {authors.join(", ") || "—"}
        </p>
      </header>

      <div className="card-paper mt-5 grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Stat label="Total" value={`${notes.length} noticings`} />
        <Stat label="Balance" value={`${strengths.length}▲ · ${concerns.length}▼`} />
        <Stat label="Last noticed" value={lastSeenLabel(lastSeen)} />
        <Stat label="Dominant" value={dominant ? FACET_LABEL[dominant as never] : "—"} />
      </div>

      <div
        className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${
          crossed ? "border-concern/50 bg-concern/8" : "border-border bg-card"
        }`}
      >
        <p className="max-w-2xl text-sm text-foreground">
          {crossed ? (
            <>
              <b>A pattern has crossed a threshold.</b> {reasons.join(" ")} You may want a summary
              you can act on.
            </>
          ) : (
            "No pattern has crossed a threshold. You can still prepare a summary any time."
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
        <h2 className="hand text-3xl text-foreground">Your markers for this child</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Badges track your intentions and actions — never the child's character. They're yours;
          clear them anytime.
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
                {b.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-paper mt-5 p-5">
        <div className="text-[11px] uppercase tracking-wide text-faint">Two years of noticing</div>
        <div className="mt-2">
          <Timeline noticings={notes} />
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Column title={`▲ ${t("strengths")}`} count={strengths.length} accent="text-strength">
          {strengths.map((n) => (
            <Row key={n.id} n={n} />
          ))}
          {strengths.length === 0 && <Empty text="Nothing on record here yet." />}
        </Column>
        <Column title={`▼ ${t("concerns")}`} count={concerns.length} accent="text-concern">
          {concerns.map((n) => (
            <Row key={n.id} n={n} />
          ))}
          {concerns.length === 0 && <Empty text="Nothing on record here yet." />}
        </Column>
      </div>

      <section className="card-paper mt-5">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Actions you took <span className="text-faint">· {actions.length}</span>
        </div>
        {actions.map((n) => (
          <Row key={n.id} n={n} />
        ))}
        {actions.length === 0 && <Empty text="No actions recorded yet." />}
      </section>

      <p className="mt-4 text-xs text-faint">
        Raw noticings are removed automatically after 24 months. Retracted notes stay in the record
        but stop feeding any pattern.
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

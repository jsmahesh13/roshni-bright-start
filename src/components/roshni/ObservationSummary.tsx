import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useSession";
import { classesQuery, studentNoticingsQuery, studentQuery } from "@/lib/queries";
import { DAY_MS, FACET_VAR, type Noticing } from "@/lib/roshni";
import {
  DOMAIN,
  DOMAIN_ORDER,
  REGION,
  SUPPORTS,
  shortDate,
  thresholdReasons,
  type Domain,
} from "@/lib/summary";

export function ObservationSummary({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const { data: profile } = useProfile();
  const { data: student } = useQuery(studentQuery(studentId));
  const { data: allNotes } = useQuery(studentNoticingsQuery(studentId));
  const { data: classes } = useQuery(classesQuery);

  const notes = useMemo(() => (allNotes ?? []).filter((n) => !n.retracted), [allNotes]);

  const recent = notes.filter((n) => Date.now() - new Date(n.created_at).getTime() < 180 * DAY_MS);
  const byDomain = DOMAIN_ORDER.map((d) => ({
    domain: d,
    notes: recent.filter((n) => n.facet === d && n.valence < 0),
  }))
    .filter((o) => o.notes.length > 0)
    .sort((a, b) => b.notes.length - a.notes.length);
  const primary: Domain = byDomain[0]?.domain ?? "affect";

  const strengths = recent.filter((n) => n.valence > 0);
  const actions = notes.filter((n) => n.valence === 0).slice(0, 5);
  const reasons = thresholdReasons(notes);

  const className = classes?.find((c) => c.id === student?.class_id)?.name ?? "—";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const sortDesc = (ns: Noticing[]) =>
    [...ns].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return (
    <div
      className="fixed inset-0 z-80 overflow-auto bg-foreground/50 px-4 py-8 print-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Observation summary"
    >
      <div className="print-sheet mx-auto max-w-3xl overflow-hidden rounded-lg bg-card shadow-lift">
        <div className="no-print sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
            Observation summary
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card" onClick={() => window.print()}>
              Print / PDF
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-10 sm:pb-11">
          <h1 className="hand text-4xl text-foreground">{student?.name ?? "…"}</h1>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            Class {className} · Roll {student?.roll ?? "—"} · Prepared by {profile?.name ?? "—"} ·{" "}
            {today} · covers the last 6 months
          </div>

          <div className="my-5 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-[12.5px] text-gold-deep">
            <b>
              This is an organised record of what was observed — not a diagnosis, prediction or
              score.
            </b>{" "}
            It exists to help a teacher decide what to do next, with the child’s consent and dignity
            in mind.
          </div>

          {reasons.length > 0 && (
            <p className="mb-1 text-sm text-concern">
              <b>Why now:</b> {reasons.join(" ")}
            </p>
          )}

          {byDomain.map(({ domain, notes: ns }) => (
            <Section
              key={domain}
              dot={FACET_VAR[domain]}
              title={DOMAIN[domain]}
              synthesis={`${ns.length} concern${ns.length > 1 ? "s" : ""} recorded in this area over the period.`}
              items={sortDesc(ns).slice(0, 6)}
            />
          ))}

          <Section
            dot={FACET_VAR.strength}
            title="Strengths — not to be forgotten"
            items={sortDesc(strengths).slice(0, 5)}
            empty="No strengths recorded recently — that itself is worth noticing."
          />

          {actions.length > 0 && (
            <Section
              dot={FACET_VAR.action}
              title="What has already been tried"
              items={sortDesc(actions)}
            />
          )}

          <div className="mt-6 rounded-xl border border-border bg-background px-5 py-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
              Suggested next steps · {DOMAIN[primary].toLowerCase()}
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] text-foreground">
              {SUPPORTS[primary].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-faint">
              Suggestions for the teacher — Roshni does not decide for you, and never contacts
              anyone itself.
            </p>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
              Resources · region: {REGION.name}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGION.resources.map((r) => (
                <div key={r.name} className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-gold-deep">
                    {r.t}
                  </div>
                  <b className="mt-1 block text-sm text-foreground">{r.name}</b>
                  <span className="text-[12.5px] text-muted-foreground">{r.detail}</span>
                  {r.num !== "—" && (
                    <div className="font-mono text-sm font-bold text-foreground">{r.num}</div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] text-faint">
              Illustrative directory — the production app keeps a verified, district-level list.
              Confirm current numbers before sharing. Escalate through the school first unless a
              child is in immediate danger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  dot,
  title,
  synthesis,
  items,
  empty,
}: {
  dot: string;
  title: string;
  synthesis?: string;
  items: Noticing[];
  empty?: string;
}) {
  return (
    <div className="mt-6 border-t-2 border-border pt-3.5">
      <div className="flex items-center gap-2.5 text-base font-semibold text-foreground">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dot }} />
        {title}
      </div>
      {synthesis && <div className="mt-1.5 mb-2.5 text-sm italic text-muted-foreground">{synthesis}</div>}
      <ul className="mt-2 space-y-1.5">
        {items.map((n) => (
          <li key={n.id} className="text-[13.5px] text-foreground">
            <span className="mr-1.5 font-mono text-[11.5px] text-faint">
              {shortDate(n.created_at)}
            </span>
            {n.text}
          </li>
        ))}
        {items.length === 0 && empty && <li className="text-[13.5px] text-faint">{empty}</li>}
      </ul>
    </div>
  );
}

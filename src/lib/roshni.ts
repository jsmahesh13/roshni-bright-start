/**
 * Roshni domain model + the small amount of arithmetic the app is allowed to do.
 *
 * Restraint rules encoded here:
 *  - we count, we never score. No index, no percentile, no ranking of children
 *    against each other on "how they are doing".
 *  - the only thing we rank is OUR OWN attention: how long since an adult
 *    wrote anything about this child.
 */

import { fill } from "@/lib/i18n";

export type Facet = "engagement" | "social" | "academic" | "affect" | "strength" | "action";

export const FACETS: { key: Facet; label: string; className: string; dot: string }[] = [
  { key: "engagement", label: "Engagement", className: "text-facet-engagement", dot: "bg-facet-engagement" },
  { key: "social", label: "Social", className: "text-facet-social", dot: "bg-facet-social" },
  { key: "academic", label: "Academic", className: "text-facet-academic", dot: "bg-facet-academic" },
  { key: "affect", label: "Emotion", className: "text-facet-affect", dot: "bg-facet-affect" },
  { key: "strength", label: "Strength", className: "text-facet-strength", dot: "bg-facet-strength" },
  { key: "action", label: "Action", className: "text-facet-action", dot: "bg-facet-action" },
];

export const FACET_LABEL: Record<Facet, string> = FACETS.reduce(
  (acc, f) => ({ ...acc, [f.key]: f.label }),
  {} as Record<Facet, string>,
);

/** CSS var names, used for inline SVG strokes where Tailwind classes can't reach. */
export const FACET_VAR: Record<Facet, string> = {
  engagement: "var(--facet-engagement)",
  social: "var(--facet-social)",
  academic: "var(--facet-academic)",
  affect: "var(--facet-affect)",
  strength: "var(--facet-strength)",
  action: "var(--facet-action)",
};

export type BadgeKey = "pin" | "watch" | "follow" | "parent" | "celebrate" | "checkin";

export const BADGE_LABEL: Record<BadgeKey, string> = {
  pin: "Pinned",
  watch: "Keep an eye",
  follow: "Follow up",
  parent: "Speak to family",
  celebrate: "Worth celebrating",
  checkin: "Check in",
};

export interface Noticing {
  id: string;
  student_id: string;
  author_id: string | null;
  facet: Facet;
  valence: number;
  text: string;
  retracted: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  roll: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: "teacher" | "admin";
  class_id: string | null;
}

/** Raw noticings are kept for 24 months, then forgotten on purpose. */
export const RETENTION_DAYS = 730;

export const DAY_MS = 86_400_000;

export function daysAgo(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / DAY_MS));
}

export interface StudentSummary {
  student: Student;
  noticings: Noticing[];
  strengths: number;
  concerns: number;
  total: number;
  lastSeenDays: number | null;
  /** A recent run of concern, or a heavily one-sided record. */
  needsYou: boolean;
  /** Nobody has written anything for six weeks or more. */
  fading: boolean;
  /** Almost nothing on record at all. */
  nearlyInvisible: boolean;
}

/**
 * The single "needs you" rule, shared by the register, the digest and the sky.
 * Plain words: a recent run of concern, OR an overwhelmingly concern-weighted
 * record that is still reasonably current. It is a statement about the record,
 * never a judgement about the child.
 */
export function needsYouRule(o: {
  recentConcerns: number;
  concerns: number;
  strengths: number;
  total: number;
  lastSeenDays: number | null;
}): boolean {
  if (o.recentConcerns >= 3) return true;
  const seen = o.lastSeenDays ?? 9999;
  return o.total >= 6 && o.concerns >= 5 && o.concerns >= 0.8 * o.total && seen <= 120;
}

export function summarise(student: Student, all: Noticing[], now = Date.now()): StudentSummary {
  const noticings = all
    .filter((n) => !n.retracted)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const strengths = noticings.filter((n) => n.valence > 0).length;
  const concerns = noticings.filter((n) => n.valence < 0).length;
  const last = noticings[noticings.length - 1];
  const lastSeenDays = last ? daysAgo(last.created_at, now) : null;

  const recentConcerns = noticings.filter(
    (n) => n.valence < 0 && daysAgo(n.created_at, now) <= 21,
  ).length;

  return {
    student,
    noticings,
    strengths,
    concerns,
    total: noticings.length,
    lastSeenDays,
    needsYou: needsYouRule({
      recentConcerns,
      concerns,
      strengths,
      total: noticings.length,
      lastSeenDays,
    }),
    fading: lastSeenDays === null || lastSeenDays >= 42,
    nearlyInvisible: noticings.length <= 3,
  };
}


export function lastSeenLabel(days: number | null): string {
  if (days === null) return "never noticed";
  if (days === 0) return "seen today";
  if (days === 1) return "seen yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} ago`;
  return "over 2 years ago";
}

/** Localized variant — pass the t() from useT(). */
export function lastSeenLabelT(
  days: number | null,
  t: (key: string) => string,
): string {
  if (days === null) return t("ls_never");
  if (days === 0) return t("ls_today");
  if (days === 1) return t("ls_yesterday");
  if (days < 30) return fill(t("ls_days"), { n: days });
  const months = Math.round(days / 30);
  if (months < 24) return fill(t(months === 1 ? "ls_month" : "ls_months"), { n: months });
  return t("ls_over2y");
}

export type SortKey = "needs" | "fading" | "most" | "roll";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "needs", label: "Needs you" },
  { key: "fading", label: "Least seen" },
  { key: "most", label: "Most noticed" },
  { key: "roll", label: "Roll number" },
];

export function sortSummaries(rows: StudentSummary[], key: SortKey): StudentSummary[] {
  const out = [...rows];
  const seen = (r: StudentSummary) => r.lastSeenDays ?? 9999;
  switch (key) {
    case "needs":
      return out.sort(
        (a, b) =>
          Number(b.needsYou) - Number(a.needsYou) ||
          Number(b.fading) - Number(a.fading) ||
          seen(b) - seen(a),
      );
    case "fading":
      return out.sort((a, b) => seen(b) - seen(a) || a.total - b.total);
    case "most":
      return out.sort((a, b) => b.total - a.total || a.student.roll - b.student.roll);
    default:
      return out.sort((a, b) => a.student.roll - b.student.roll);
  }
}

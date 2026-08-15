/**
 * The observation summary — the only "export" Roshni produces.
 * Domain labels, support suggestions and the regional resource directory are
 * taken verbatim from reference/roshni-prototype.html.
 */

import { daysAgo, type Noticing } from "@/lib/roshni";

export type Domain = "social" | "affect" | "academic" | "engagement";

export const DOMAIN: Record<Domain, string> = {
  social: "Social & belonging",
  affect: "Emotional wellbeing",
  academic: "Learning & work",
  engagement: "Classroom engagement",
};

export const DOMAIN_ORDER: Domain[] = ["social", "affect", "academic", "engagement"];

export const SUPPORTS: Record<Domain, string[]> = {
  affect: [
    "Offer a brief, private one-to-one — invite, don’t interrogate. Let the child lead.",
    "Loop in the school counsellor or a trusted senior colleague.",
    "If there are signs of real distress, share a helpline gently — do not try to “handle” a crisis alone.",
    "Keep noticing: mood shifts are clearer over weeks than in one moment.",
  ],
  social: [
    "Try structured pairing or a small responsibility so belonging isn’t left to chance.",
    "Watch for exclusion or teasing at unstructured times (break, games, the walk home).",
    "A quiet check-in about friendships, without naming other children.",
    "Consider a peer buddy for the next few weeks.",
  ],
  academic: [
    "Check for a specific gap before assuming effort — a missed concept compounds fast.",
    "Short, attainable tasks to rebuild momentum; notice and name small wins.",
    "A calm parent conversation focused on support, not blame.",
    "Flag to learning-support if the dip is sustained.",
  ],
  engagement: [
    "Check the basics first — sleep, hunger, eyesight, a hard seat neighbour.",
    "Give a role or a reason to participate; a front seat sometimes helps.",
    "Small, frequent successes rather than one big task.",
    "Notice when engagement is highest and build from there.",
  ],
};

export interface Resource {
  t: string;
  name: string;
  detail: string;
  num: string;
}

export const REGION: { name: string; resources: Resource[] } = {
  name: "Karnataka, India",
  resources: [
    {
      t: "National",
      name: "Childline (child helpline)",
      detail: "24×7, free, for any child in distress",
      num: "1098",
    },
    {
      t: "National",
      name: "Tele-MANAS",
      detail: "National tele mental-health service, free, 20+ languages",
      num: "14416",
    },
    {
      t: "Karnataka",
      name: "Tele-MANAS — Karnataka cell",
      detail: "State tele mental-health support (via national line)",
      num: "14416",
    },
    {
      t: "Karnataka",
      name: "NIMHANS, Bengaluru",
      detail: "Dept. of Child & Adolescent Psychiatry — guidance & referral",
      num: "nimhans.ac.in",
    },
    {
      t: "School",
      name: "School counsellor / head teacher",
      detail: "First internal step for a sustained pattern",
      num: "—",
    },
    {
      t: "School",
      name: "Block / District education office",
      detail: "For sustained academic concern or attendance",
      num: "—",
    },
  ],
};

/** Which thresholds, if any, this record has crossed. Reasons are prototype-verbatim. */
export function thresholdReasons(notes: Noticing[], now = Date.now()): string[] {
  const live = notes.filter((n) => !n.retracted);
  const concerns = live.filter((n) => n.valence < 0);
  const strengths = live.filter((n) => n.valence > 0);
  const recentConcerns = concerns.filter((n) => daysAgo(n.created_at, now) <= 21).length;
  const lastSeen = live.length ? Math.min(...live.map((n) => daysAgo(n.created_at, now))) : null;

  const reasons: string[] = [];
  if (recentConcerns >= 3) reasons.push("A run of recent concern.");
  if (concerns.length >= 8 && concerns.length > strengths.length * 2)
    reasons.push("The record is heavily one-sided.");
  if (lastSeen !== null && lastSeen > 90) reasons.push("No entry for a long stretch.");
  if (live.length === 0) reasons.push("Almost nothing on record.");
  return reasons;
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

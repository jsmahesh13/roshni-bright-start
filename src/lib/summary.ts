/**
 * The observation summary — the only "export" Roshni produces.
 * Domain labels, support suggestions and the regional resource directory are
 * taken verbatim from reference/roshni-prototype.html.
 */

import { daysAgo, type Noticing } from "@/lib/roshni";

export type Domain = "social" | "affect" | "academic" | "engagement";

/** i18n keys — resolve with t() at render time. */
export const DOMAIN: Record<Domain, string> = {
  social: "d_social",
  affect: "d_affect",
  academic: "d_academic",
  engagement: "d_engagement",
};

export const DOMAIN_ORDER: Domain[] = ["social", "affect", "academic", "engagement"];

/** i18n keys — resolve with t() at render time. */
export const SUPPORTS: Record<Domain, string[]> = {
  affect: ["sup_affect_1", "sup_affect_2", "sup_affect_3", "sup_affect_4"],
  social: ["sup_social_1", "sup_social_2", "sup_social_3", "sup_social_4"],
  academic: ["sup_academic_1", "sup_academic_2", "sup_academic_3", "sup_academic_4"],
  engagement: [
    "sup_engagement_1",
    "sup_engagement_2",
    "sup_engagement_3",
    "sup_engagement_4",
  ],
};

export interface Resource {
  /** i18n key for the category tag */
  t: string;
  /** proper noun — never translated */
  name: string;
  /** i18n key for the descriptive line */
  detail: string;
  num: string;
}

/** name is an i18n key; resource names and numbers stay verbatim. */
export const REGION: { name: string; resources: Resource[] } = {
  name: "res_region_name",
  resources: [
    {
      t: "res_national",
      name: "Childline (child helpline)",
      detail: "res_childline_d",
      num: "1098",
    },
    {
      t: "res_national",
      name: "RBSK & DEIC",
      detail: "res_rbsk_d",
      num: "Local District Hospital (DEIC)",
    },
    {
      t: "res_national",
      name: "Tele-MANAS",
      detail: "res_telemanas_d",
      num: "14416",
    },
    {
      t: "res_karnataka",
      name: "Tele-MANAS — Karnataka cell",
      detail: "res_telemanas_ka_d",
      num: "14416",
    },
    {
      t: "res_karnataka",
      name: "NIMHANS, Bengaluru",
      detail: "res_nimhans_d",
      num: "+91 80 2699 5351",
    },
    {
      t: "res_karnataka",
      name: "Spastics Society of Karnataka",
      detail: "res_ssk_d",
      num: "+91 80 4074 5900",
    },
    {
      t: "res_national",
      name: "Ummeed Child Development Center",
      detail: "res_ummeed_d",
      num: "022-6552 8310",
    },
    {
      t: "res_school",
      name: "res_counsellor_n",
      detail: "res_counsellor_d",
      num: "—",
    },
    {
      t: "res_school",
      name: "res_office_n",
      detail: "res_office_d",
      num: "—",
    },
  ],
};

/** Which thresholds, if any, this record has crossed. Returns i18n keys. */
export function thresholdReasons(notes: Noticing[], now = Date.now()): string[] {
  const live = notes.filter((n) => !n.retracted);
  const concerns = live.filter((n) => n.valence < 0);
  const strengths = live.filter((n) => n.valence > 0);
  const recentConcerns = concerns.filter((n) => daysAgo(n.created_at, now) <= 21).length;
  const lastSeen = live.length ? Math.min(...live.map((n) => daysAgo(n.created_at, now))) : null;

  const reasons: string[] = [];
  if (recentConcerns >= 3) reasons.push("rs_run");
  if (concerns.length >= 8 && concerns.length > strengths.length * 2)
    reasons.push("rs_onesided");
  if (lastSeen !== null && lastSeen > 90) reasons.push("rs_gap");
  if (live.length === 0) reasons.push("rs_nothing");
  return reasons;
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

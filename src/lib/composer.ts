/**
 * The Notice composer's language rules — lifted verbatim from the Roshni prototype.
 *
 * Two jobs:
 *  1. turn messy typed text into separate, tagged noticings,
 *  2. refuse to save anything that is a label, a diagnosis, a theory about a
 *     home, an identity remark, or medical detail.
 *
 * Word matching is WHOLE WORD ONLY — "fat" must never flag "Fatima".
 */

import type { Facet, Student } from "@/lib/roshni";

export type BlockCategory = "clinical" | "character" | "home" | "identity" | "medical";

export const LEX: Record<BlockCategory, string[]> = {
  clinical: [
    "depressed", "depression", "adhd", "autistic", "autism", "bipolar", "trauma",
    "disorder", "anxiety disorder", "ocd", "dyslexic", "dyslexia", "mental illness",
    "psychotic",
  ],
  character: [
    "lazy", "stupid", "dumb", "slow", "naughty", "difficult child", "troublemaker",
    "loner", "arrogant", "useless", "hopeless", "bad kid", "liar", "rude child",
  ],
  home: [
    "broken home", "parents fight", "father drinks", "mother drinks", "divorce",
    "poor family", "no money at home", "father beats", "alcoholic",
  ],
  identity: [
    "caste", "muslim", "hindu", "christian", "dalit", "brahmin", "obese", "fat",
    "ugly", "dark-skinned",
  ],
  medical: [
    "medication", "tablets", "epilepsy", "diabetes", "asthma", "pills", "diagnosis",
    "doctor said", "therapist",
  ],
};

export const BLOCK_MSG: Record<BlockCategory, string> = {
  clinical: "Clinical language. Roshni does not hold diagnoses. Describe what you saw instead.",
  character: "That is a character label, not an observation. What did the child actually do, and when?",
  home: "A theory about the home. You may record what a child said to you, not what you imagine happens at home.",
  identity: "Caste, religion, community and appearance are never part of a pastoral record.",
  medical: "Health and medical detail is out of scope by design. That belongs with the school office.",
};

const FKEY: Record<Facet, string[]> = {
  strength: [
    "helped", "explained", "presented", "volunteered", "stayed back", "unprompted",
    "improved", "proud", "led", "organised", "organized", "won", "first to", "extra",
    "initiative", "comforted", "owned up",
  ],
  social: [
    "alone", "lunch", "friend", "argument", "fight", "group", "teased", "bullied",
    "left out", "picked", "break", "gate", "sat with", "included",
  ],
  academic: [
    "homework", "submit", "submitted", "essay", "marks", "test", "worksheet",
    "reading", "assignment", "project", "notebook", "textbook",
  ],
  affect: [
    "quiet", "tearful", "crying", "cried", "withdrawn", "agitated", "angry", "bright",
    "talkative", "upset", "anxious", "restless", "flat", "beaming", "snapped",
  ],
  action: [
    "i spoke", "spoke to", "called home", "moved her", "moved his", "moved him",
    "paired", "i sat", "told him", "told her", "i called", "met the", "quiet word",
    "emailed", "checked in",
  ],
  engagement: [
    "head down", "distracted", "asked", "questions", "attention", "participat",
    "listening", "engaged", "left the room", "not writing", "doodl", "redirected",
    "board",
  ],
};

function esc(x: string) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word (well, whole-token) containment test. */
export function wordHit(text: string, term: string): boolean {
  return new RegExp("(^|[^a-z])" + esc(term) + "([^a-z]|$)", "i").test(text);
}

export function detectFacet(x: string): Facet {
  const s = x.toLowerCase();
  let best: Facet = "engagement";
  let score = 0;
  (Object.keys(FKEY) as Facet[]).forEach((f) => {
    const c = FKEY[f].filter((k) => s.includes(k)).length;
    if (c > score) {
      score = c;
      best = f;
    }
  });
  return best;
}

export function detectValence(x: string, f: Facet): number {
  if (f === "strength") return 1;
  if (f === "action") return 0;
  const s = x.toLowerCase();
  const pos = [
    "improved", "better", "well", "good", "enjoyed", "bright", "talkative", "engaged",
    "volunteered", "helped", "early", "more", "beaming", "up from",
  ];
  return pos.some((k) => s.includes(k)) ? 1 : -1;
}

export function findStudent(x: string, students: Student[]): Student | null {
  for (const s of students) {
    if (wordHit(x, s.name.split(" ")[0]!)) return s;
  }
  return null;
}

export interface Hit {
  cat: BlockCategory;
  word: string;
}

export function scan(x: string): Hit[] {
  const hits: Hit[] = [];
  (Object.keys(LEX) as BlockCategory[]).forEach((cat) => {
    LEX[cat].forEach((w) => {
      if (wordHit(x, w)) hits.push({ cat, word: w });
    });
  });
  return hits;
}

export interface Draft {
  id: number;
  text: string;
  facet: Facet;
  valence: number;
  studentId: string | null;
  hits: Hit[];
  approved: boolean;
}

export function splitSentences(raw: string): string[] {
  return raw
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 4);
}

export function makeDrafts(raw: string, students: Student[]): Draft[] {
  return splitSentences(raw).map((text, i) => {
    const hits = scan(text);
    const st = findStudent(text, students);
    const facet = detectFacet(text);
    return {
      id: i,
      text,
      facet,
      valence: detectValence(text, facet),
      studentId: st?.id ?? null,
      hits,
      approved: hits.length === 0 && !!st,
    };
  });
}

export const EXAMPLE_TEXT =
  "Fatima was quiet all morning, one-word answers. Arjun sat alone at lunch again, third time this week. Kabir is being lazy about homework, hasn't submitted for two weeks. I spoke to Arjun after class for five minutes.";

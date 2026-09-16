/**
 * Voice attendance helpers.
 *
 * A teacher speaks only the names of the children who are away
 * ("Aarti and Suresh are absent today"). These pure functions turn that
 * sentence into a set of roster matches. Indian names are spelled and
 * pronounced many ways, so matching folds the usual variants (v/w, s/sh,
 * ee/i, doubled letters, aspirated consonants) before comparing, and a
 * small edit distance is still allowed on top.
 *
 * Nothing here decides anything on its own — the teacher always confirms the
 * roster before it is saved.
 */

import type { Student } from "@/lib/roshni";

export type AttendanceStatus = "present" | "absent";

/** Words that are never a child's name in an attendance sentence. */
const STOPWORDS = new Set([
  // English
  "absent", "present", "today", "is", "are", "was", "were", "not", "no",
  "the", "a", "an", "and", "also", "students", "student", "children", "child",
  "class", "sir", "madam", "miss", "please", "mark", "all", "rest", "of",
  "has", "have", "come", "came", "leave", "on", "missing", "away", "here",
  // Hindi (roman + script)
  "aaj", "nahi", "nahin", "hai", "hain", "aur", "gair", "gairhazir", "chutti",
  "आज", "नहीं", "है", "हैं", "और", "अनुपस्थित", "गैरहाजिर", "गैरहाज़िर", "छुट्टी", "उपस्थित",
  // Kannada (roman + script)
  "illa", "matthu", "mattu", "indu", "gairu", "gairuhajari", "hajaru",
  "ಇಲ್ಲ", "ಮತ್ತು", "ಇಂದು", "ಗೈರು", "ಗೈರುಹಾಜರಿ", "ಹಾಜರು", "ಹಾಜರಿ", "ಇದ್ದಾರೆ", "ಬಂದಿಲ್ಲ",
]);

/** Lowercase, strip accents and punctuation. */
function clean(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fold the spelling variants that make the same Indian name look different. */
export function foldName(s: string): string {
  let x = clean(s).replace(/\s+/g, "");
  x = x
    .replace(/ph/g, "f")
    .replace(/w/g, "v")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/bh/g, "b")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/jh/g, "j")
    .replace(/ee/g, "i")
    .replace(/ie/g, "i")
    .replace(/oo/g, "u")
    .replace(/ou/g, "u")
    .replace(/aa/g, "a")
    .replace(/y/g, "i")
    .replace(/z/g, "j")
    .replace(/ks/g, "x")
    .replace(/h/g, "")
    .replace(/(.)\1+/g, "$1");
  return x;
}

function distance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((cur[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[n] ?? Math.max(m, n);
}

/** How much slack a name of this length gets. */
function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/** Split a spoken sentence into the fragments that might be names. */
export function nameFragments(transcript: string): string[] {
  const parts = clean(transcript)
    .split(/\s+(?:and|aur|mattu|matthu)\s+|[,;.\n]+/u)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map((w) => w.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const w of parts) {
    if (STOPWORDS.has(w)) continue;
    if (w.length < 3) continue;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}

export interface MatchResult {
  /** Student ids heard as absent. */
  absentIds: string[];
  /** Fragments that sounded like a name but matched nobody in this class. */
  unmatched: string[];
  /** The fragment that led to each matched student, for the teacher to see. */
  matches: { student: Student; heard: string }[];
}

/** Match spoken fragments against exactly the students of one class. */
export function matchAbsentees(transcript: string, students: Student[]): MatchResult {
  const fragments = nameFragments(transcript);
  const absentIds: string[] = [];
  const matches: { student: Student; heard: string }[] = [];
  const unmatched: string[] = [];

  const roster = students.map((s) => {
    const parts = clean(s.name).split(" ").filter(Boolean);
    return {
      student: s,
      keys: [foldName(s.name), ...parts.map(foldName)].filter((k) => k.length > 1),
    };
  });

  for (const frag of fragments) {
    const f = foldName(frag);
    if (f.length < 2) continue;

    let best: { student: Student; score: number } | null = null;
    for (const entry of roster) {
      for (const key of entry.keys) {
        const d = distance(f, key);
        if (d > tolerance(Math.max(f.length, key.length))) continue;
        if (!best || d < best.score) best = { student: entry.student, score: d };
      }
    }

    if (!best) {
      unmatched.push(frag);
      continue;
    }
    if (!absentIds.includes(best.student.id)) {
      absentIds.push(best.student.id);
      matches.push({ student: best.student, heard: frag });
    }
  }

  return { absentIds, unmatched, matches };
}

/** Today's date in India, as YYYY-MM-DD. */
export function todayISO(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60_000);
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${ist.getFullYear()}-${m}-${d}`;
}

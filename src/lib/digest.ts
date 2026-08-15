/**
 * The weekly digest — questions, never findings.
 * Four patterns, wording taken from reference/roshni-prototype.html.
 */

import { DAY_MS, FACET_LABEL, daysAgo, type Noticing, type Student } from "@/lib/roshni";

export interface DigestItem {
  studentId: string;
  studentName: string;
  tag: string;
  question: string;
  evidence: string[];
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function buildDigest(
  students: Student[],
  noticings: Noticing[],
  now = Date.now(),
): DigestItem[] {
  const live = noticings.filter((n) => !n.retracted);
  const byStudent = new Map<string, Noticing[]>();
  for (const n of live) {
    const list = byStudent.get(n.student_id) ?? [];
    list.push(n);
    byStudent.set(n.student_id, list);
  }
  const notesFor = (id: string) => byStudent.get(id) ?? [];
  const daysSince = (id: string) => {
    const ns = notesFor(id);
    if (!ns.length) return 9999;
    return Math.min(...ns.map((n) => daysAgo(n.created_at, now)));
  };

  const items: DigestItem[] = [];

  // 1 — the quiet one
  const quiet = students
    .map((s) => ({ s, d: daysSince(s.id), n: notesFor(s.id).length }))
    .filter((q) => q.d > 42)
    .sort((a, b) => b.d - a.d)[0];
  if (quiet) {
    items.push({
      studentId: quiet.s.id,
      studentName: quiet.s.name,
      tag: "The quiet one",
      question: `You haven't written anything about ${quiet.s.name} in ${
        quiet.d > 900 ? "this record at all" : `${quiet.d} days`
      }. Is that because there's nothing to say, or because they're easy to miss?`,
      evidence: [
        `${quiet.n} noticing${quiet.n === 1 ? "" : "s"} in total, against a class median of ${median(
          students.map((s) => notesFor(s.id).length),
        )}.`,
        "Roshni has no opinion about this child. It only knows the page is thin.",
      ],
    });
  }

  // 2 — lopsided
  const lop = students
    .map((s) => {
      const ns = notesFor(s.id);
      const c = ns.filter((n) => n.valence < 0).length;
      const st = ns.filter((n) => n.valence > 0).length;
      return { s, c, st, total: ns.length, ratio: ns.length ? c / ns.length : 0 };
    })
    .filter((o) => o.total >= 8 && o.ratio > 0.7)
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (lop) {
    items.push({
      studentId: lop.s.id,
      studentName: lop.s.name,
      tag: "Lopsided",
      question: `${lop.s.name}'s record is ${Math.round(
        lop.ratio * 100,
      )}% concern. When did anyone last write down something they did well?`,
      evidence: [
        `${lop.c} concerns against ${lop.st} strengths across ${lop.total} noticings.`,
        "This is an observation about the record, not the child.",
      ],
    });
  }

  // 3 — a cluster
  const recentWindow = now - 21 * DAY_MS;
  const cluster = students
    .map((s) => ({
      s,
      ns: notesFor(s.id).filter(
        (n) => new Date(n.created_at).getTime() > recentWindow && n.valence < 0,
      ),
    }))
    .filter((o) => o.ns.length >= 3)
    .sort((a, b) => b.ns.length - a.ns.length)[0];
  if (cluster) {
    const facets = [...new Set(cluster.ns.map((n) => FACET_LABEL[n.facet].toLowerCase()))];
    items.push({
      studentId: cluster.s.id,
      studentName: cluster.s.name,
      tag: "A cluster",
      question: `Three weeks, ${cluster.ns.length} concerns for ${cluster.s.name}, across ${facets.join(
        " and ",
      )}. Is this a stretch of bad weeks or a change of direction?`,
      evidence: cluster.ns
        .slice()
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 4)
        .map((n) => `${dayMonth(n.created_at)} — ${n.text}`),
    });
  }

  // 4 — worth sending
  const shine = students
    .map((s) => ({
      s,
      ns: notesFor(s.id).filter(
        (n) => new Date(n.created_at).getTime() > recentWindow && n.valence > 0,
      ),
    }))
    .filter((o) => o.ns.length >= 2)
    .sort((a, b) => b.ns.length - a.ns.length)[0];
  if (shine) {
    items.push({
      studentId: shine.s.id,
      studentName: shine.s.name,
      tag: "Worth sending",
      question: `${shine.s.name} has had ${shine.ns.length} good weeks in a row that nobody outside this room knows about. Worth a note home?`,
      evidence: shine.ns
        .slice()
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 3)
        .map((n) => `${dayMonth(n.created_at)} — ${n.text}`),
    });
  }

  return items.slice(0, 4);
}

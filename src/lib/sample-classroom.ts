/**
 * A static, invented classroom used by the "See how it works" preview.
 *
 * Nothing here touches the database: no real school's data can leak through
 * this route, and no public read policy exists on the real tables. Every
 * child and every line below is fictional.
 */

import type { Noticing, Student } from "@/lib/roshni";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const SAMPLE_CLASS = { id: "sample-6b", name: "6B", grade: "6", section: "B" };

export const SAMPLE_STUDENTS: Student[] = [
  { id: "s1", class_id: SAMPLE_CLASS.id, name: "Aarti Kulkarni", roll: 3, grade: "6", section: "B" },
  { id: "s2", class_id: SAMPLE_CLASS.id, name: "Suresh Patil", roll: 7, grade: "6", section: "B" },
  { id: "s3", class_id: SAMPLE_CLASS.id, name: "Nandini Shetty", roll: 12, grade: "6", section: "B" },
  { id: "s4", class_id: SAMPLE_CLASS.id, name: "Imran Bagewadi", roll: 18, grade: "6", section: "B" },
  { id: "s5", class_id: SAMPLE_CLASS.id, name: "Kavya Hегde".replace("е", "e"), roll: 21, grade: "6", section: "B" },
];

interface SampleNoticing extends Noticing {
  student_id: string;
}

export const SAMPLE_NOTICINGS: SampleNoticing[] = [
  { id: "n1", student_id: "s1", author_id: "sample", facet: "academic", valence: 1, text: "Finished the fractions worksheet before the bell and helped the girl beside her.", retracted: false, created_at: daysAgo(2) },
  { id: "n2", student_id: "s1", author_id: "sample", facet: "strength", valence: 1, text: "Led the morning assembly reading without being asked twice.", retracted: false, created_at: daysAgo(11) },
  { id: "n3", student_id: "s2", author_id: "sample", facet: "engagement", valence: -1, text: "Head on the desk for most of second period again.", retracted: false, created_at: daysAgo(1) },
  { id: "n4", student_id: "s2", author_id: "sample", facet: "academic", valence: -1, text: "Homework not brought for the third day this week.", retracted: false, created_at: daysAgo(4) },
  { id: "n5", student_id: "s2", author_id: "sample", facet: "emotion", valence: -1, text: "Went very quiet when the class talked about the sports day fees.", retracted: false, created_at: daysAgo(9) },
  { id: "n6", student_id: "s3", author_id: "sample", facet: "social", valence: 1, text: "Sat with the new boy at lunch and showed him where the water tap is.", retracted: false, created_at: daysAgo(6) },
  { id: "n7", student_id: "s4", author_id: "sample", facet: "engagement", valence: 0, text: "Answered when called on, did not put his hand up all week.", retracted: false, created_at: daysAgo(40) },
  { id: "n8", student_id: "s5", author_id: "sample", facet: "strength", valence: 1, text: "Drew the water cycle on the board for the whole class.", retracted: false, created_at: daysAgo(14) },
  { id: "n9", student_id: "s5", author_id: "sample", facet: "social", valence: 1, text: "Settled an argument in the back row on her own.", retracted: false, created_at: daysAgo(21) },
  { id: "n10", student_id: "s1", author_id: "sample", facet: "engagement", valence: 1, text: "Asked a question about why the moon changes shape.", retracted: false, created_at: daysAgo(27) },
  { id: "n11", student_id: "s3", author_id: "sample", facet: "academic", valence: 1, text: "Read a full paragraph aloud in Kannada, slowly but all of it.", retracted: false, created_at: daysAgo(17) },
  { id: "n12", student_id: "s2", author_id: "sample", facet: "action", valence: 0, text: "Spoke to his elder sister at the gate about the missed mornings.", retracted: false, created_at: daysAgo(3) },
];

export const SAMPLE_ATTENDANCE: { student_id: string; date: string; status: "present" | "absent" }[] =
  Array.from({ length: 5 }).flatMap((_, dayIdx) =>
    SAMPLE_STUDENTS.map((s) => ({
      student_id: s.id,
      date: daysAgo(dayIdx + 1).slice(0, 10),
      status: (s.id === "s2" && dayIdx < 2 ? "absent" : "present") as "present" | "absent",
    })),
  );

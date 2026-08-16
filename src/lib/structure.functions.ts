import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI-assisted noticing structuring — a second pair of eyes on top of the
 * always-on deterministic word list in composer.ts, never a replacement
 * for it. See composer.ts's draftsFromAISegments: every segment this
 * returns still goes through the local scan() before a teacher can
 * approve it, so this function's output is never trusted on its own.
 *
 * Endpoint contract note: only /v1/audio/transcriptions on Lovable's AI
 * gateway is confirmed live (used by transcribeNoticing). The text
 * endpoint/model below follow the same OpenAI-compatible convention but
 * haven't been smoke-tested against a live LOVABLE_API_KEY — if the
 * gateway's actual contract differs, every failure mode here already
 * degrades to reason:"failed" and the caller falls back to the regex
 * path, so a contract mismatch fails safe rather than breaking the
 * composer.
 */

const StudentRefSchema = z.string().regex(/^S\d+$/);

const AIFlagSchema = z.object({
  category: z.enum(["clinical", "character", "home", "identity", "medical"]),
  phrase: z.string().min(1).max(120),
});

const AISegmentSchema = z.object({
  text: z.string().min(1).max(400),
  facet: z.enum(["engagement", "social", "academic", "affect", "strength", "action"]),
  valence: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  studentRef: StudentRefSchema.nullable(),
  aiFlags: z.array(AIFlagSchema).max(5).default([]),
});

const AIResponseSchema = z.object({
  segments: z.array(AISegmentSchema).max(25),
});

const InputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  lang: z.enum(["en", "hi", "kn"]).default("en"),
  students: z
    .array(z.object({ ref: StudentRefSchema, firstName: z.string().min(1).max(60) }))
    .max(80),
});

export type AISegment = z.infer<typeof AISegmentSchema>;

export type StructureResult =
  | { ok: true; segments: AISegment[] }
  | { ok: false; reason: "unconfigured" | "busy" | "credits" | "failed" | "timeout" };

const SYSTEM_PROMPT = `You are a text-structuring assistant embedded in Roshni, a pastoral record-keeping tool for teachers at Indian government schools.

TASK
The teacher has typed a messy, free-text note about one or more students. Split it into short, separate "noticings" — one per distinct observation — and classify each one. Do not summarize, do not add information, do not infer anything the text does not literally say.

STRICT RULES
1. Every noticing's \`text\` field must be copied or lightly cleaned up (spelling and punctuation only) from the teacher's original words. Never invent details, causes, explanations, or context not present in the source text.
2. If a sentence contains no clear observation about a specific student's behaviour, engagement, or classroom action, drop it — do not force it into a bucket.
3. Never rephrase an observation into clinical, diagnostic, or judgemental language, even if you think it would be "more accurate."
4. You are a second pair of eyes for extra safety, not the primary filter. A separate, deterministic word-list check ALWAYS also runs on your output and can override you. Your job is to try to catch things a fixed word list would miss (paraphrased or indirect versions of the categories below) — not to guarantee blocking on your own.

FACETS — classify each noticing into exactly one:
- engagement: attention, participation, focus in class
  e.g. "kept looking out of the window", "put his hand up three times today", "left his seat during the lesson"
- social: peer relationships, friendships, group dynamics
  e.g. "sat alone at lunch again", "was left out of the game at break", "shared her tiffin with a new student"
- academic: schoolwork, homework, tests, assignments
  e.g. "did not submit the worksheet", "scored well on the spelling test", "read aloud fluently for the first time"
- affect: visible emotional state
  e.g. "was tearful before recess", "seemed unusually bright and talkative today", "snapped at a classmate"
- strength: something the student did well or proactively
  e.g. "helped a classmate tie her shoes", "volunteered to read first", "stayed back to finish the display board"
- action: something the TEACHER did in response
  e.g. "I spoke to him after class", "I called home to update the parent", "I paired her with a buddy for the group task"

VALENCE — exactly one of 1 (strength/positive), 0 (neutral/informational), -1 (concern).
- facet "strength" is always valence 1.
- facet "action" is always valence 0.
- otherwise: clearly positive development or moment -> 1; a worry, difficulty, or setback -> -1; genuinely neutral factual note -> 0.

STUDENT MATCHING
You will be given a roster of this class's students as {ref, firstName} pairs. For each noticing, if the text clearly names a roster student, return that student's \`ref\` string exactly as given. If no roster student is clearly named, return null. Never invent a ref you were not given.

SAFETY FLAGS (aiFlags)
Independently of facet/valence, flag any phrase in each noticing that falls into one of these categories — including indirect or paraphrased versions, not just exact keyword matches:
- clinical: a diagnosis, clinical/psychiatric term, or theory about a medical or psychological condition. e.g. "seems ADHD", "must have a disorder", "acts like she's on the spectrum"
- character: a fixed personality label or judgement about who the child IS rather than what they did. e.g. "he's just lazy", "a difficult child", "such a liar"
- home: a claim or theory about the child's home or family life. e.g. "his parents must be fighting", "sounds like a poor household", "no one looks after her at home"
- identity: caste, religion, community, or appearance/body. e.g. "typical [caste] behaviour", "she's a bit heavy", "his dark skin"
- medical: health or medical detail. e.g. "on medication for something", "has a doctor's note", "diabetic"
For each flagged phrase, return the shortest exact substring of that noticing's own \`text\` that triggered it (never invented text), plus its category. If nothing qualifies, return an empty list.

OUTPUT FORMAT
Return ONLY a single JSON object, no prose, no markdown fences, matching exactly:
{
  "segments": [
    {
      "text": string,
      "facet": "engagement" | "social" | "academic" | "affect" | "strength" | "action",
      "valence": -1 | 0 | 1,
      "studentRef": string | null,
      "aiFlags": [ { "category": "clinical" | "character" | "home" | "identity" | "medical", "phrase": string } ]
    }
  ]
}
Produce at most 25 segments. If there are no usable observations, return {"segments": []}.`;

export const structureNoticing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<StructureResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, reason: "unconfigured" };

    const roster = data.students.map((s) => `${s.ref}: ${s.firstName}`).join("\n");
    const userMessage = `Roster:\n${roster || "(no students in scope)"}\n\nTeacher's note (raw, possibly code-mixed English/Hindi/Kannada):\n"""\n${data.text}\n"""`;

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
      });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "TimeoutError";
      console.error("structure request failed", e);
      return { ok: false, reason: timedOut ? "timeout" : "failed" };
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("structure request failed", res.status, detail.slice(0, 500));
      if (res.status === 429) return { ok: false, reason: "busy" };
      if (res.status === 402) return { ok: false, reason: "credits" };
      return { ok: false, reason: "failed" };
    }

    try {
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") return { ok: false, reason: "failed" };
      const parsed = AIResponseSchema.parse(JSON.parse(content));
      // Never trust a ref the caller didn't actually send this round.
      const validRefs = new Set(data.students.map((s) => s.ref));
      const segments = parsed.segments.map((seg) => ({
        ...seg,
        studentRef: seg.studentRef && validRefs.has(seg.studentRef) ? seg.studentRef : null,
      }));
      return { ok: true, segments };
    } catch (e) {
      console.error("structure response malformed", e);
      return { ok: false, reason: "failed" };
    }
  });

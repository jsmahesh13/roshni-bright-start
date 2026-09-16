import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verify a school code before sign-up. Runs server-side only: the client
 * submits one code and gets back that school's name and its existing
 * grade/section list, never a list of schools or codes.
 */
export const lookupSchoolByCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin.rpc("verify_school_code", {
      p_code: data.code.trim(),
    });
    if (error || !rows || rows.length === 0) return { found: false as const };

    const first = rows[0]!;
    return {
      found: true as const,
      school: { id: first.school_id, name: first.school_name },
      classes: rows
        .filter((r) => r.class_id)
        .map((r) => ({
          id: r.class_id as string,
          grade: r.grade as string,
          section: r.section as string,
          name: `${r.grade}${r.section}`,
        })),
    };
  });

/**
 * Finish signup for the currently signed-in user: verify the code again
 * server-side, resolve (or create) their grade+section class inside that
 * school, and create their teacher profile. Never grants admin.
 */
export const completeTeacherSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(1).max(80),
        code: z.string().trim().min(1).max(64),
        grade: z.string().trim().max(16).optional().default(""),
        section: z.string().trim().max(8).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin.rpc("verify_school_code", {
      p_code: data.code.trim(),
    });
    if (!rows || rows.length === 0) {
      return { ok: false as const, reason: "badcode" as const };
    }
    const schoolId = rows[0]!.school_id as string;

    let classId: string | null = null;
    const grade = data.grade.trim();
    const section = data.section.trim().toUpperCase();

    if (grade && section) {
      const existing = rows.find(
        (r) =>
          (r.grade ?? "").trim() === grade &&
          (r.section ?? "").trim().toUpperCase() === section,
      );
      if (existing?.class_id) {
        classId = existing.class_id as string;
      } else {
        const { data: created } = await supabaseAdmin
          .from("classes")
          .insert({ name: `${grade}${section}`, school_id: schoolId, grade, section })
          .select("id")
          .maybeSingle();
        classId = created?.id ?? null;
      }
    }

    // Never overwrite an existing profile's school/class or an admin's role.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();

    if (existingProfile) {
      return { ok: true as const, schoolId, classId, existed: true };
    }

    const { error } = await supabaseAdmin.from("profiles").insert({
      id: context.userId,
      name: data.fullName.trim(),
      email: (context.claims as { email?: string }).email ?? null,
      role: "teacher",
      school_id: schoolId,
      class_id: classId,
      grade: grade || null,
      section: section || null,
    });
    if (error) return { ok: false as const, reason: "profile" as const };

    return { ok: true as const, schoolId, classId, existed: false };
  });

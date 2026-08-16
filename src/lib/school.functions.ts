import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Verify a school join code before sign-up. Runs server-side only: the client
 * submits one code and gets back that school's name and classes, never a list
 * of schools or codes.
 */
export const lookupSchoolByCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: schools } = await supabaseAdmin
      .from("schools")
      .select("id, name, join_code");

    const match = (schools ?? []).find(
      (s) => s.join_code.trim().toLowerCase() === data.code.trim().toLowerCase(),
    );
    if (!match) return { found: false as const };

    const { data: classes } = await supabaseAdmin
      .from("classes")
      .select("id, name")
      .eq("school_id", match.id)
      .order("name");

    return {
      found: true as const,
      school: { id: match.id, name: match.name },
      classes: (classes ?? []).map((c) => ({ id: c.id, name: c.name })),
    };
  });

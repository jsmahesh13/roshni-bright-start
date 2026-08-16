import { createServerFn } from "@tanstack/react-start";

import { DEMO_STAFF } from "./demo-staff";

/**
 * Idempotently create the seeded demo staff accounts and their profiles.
 * Safe to call from the public sign-in screen: it never returns credentials
 * and never touches student data.
 */
export const ensureDemoStaff = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: classes } = await supabaseAdmin.from("classes").select("id, name");
  const classIdByName = new Map((classes ?? []).map((c) => [c.name, c.id]));

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const idByEmail = new Map(
    (existingUsers?.users ?? []).map((u) => [(u.email ?? "").toLowerCase(), u.id]),
  );

  for (const staff of DEMO_STAFF) {
    let userId = idByEmail.get(staff.email);

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: staff.email,
        password: staff.password,
        email_confirm: true,
        user_metadata: { name: staff.name },
      });
      if (error || !created?.user) continue;
      userId = created.user.id;
    }

    // Insert only. Never upsert: a returning staff member's own profile
    // (and therefore their class scope and their noticings) must never be
    // rewritten by the demo seed on a later sign-in.
    await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        class_id: staff.className ? (classIdByName.get(staff.className) ?? null) : null,
      })
      .select("id")
      .maybeSingle();

  }

  return { ok: true };
});

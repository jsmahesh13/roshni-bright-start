import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

const USERNAME_DOMAIN = "teachers.roshniapp.in";
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

type FnContext = { supabase: any; userId: string; claims?: Record<string, any> };

/** Read-only impersonation sessions may not write anything, anywhere. */
async function assertWritable(context: FnContext) {
  const { data } = await context.supabase.rpc("is_acting_readonly");
  if (data === true) throw new Error("Read-only view: changes are disabled.");
}

async function requireSuperAdmin(context: FnContext) {
  await assertWritable(context);
  const { data } = await context.supabase.rpc("is_super_admin");
  if (data !== true) throw new Error("Forbidden");
}

/** School admin (scoped to their own school) or the platform owner. */
async function requireSchoolAdminOrOwner(context: FnContext) {
  await assertWritable(context);
  const { data: p } = await context.supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", context.userId)
    .maybeSingle();
  if (p?.role === "admin" && p.school_id) {
    return { owner: false as const, schoolId: p.school_id as string };
  }
  const { data: sa } = await context.supabase.rpc("is_super_admin");
  if (sa !== true) throw new Error("Forbidden");
  return { owner: true as const, schoolId: null as string | null };
}

async function audit(
  admin: any,
  actorId: string,
  actorRole: string,
  action: string,
  entityType: string | null,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  await admin.from("audit_log").insert({
    actor_id: actorId,
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

const ARCHIVABLE: Record<string, { table: string; schoolColumn: "id" | "school_id" }> = {
  school: { table: "schools", schoolColumn: "id" },
  class: { table: "classes", schoolColumn: "school_id" },
  student: { table: "students", schoolColumn: "school_id" },
  teacher: { table: "profiles", schoolColumn: "school_id" },
};

async function loadSchoolIdOf(admin: any, entityType: string, entityId: string) {
  const cfg = ARCHIVABLE[entityType]!;
  const { data: row } = await admin
    .from(cfg.table)
    .select(cfg.schoolColumn === "id" ? "id" : "school_id")
    .eq("id", entityId)
    .maybeSingle();
  if (!row) throw new Error("Not found");
  return cfg.schoolColumn === "id" ? (row.id as string) : (row.school_id as string);
}

export const createSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        code: z
          .string()
          .trim()
          .min(4)
          .max(32)
          .regex(/^[A-Za-z0-9-]+$/, "letters, numbers and dashes only"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context as FnContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: school, error } = await supabaseAdmin
      .from("schools")
      .insert({ name: data.name, code, join_code: code })
      .select("id, name, code")
      .single();
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "super_admin", "create_school", "school", school.id, {
      name: school.name,
      code,
    });
    return school;
  });

export const createSchoolAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        schoolId: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        email: z.string().trim().email().max(120),
        password: z.string().min(8).max(72),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context as FnContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !created.user) throw new Error(authError?.message ?? "Could not create account");
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      name: data.name,
      email: data.email,
      role: "admin",
      school_id: data.schoolId,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileError.message);
    }
    await audit(supabaseAdmin, context.userId, "super_admin", "create_admin", "teacher", created.user.id, {
      name: data.name,
      email: data.email,
      school_id: data.schoolId,
    });
    return { id: created.user.id };
  });

export const createTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        identifier: z.string().trim().min(3).max(120),
        password: z.string().min(8).max(72),
        schoolId: z.string().uuid().optional(),
        classId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const caller = await requireSchoolAdminOrOwner(context as FnContext);
    const schoolId = caller.owner ? data.schoolId : caller.schoolId;
    if (!schoolId) throw new Error("A school is required");
    if (caller.owner === false && data.schoolId && data.schoolId !== caller.schoolId) {
      throw new Error("Forbidden");
    }

    let email: string;
    let username: string | null = null;
    if (data.identifier.includes("@")) {
      email = data.identifier.trim().toLowerCase();
    } else {
      username = data.identifier.trim().toLowerCase();
      if (!USERNAME_RE.test(username)) {
        throw new Error("Username: 3–32 characters, letters, numbers, dot, dash, underscore");
      }
      email = `${username}@${USERNAME_DOMAIN}`;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !created.user) throw new Error(authError?.message ?? "Could not create account");
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      name: data.name,
      email: username ? null : email,
      username,
      role: "teacher",
      school_id: schoolId,
      class_id: data.classId ?? null,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      if (profileError.message.includes("profiles_username_unique")) {
        throw new Error("That username is taken");
      }
      throw new Error(profileError.message);
    }
    await audit(
      supabaseAdmin,
      context.userId,
      caller.owner ? "super_admin" : "admin",
      "create_teacher",
      "teacher",
      created.user.id,
      { name: data.name, username, email: username ? null : email, school_id: schoolId },
    );
    return { id: created.user.id, username };
  });

const archiveInput = (data: unknown) =>
  z
    .object({
      entityType: z.enum(["school", "class", "student", "teacher"]),
      entityId: z.string().uuid(),
    })
    .parse(data);

async function setArchived(
  context: FnContext,
  input: { entityType: string; entityId: string },
  archived: boolean,
) {
  const caller = await requireSchoolAdminOrOwner(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const schoolId = await loadSchoolIdOf(supabaseAdmin, input.entityType, input.entityId);
  if (!caller.owner && schoolId !== caller.schoolId) throw new Error("Forbidden");
  if (input.entityType === "school" && !caller.owner) throw new Error("Forbidden");
  const cfg = ARCHIVABLE[input.entityType]!;
  const { error } = await supabaseAdmin
    .from(cfg.table)
    .update(
      archived
        ? { archived_at: new Date().toISOString(), archived_by: context.userId }
        : { archived_at: null, archived_by: null },
    )
    .eq("id", input.entityId);
  if (error) throw new Error(error.message);
  await audit(
    supabaseAdmin,
    context.userId,
    caller.owner ? "super_admin" : "admin",
    archived ? "archive" : "restore",
    input.entityType,
    input.entityId,
  );
  return { ok: true as const };
}

export const archiveEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(archiveInput)
  .handler(async ({ data, context }) => setArchived(context as FnContext, data, true));

export const restoreEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(archiveInput)
  .handler(async ({ data, context }) => setArchived(context as FnContext, data, false));

export const resetTeacherPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ teacherId: z.string().uuid(), newPassword: z.string().min(8).max(72) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const caller = await requireSchoolAdminOrOwner(context as FnContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const schoolId = await loadSchoolIdOf(supabaseAdmin, "teacher", data.teacherId);
    if (!caller.owner && schoolId !== caller.schoolId) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.teacherId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    await audit(
      supabaseAdmin,
      context.userId,
      caller.owner ? "super_admin" : "admin",
      "reset_password",
      "teacher",
      data.teacherId,
    );
    return { ok: true as const };
  });

export const startImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ teacherId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context as FnContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: teacher } = await supabaseAdmin
      .from("profiles")
      .select("id, name")
      .eq("id", data.teacherId)
      .maybeSingle();
    if (!teacher) throw new Error("Not found");
    const { data: authUser, error: getError } = await supabaseAdmin.auth.admin.getUserById(data.teacherId);
    if (getError || !authUser.user?.email) throw new Error("That account cannot be viewed");
    const email = authUser.user.email;
    const { error: flagError } = await supabaseAdmin.auth.admin.updateUserById(data.teacherId, {
      app_metadata: { ...authUser.user.app_metadata, acting_readonly: true },
    });
    if (flagError) throw new Error(flagError.message);
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkError || !link.properties?.hashed_token) {
      await supabaseAdmin.auth.admin.updateUserById(data.teacherId, {
        app_metadata: { ...authUser.user.app_metadata, acting_readonly: false },
      });
      throw new Error(linkError?.message ?? "Could not open the view");
    }
    await audit(supabaseAdmin, context.userId, "super_admin", "impersonate_view", "teacher", data.teacherId, {
      teacher_name: teacher.name,
      teacher_email: email,
    });
    return { hashedToken: link.properties.hashed_token, teacherName: teacher.name };
  });

export const endImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ teacherId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context as FnContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.teacherId);
    await supabaseAdmin.auth.admin.updateUserById(data.teacherId, {
      app_metadata: { ...(authUser.user?.app_metadata ?? {}), acting_readonly: false },
    });
    return { ok: true as const };
  });

/** Fail-safe: any signed-in user can clear a stale read-only flag on their own account. */
export const clearOwnReadonlyFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (authUser.user?.app_metadata?.acting_readonly === true) {
      await supabaseAdmin.auth.admin.updateUserById(context.userId, {
        app_metadata: { ...authUser.user.app_metadata, acting_readonly: false },
      });
    }
    return { ok: true as const };
  });

/** Public: resolve a teacher username to its sign-in identity. Generic failure, no enumeration. */
export const resolveUsername = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ username: z.string().trim().min(3).max(32) }).parse(data),
  )
  .handler(async ({ data }) => {
    const username = data.username.trim().toLowerCase();
    if (!USERNAME_RE.test(username)) return { found: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id, archived_at")
      .ilike("username", username)
      .maybeSingle();
    if (!row || row.archived_at) return { found: false as const };
    return { found: true as const, email: `${username}@${USERNAME_DOMAIN}` };
  });

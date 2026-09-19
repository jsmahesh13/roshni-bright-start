# Two-tier admin console for Roshni

A platform-owner console above the existing school+class model, plus a principal panel per school. Everything is additive: no drops, no renames, no hard deletes.

One deviation from the brief, on purpose: this app has no Supabase Edge Functions — all privileged work runs through TanStack server functions (`src/lib/*.functions.ts`) with the service-role client, exactly like the existing signup flow. Same security model, same verification duty, one less moving part.

## Roles

| Role | Scope |
|---|---|
| `super_admin` | Only jsmahesh.iitb@gmail.com. All schools, all data. Create schools + admins, archive/restore, read-only "log in as". |
| `admin` (school admin / principal) | Existing role, unchanged in name. Their own school only: teachers, classes, students, join code. |
| `teacher` | Unchanged. Own class. Can now sign in with username **or** email. |

**Fail-closed super_admin designation.** A `platform_owners` table holding one row (the email). `is_super_admin()` is SECURITY DEFINER and returns true only when the caller's `auth.users.email`, lowercased, matches a row there **and** the user is email-confirmed. No self-service path writes to that table — it is seeded by the migration and has no INSERT/UPDATE/DELETE policy at all, so even the service role must go through a migration to change it. If the table is empty, every check returns false.

## Phase 1 — SQL migration (additive, idempotent)

1. `platform_owners(email citext primary key, created_at)`; seed the one email. RLS on, zero policies (helper reads it as SECURITY DEFINER).
2. Archive columns on `schools`, `classes`, `students`, `profiles`: `archived_at timestamptz null`, `archived_by uuid null references profiles(id)`. Nullable by nature — no backfill needed, `NULL` means live.
3. `audit_log(id, actor_id uuid, actor_role text, action text check in ('archive','restore','create_school','create_admin','create_teacher','impersonate_view'), entity_type text, entity_id uuid, details jsonb default '{}', created_at timestamptz default now())`. Insert-only; no UPDATE/DELETE policy.
4. `profiles.username citext null` + partial unique index `where username is not null`. Existing rows stay null.
5. Helpers (SECURITY DEFINER, `search_path = public`, EXECUTE revoked from anon/public per existing hardening): `is_super_admin()`, `is_acting_readonly()` (reads the JWT claim, below).
6. Indexes on `archived_at` for the four tables and on `audit_log(created_at desc)`.
7. Verification block at the end: counts of students/noticings/attendance/profiles before and after must match, and no row may gain an unexpected null; `RAISE EXCEPTION` aborts the whole migration otherwise.

No NOT NULL flips are needed this time — every new column is legitimately nullable — so the migration is reversible in practice.

## Phase 2 — RLS

Every existing policy keeps its current expression and gains two modifiers:

```
USING (
  archived_at IS NULL
  AND ( <existing school+class expression> )
  OR public.is_super_admin()          -- read across schools
)
```

For write policies:

```
WITH CHECK (
  NOT public.is_acting_readonly()
  AND ( <existing expression> OR public.is_super_admin() )
)
```

Points that matter:

- `is_super_admin()` is OR-ed in, never replacing the scoped clause, so a teacher's or principal's reach is byte-for-byte what it is today.
- Archived rows drop out of every normal read. Super-admin reads ignore `archived_at` (the archive views need them) — that is the only place archived rows surface.
- `noticings` and `attendance` keep their author/marked_by checks on top; super_admin gets read-only there by design (its writes are additionally blocked by the read-only claim whenever impersonating, and the console never writes noticings).
- `audit_log`: SELECT for super_admin only; INSERT via server functions with service role.
- GRANTs for every new table (`authenticated` SELECT where a policy allows it, `service_role` ALL).

## Phase 3 — Server functions (service role, caller verified first)

New `src/lib/admin.functions.ts`, all with `.middleware([requireSupabaseAuth])`, all Zod-validated, each one re-checking authority against `context.supabase` (the caller's own RLS-scoped client) **before** importing `supabaseAdmin`:

- `createSchool` — super_admin only. School + code + first classes.
- `createSchoolAdmin` — super_admin only. `auth.admin.createUser` (email + password, confirmed) then the `admin` profile in that school.
- `createTeacher` — super_admin, or `admin` for their **own** school (school_id taken from the caller's profile, never from the request body). Accepts email **or** username.
- `archiveEntity` / `restoreEntity` — sets/clears `archived_at` + `archived_by`; super_admin anywhere, `admin` within their school; writes an audit row.
- `startImpersonation` — super_admin only; writes the `impersonate_view` audit row and returns the read-only view token.
- `resolveUsername` — public, rate-limited by input shape: username → the internal auth email. Returns a generic failure for unknown usernames so it can't be used to enumerate accounts.

Every one of these writes an `audit_log` row before returning.

## Phase 4 — Username login

At creation, a teacher without an email gets a synthetic auth identity: `<username>@teachers.roshniapp.in`, stored on `auth.users` and mirrored in `profiles.username`; `profiles.email` stays null so the UI never shows a fake address. The domain has no MX record and is reserved, so it can never collide with a real address or receive mail. Sign-in: if the entered identifier has no `@`, the client calls `resolveUsername` and then does the normal `signInWithPassword` with the resolved address. Password verification stays entirely inside Supabase Auth — nothing custom.

Password reset for username accounts is not possible by email; the principal or super admin resets it from the console (a `resetTeacherPassword` server function, same authority check).

## Phase 5 — Read-only impersonation

- Super admin picks a teacher → `startImpersonation` verifies, audits, and mints a short-lived (15 min) session for that teacher **with an extra app metadata claim** `acting_readonly: true`.
- `is_acting_readonly()` reads that claim from the JWT. Every INSERT/UPDATE policy on `noticings`, `attendance`, `students`, `badges`, `profiles`, `classes` and `schools` carries `NOT public.is_acting_readonly()` in its `WITH CHECK`. The database refuses the write even if the UI is bypassed entirely.
- Server functions add the same guard at the top, so RPC paths are covered too.
- The app shows a persistent amber banner: "Viewing as Meena Rao — read only. Exit." Exiting restores the super admin's own session.

## Phase 6 — Frontend

New routes, all inside the existing `_authenticated` gate plus a role check in `beforeLoad` that redirects non-owners to `/this-week`:

| Route | Contents |
|---|---|
| `src/routes/_authenticated/admin/route.tsx` | Gate + admin shell (cream/gold, Caveat headings — same tokens as today) |
| `.../admin/index.tsx` | Overview KPIs across all schools |
| `.../admin/schools.tsx` | List, create, archive/restore |
| `.../admin/teachers.tsx` | All teachers, add, archive, "Log in as" |
| `.../admin/students.tsx` | Classrooms + students browser, archive |
| `.../admin/audit.tsx` | Audit trail |
| `src/routes/_authenticated/manage.tsx` | School-admin panel: own school's teachers, classes, students, join code |

Components: `AdminShell`, `KpiCard`, `EntityTable`, `ArchiveButton`, `CreateSchoolDialog`, `CreateUserDialog`, `ImpersonationBanner`, `GlobalSearch`. Existing teacher screens are untouched apart from mounting `ImpersonationBanner` in `AppShell` and adding a nav entry visible only to the two admin roles.

Data layer: `src/lib/admin-queries.ts` (new). `src/lib/queries.ts` gains `.is("archived_at", null)` filters — the only change to existing query code.

i18n: every new label, error and toast added to `src/lib/i18n.ts` in all four languages (en/hi/kn/mr).

## How existing things stay intact

- No column renamed or dropped; `classes`/`class_id`/`name`/`roll` untouched.
- Existing policies extended, never replaced — the teacher and principal expressions stay identical.
- Attendance (voice + manual), noticings, roster, CSV import, signup and the four languages are unaffected; the only behavioural change is that archived rows stop appearing.
- `vite.config.ts` fallbacks untouched.
- Post-build checks: 110 students, 1,326 noticings, 44 attendance rows, and a signed-in teacher spot check plus a cross-school negative test.

## Risks

- **Super-admin RLS leak.** The OR-in must be additive; a typo turning it into a replacement would widen or break teacher scope. Mitigation: policy-by-policy review plus an automated negative test that signs in as a teacher of school A and asserts zero rows from school B.
- **`is_super_admin()` drift.** If the helper ever returned true on an empty table or a null email, everyone becomes owner. It is written to return false on null/empty and is covered by a direct test.
- **Read-only enforcement.** The claim must survive session refresh; if it were dropped, an impersonated session becomes a writable teacher session. Mitigation: guard at both RLS and server-function level, short session lifetime, and a test that attempts a noticing insert while impersonating and expects a policy violation.
- **Username collisions / reserved domain.** Partial unique index plus a reserved-word denylist; usernames are lowercased at creation.
- **Archive filters missed.** A query left without `archived_at IS NULL` would show archived rows. Mitigation: the filter lives in the policies, not only the queries, so the database is the backstop.

# Roshni: multi-tenant school-code model

Move from open demo personas to real schools joined by a code, without losing any existing data.

## What's in the database today (verified)

- 1 school: "GHS Kadugodi" (code KADUGODI-2026)
- 5 classes: 6A, 6B, 7A, 7B, 8A — all already linked to that school
- 110 students, 1,326 noticings, 44 attendance rows, 6 staff profiles, 0 badges
- No student is missing a class; no profile is missing a school

So the migration has a clean starting point: everything existing already belongs to one school, which becomes the **sandbox/example school**.

## Decision on the existing schema (constraint 2)

**Keep `classes` and `class_id`. Add `grade` + `section` alongside, never rename or drop.**

Reason: every shipped screen (attendance, class register, constellation, student page, noticings, RLS helper `current_staff_class()`) reads `class_id`. Renaming `name`→`full_name` or `roll`→`roll_number` would break live code for zero functional gain.

So:
- `classes` gains `grade text` and `section text`, backfilled from the class name ("6A" → grade 6, section A).
- `students`, `profiles`, `noticings`, `attendance` gain `grade`/`section` (students, profiles) and `school_id` (noticings, attendance) as **nullable**, get backfilled, then flip to NOT NULL.
- `students.full_name` / `roll_number` are **not** introduced. The TS type `Student` maps `name`→`fullName` in the type layer only if wanted; database columns stay `name`/`roll`.
- Class assignment stays `class_id`. Grade+section are derived, kept in sync by a trigger on insert (if grade+section given and class_id missing, resolve the class; if class_id given, copy its grade+section).

Net effect: voice attendance and manual attendance keep working untouched, because they key off `class_id`.

## Phase 1 — SQL migration (one idempotent migration, additive only)

Step by step:

1. `schools`: add `code text` (uppercase, unique via a unique index on `upper(btrim(code))`), backfilled from the existing `join_code`. `join_code` is kept so nothing breaks.
2. Mark the existing GHS Kadugodi row as the sandbox: add `is_sandbox boolean not null default false`, set true for id `596eff92-…`.
3. Insert the real test school "Roshni Test School" with code `DEMO-GOV-01` (idempotent `on conflict do nothing`).
4. `classes`: add nullable `grade text`, `section text`; backfill by parsing `name` (leading digits → grade, trailing letters → section); then NOT NULL.
5. `students`: add nullable `school_id`, `grade`, `section`. Backfill:
   `update students s set school_id = c.school_id, grade = c.grade, section = c.section from classes c where c.id = s.class_id` → covers all 110.
   Then NOT NULL on all three + FK to `schools(id)` + `UNIQUE(school_id, grade, section, roll)`.
   (A pre-check query reports duplicate roll numbers before the unique index is created; if any exist the migration is adjusted rather than failing.)
6. `noticings`: add nullable `school_id`, backfill from the student's school (1,326 rows), then NOT NULL + FK.
7. `attendance`: already has `class_id` + FK to students; add nullable `school_id`, backfill the 44 rows the same way, then NOT NULL + FK.
8. `profiles`: `school_id` already exists and is populated; add nullable `grade`/`section` backfilled from `class_id`→`classes` (staying nullable, since the head teacher/admin has no class). Add a check constraint `role in ('teacher','admin')`.
9. `badges`: no school column needed (reachable via student); left untouched.
10. Verification block at the end of the migration: raises an exception if any row in students/noticings/attendance has a null school_id, so a bad backfill rolls the whole thing back rather than half-applying.

Note on auth users: the 5 auth users are already tied to profiles with `school_id` set to the sandbox school, so they need no separate migration — they simply become sandbox-school teachers.

## Phase 1b — RLS, helpers, RPC

- Helpers (SECURITY DEFINER, `search_path = public`, EXECUTE revoked from anon/public per the existing hardening):
  - `get_user_school_id()` → profiles.school_id for auth.uid()
  - `get_user_class()` → profiles.class_id (wraps existing `current_staff_class()`)
  - keep `current_staff_role()` as-is
- `verify_school_code(code text)` SECURITY DEFINER RPC: returns `{school_id, school_name, classes[]}` for an exact case-insensitive code match, nothing otherwise. Called only through a server function (`src/lib/school.functions.ts`), matching the existing pattern where these functions are service-role-only.
- Policy rewrite (same fail-closed spirit as today):
  - students/noticings/attendance: `school_id = get_user_school_id() AND (current_staff_role() = 'admin' OR class_id = get_user_class())`
  - students gain INSERT/UPDATE for teachers within their own school+grade+section, and for admins anywhere in their school — this is new (students is read-only today) and needed for the roster feature.
  - classes: readable within own school.

## Phase 1c — Sandbox preview vs strict RLS (constraint 3)

The unauthenticated "See how it works" uses a **static in-frontend sample**: a small hardcoded Grade 6B classroom (5 invented children, ~12 sample noticings, one week of attendance) in `src/lib/sample-classroom.ts`, rendered by the existing components in read-only mode.

No public-read policy is added, so there is zero chance of leaking a real school's rows, and the demo works even when signed out or offline. The real sandbox school stays behind normal auth for the existing demo staff logins.

## Phase 2 — Auth

- `RegisterForm.tsx`: fields become Full name, Email, Password, School code, Grade, Section. Code is validated through the server function; on success a `join_school`-style RPC upserts the profile with school_id + class (resolved from grade+section, created if the admin allows, otherwise "no class yet").
- Error states: invalid code, email already registered, weak password — all surfaced as inline text + toast.
- `useProfile()` extended to select `school_id, grade, section` and join the school name; exposed through app context so the shell can show "GHS Kadugodi · 7B".

## Phase 3 — Roster + CSV

New route `src/routes/_authenticated/roster.tsx`:
- Class-scoped list (teacher: own grade+section; admin: class switcher across the school), with an empty state for brand-new schools.
- "Add student" modal: name + roll, grade/section prefilled.
- CSV import: headers `Full Name, Roll Number, Grade, Section`; missing grade/section auto-filled from the teacher's class; sample template download; client-side preview table flagging empty names, non-numeric/duplicate rolls, and clashes with existing rows; batch insert only after the teacher confirms.

## Phase 4 — Demote the demo

- Landing + `/auth`: teacher sign-up / sign-in becomes the primary CTA; the persona list moves into a collapsed "See how it works" secondary link that opens the static sample classroom at `/preview` (no auth).
- The existing demo staff logins still work for the sandbox school, just not front-and-centre.

## Files to change

| File | Change |
|---|---|
| `src/lib/queries.ts` | add school/grade/section to selects; roster queries; student insert helpers |
| `src/hooks/useSession.ts` | profile now carries school_id, school name, grade, section |
| `src/lib/roshni.ts` | types: `School`, `TeacherProfile`, `Student`, `CSVStudentRow` |
| `src/components/roshni/RegisterForm.tsx` | new signup fields + code validation |
| `src/lib/school.functions.ts` | `verify_school_code` wrapper |
| `src/routes/auth.tsx` | primary sign-up CTA, demo demoted |
| `src/routes/index.tsx` | landing CTA change |
| `src/routes/_authenticated/roster.tsx` | new |
| `src/routes/_authenticated/class.tsx` | link to roster, empty state |
| `src/components/roshni/AppShell.tsx` | nav entry + school name in header |
| `src/routes/preview.tsx` + `src/lib/sample-classroom.ts` | new, unauthenticated sample |
| `src/lib/i18n.ts` | en/hi/kn strings for every new label, error and toast |

Untouched: `attendance.tsx`, `notice.tsx`, `student.$studentId.tsx`, `this-week.tsx`, `Constellation.tsx`, `VoiceCapture.tsx`, `transcribe.functions.ts`, `vite.config.ts`.

## Risks

- **Duplicate roll numbers** could block the new unique index — checked before the index is created; if present, we report them and scope the constraint accordingly.
- **Class-name parsing** assumes the "6A" pattern; all 5 current classes match, but the parser falls back to grade = full name / section = 'A' rather than failing.
- **Students becoming writable** is a real widening of RLS; policies are written school+class scoped and reviewed before apply.
- **NOT NULL flips** are the only irreversible step; each is preceded by its backfill and the final verification block aborts the migration if any null remains.
- New schools start with **no classes**, so signup must tolerate "grade/section not found" by creating the class for the school rather than erroring.

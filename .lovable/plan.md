# Voice Attendance

Teachers take today's attendance by speaking the names of absent children, then confirm an editable roster before saving. Manual tapping works on its own when there is no microphone.

## What the teacher sees

**New page: "Attendance"** (sidebar item, and a "Take attendance" button on the class register)

- Today's date at the top, with the class name (head teachers can switch class).
- One large record button. The teacher says, in English, Hindi or Kannada, only who is absent — "Aarti and Suresh are absent today".
- After speaking, the page shows which names it heard and which children it matched.
- Below that, always, the full class roster with a big Present / Absent toggle per child, pre-filled from what was heard. Everyone not named is Present.
- The teacher fixes anything wrong and presses Save. Re-taking attendance for the same day overwrites the earlier entry rather than duplicating it.
- Counts of present and absent update live; a short summary of today's attendance appears on the class register too.
- A child's page gains a small "Recent attendance" strip: the last 30 school days, plus a count of days absent.

Everything is translated into Hindi and Kannada, laid out for a phone first: full-width buttons, large tap targets, no horizontal scrolling.

## Technical notes

**Database (additive only — nothing existing is touched)**

New `attendance` table: `id`, `student_id` → students, `class_id` → classes, `date`, `status` ('present' | 'absent' check), `marked_by` → profiles, `created_at`, `updated_at`. Unique index on `(student_id, date)` so saving again upserts.

Grants for `authenticated` / `service_role`, RLS enabled, policies mirroring the existing tables: a teacher may select/insert/update attendance only for a class they are assigned to; an admin sees all classes (reusing `current_staff_role()` / `current_staff_class()`).

**Voice**

`transcribeNoticing` gains an optional `mode` input. In `attendance` mode the prompt tells the model it is hearing a roll call of absent student names; the default stays exactly as it is today, so the Notice composer is unchanged. `VoiceCapture` gains optional label/mode props with current values as defaults.

**Matching** (`src/lib/attendance.ts`, pure and unit-testable)

Transcript → candidate name fragments (split on "and", commas, "are absent", Hindi/Kannada equivalents) → match against the class roster with a forgiving comparison: case/diacritic folding, common Indian spelling variants (v/w, s/sh, ee/i, th/t, doubled letters), plus a normalised edit-distance threshold and first-name-only matching. Ambiguous matches are surfaced as "heard but not matched" rather than guessed silently.

**Data layer**

`src/lib/queries.ts` gains `attendanceForDateQuery(classId, date)` and `studentAttendanceQuery(studentId)`. Save is a single upsert on the unique key via the browser client (RLS applies), followed by query invalidation.

No existing route, table, policy or seed row is modified.

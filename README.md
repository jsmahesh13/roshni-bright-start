# Roshni: Every Child Seen

Build "Roshni" — a teacher-facing pastoral "noticing record" web app for Indian government schools. This is a real product I've prototyped; build it as a full-stack app with authentication and a database (Supabase). Use React + Tailwind + shadcn/ui.

THE IDEA (one paragraph): One teacher holds ~40 children, so some kids get overlooked — not from neglect but from numbers. Roshni lets a teacher jot short honest observations ("noticings") about students, one line at a time, and quietly surfaces the child who is being missed. Roshni means "light": every child is a light, and the tool's job is to make sure no child slips into the dark.

NON-NEGOTIABLE ETHICS (bake these into copy and behaviour): Roshni never talks to a student and has no student login. It never diagnoses, never uses clinical language, never scores/ranks/percentiles a child, never assigns a character label, never speculates about a child's home. It "forgets on purpose" (raw noticings auto-purge after 24 months). Show these as three tenets on the landing page: "never talks to a student", "never diagnoses or scores", "forgets on purpose".

DESIGN SYSTEM — a warm, light "school notebook" theme (NOT dark):
- Background: warm cream #FBF8F1 with a very faint graph-paper grid (subtle blue-grey 1px lines every ~26px).
- Surfaces: white cards #FFFFFF, 1px border #E7E0D2, soft shadows, rounded corners (14–18px).
- Text: ink #2C2A26, muted #6C665C, faint #9A948A.
- Accent: warm gold #E0A63C (darker #C98F26); a small glowing "sun" circle is the logo mark.
- Fonts: use "Caveat" (Google Font, handwritten) for the brand wordmark, big display headings and playful labels; "Inter" for all body/UI text.
- Semantic colours: strength/positive = green #2E9E5B; concern/negative = red #D64550.
- Facet colours (the TYPE of thing noticed): Engagement #2F80C2, Social #D65A9A, Academic #E08A1E, Emotion #8A5CC4, Strength #2E9E5B, Action #6B7280.
- Feel: calm, human, trustworthy, a little playful (sticky-note and pencil-sketch accents welcome), never clinical.

AUTH & ROLES (Supabase auth, email + password):
- Two roles: "teacher" (sees only their own class) and "admin"/head-teacher (sees all classes + a School settings page).
- On the sign-in screen, show a few clickable seeded demo staff so anyone can try it instantly (fill credentials on click). Also a "Register" tab (can be a simple request-access stub for now).

DATA MODEL (create these tables in the database and seed them):
- classes: id, name (e.g. "7B").
- profiles (staff): id (auth user), name, role ('teacher'|'admin'), class_id (nullable for admin).
- students: id, class_id, name, roll.
- noticings: id, student_id, author_id, facet ('engagement'|'social'|'academic'|'affect'|'strength'|'action'), valence int (-1 concern, 0 neutral/action, 1 strength), text, created_at (allow backdated seed dates spread across ~2 years), retracted boolean default false.
- badges: id, student_id, teacher_id, key ('pin'|'watch'|'follow'|'parent'|'celebrate'|'checkin').
Seed realistically: 5 classes (6A, 6B, 7A, 7B, 8A), ~22 students each (Indian first + last names), and a spread of noticings per student over ~2 years so the app looks alive — deliberately include a few "cases": a couple of nearly-invisible children (1–3 noticings, last seen long ago), one child with a lopsided all-concern record, one with a recent run of concerns, and one doing consistently well. Seed 3 demo teachers (one per a couple of classes) + 1 head-teacher admin.

BUILD THESE SCREENS NOW (we'll add more next):
1) Public LANDING page: hero with the sun logo + wordmark "Roshni" and headline "See every child. Even the quiet one." + subline about holding what a teacher notices. Then a stats band titled "The arithmetic of being overlooked" with four stat cards: "30–35 : 1 — the RTE pupil–teacher norm; real classrooms often 40–60:1", "~40 lakh children in ~1 lakh single-teacher schools", "1 in 7 adolescents lives with a mental-health condition — mostly unnoticed", "~0 counsellors in most government schools". Then a "Notice. See. Act." three-step. Then the three restraint tenets as dashed chips. A "Sign in" / "Get started" CTA.
2) SIGN IN page (Supabase auth) with the clickable seeded staff list.
3) APP SHELL after login: left sidebar nav — This week, Notice, The class, School (admin only) — with the sun wordmark at top and the signed-in teacher + a Sign out at the bottom. Include a small EN / हिंदी / ಕನ್ನಡ language toggle placeholder in the sidebar (wire the switch UI; full translations come later).
4) "THE CLASS" view as a REGISTER (this is the key screen): a table/list where each row is a student — left: name + roll; middle: a two-year "noticing strip" (a small inline SVG sparkline where each noticing is a thin vertical mark placed by date, strengths ABOVE a centre line and concerns BELOW it, coloured by facet); right: balance (count of ▲ strengths and ▼ concerns), and "last seen X days ago" with a small flag: a red "needs you" tag if there's a recent run of concern, or an amber "fading" tag if not noticed in 6+ weeks. A near-empty strip should visually stand out — that's a child nobody has written about. Make rows sortable (by needs-you, by fading/least-seen, by most-noticed) and clickable (open a student page — a simple placeholder page for now).

Make it responsive and clean. This is phase 1 (foundation + landing + auth + register). Next turns I'll add: the "Notice" composer that structures messy text into tagged noticings and blocks judgemental/clinical language, a weekly digest of questions, a "Constellation" night-sky class view, per-student badges, a longitudinal student page, and an "observation summary" export. Set up a solid, well-structured foundation for all of that.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://roshni-bright-start.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d62a70e-a52e-4a74-9b48-41535a0f3420).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

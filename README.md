# Roshni: Every Child Seen

A teacher-facing pastoral "noticing record" web app for Indian government schools.

**Live app**: https://roshni-bright-start.lovable.app

## The idea

One teacher holds ~40 children, so some kids get overlooked — not from neglect but from numbers. Roshni lets a teacher jot short, honest observations ("noticings") about students, one line at a time, and quietly surfaces the child who is being missed. Roshni means "light": every child is a light, and the tool's job is to make sure no child slips into the dark.

## Ethics, by design

Roshni never talks to a student and has no student login. It never diagnoses, never uses clinical language, never scores/ranks/percentiles a child, never assigns a character label, and never speculates about a child's home life. It also "forgets on purpose" — raw noticings auto-purge after 24 months.

## Features

- **Landing page** — product pitch, the "arithmetic of being overlooked" stats, and the three restraint tenets.
- **Auth** (Supabase, email + password) — `teacher` and `admin`/head-teacher roles, with clickable seeded demo staff for instant trial sign-in.
- **App shell** — sidebar nav (This week, Notice, The class, School for admins), signed-in user, sign out, and an EN / हिंदी / ಕನ್ನಡ language toggle.
- **The Class register** — one row per student with a two-year "noticing strip" sparkline, strength/concern balance, "last seen" flags (needs-you / fading), and sorting by need.

More screens (Notice composer, weekly digest, Constellation view, per-student badges, longitudinal student page, observation export) are planned.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + TanStack Router, React 19, TypeScript
- Tailwind CSS + shadcn/ui
- [Supabase](https://supabase.com) (auth + Postgres database)
- Built and maintained with [Lovable](https://lovable.dev)

## Getting started

This project uses [Bun](https://bun.sh) (see `bun.lock` / `bunfig.toml`).

```sh
git clone https://github.com/jsmahesh13/roshni-bright-start.git
cd roshni-bright-start
bun install
bun run dev
```

npm works too if you prefer it (`npm i && npm run dev`), but keep `bun.lock` as the source of truth for dependency versions.

### Environment variables

The app needs a Supabase project to talk to, plus a Lovable AI gateway key for voice transcription and AI-assisted noticing structuring. Copy `.env.example` to `.env` and fill in your own values:

```sh
cp .env.example .env
```

Both the plain and `VITE_`-prefixed Supabase variables are needed — the `VITE_` ones get inlined into the client bundle, the plain ones are read server-side. `.env` is gitignored; never commit real values.

Other useful scripts:

```sh
bun run build     # production build
bun run preview   # preview a production build
bun run lint      # eslint
bun run format    # prettier --write
```

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d62a70e-a52e-4a74-9b48-41535a0f3420).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

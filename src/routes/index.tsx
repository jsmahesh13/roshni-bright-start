import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, Gauge, Timer, PenLine, Eye, HandHeart } from "lucide-react";

import { Wordmark, SunMark } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roshni — See every child. Even the quiet one." },
      {
        name: "description",
        content:
          "A pastoral noticing record for Indian government schools. Teachers jot one honest line at a time; Roshni quietly surfaces the child who is being missed.",
      },
      { property: "og:title", content: "Roshni — See every child. Even the quiet one." },
      {
        property: "og:description",
        content:
          "One teacher holds forty children. Roshni makes sure none of them slips into the dark.",
      },
    ],
  }),
  component: Landing,
});

const STATS = [
  {
    big: "30–35 : 1",
    label: "the RTE pupil–teacher norm",
    sub: "Real classrooms often run 40–60 : 1.",
  },
  {
    big: "~40 lakh",
    label: "children in ~1 lakh single-teacher schools",
    sub: "One adult holding every child in the building.",
  },
  {
    big: "1 in 7",
    label: "adolescents lives with a mental-health condition",
    sub: "Mostly unnoticed, mostly unspoken.",
  },
  {
    big: "~0",
    label: "counsellors in most government schools",
    sub: "The class teacher is the whole pastoral system.",
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: "Notice",
    body: "One honest line, in your own words. Ten seconds between periods. No forms, no rubric.",
  },
  {
    icon: Eye,
    title: "See",
    body: "Two years of small lines become a strip. The child with the empty strip is the one nobody wrote about.",
  },
  {
    icon: HandHeart,
    title: "Act",
    body: "A question to ask, a seat to move, a family to call. Small human acts, not interventions.",
  },
];

const TENETS = [
  { icon: EyeOff, text: "Never talks to a student" },
  { icon: Gauge, text: "Never diagnoses or scores" },
  { icon: Timer, text: "Forgets on purpose" },
];

function Landing() {
  return (
    <div className="min-h-screen paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Wordmark size={30} textClass="text-3xl" />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-10 pb-16 text-center sm:pt-20">
        <div className="mx-auto mb-8 flex justify-center">
          <SunMark size={72} />
        </div>
        <h1 className="hand text-5xl leading-tight text-foreground sm:text-7xl">
          See every child.
          <br />
          Even the quiet one.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          One teacher holds forty children, so some get overlooked — not from neglect, but from
          numbers. Roshni holds what you notice, one line at a time, and quietly shows you the child
          nobody has written about.
        </p>
        <p className="mt-4 text-sm text-faint">
          <span className="hand text-xl text-gold-deep">Roshni</span> means light. Every child is
          one.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-card">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-card/70 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="hand text-center text-4xl text-foreground">
            The arithmetic of being overlooked
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
            None of this is anyone's fault. It is simply what the numbers do to attention.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card-paper p-6">
                <div className="hand text-4xl text-gold-deep">{s.big}</div>
                <div className="mt-2 text-sm font-semibold text-foreground">{s.label}</div>
                <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="hand text-center text-4xl text-foreground">Notice. See. Act.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card-paper relative p-7">
              <span className="absolute right-5 top-4 hand text-4xl text-border">0{i + 1}</span>
              <s.icon className="h-6 w-6 text-gold-deep" strokeWidth={1.75} />
              <h3 className="mt-4 hand text-3xl text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Restraint */}
      <section className="mx-auto max-w-4xl px-5 pb-24 text-center">
        <div className="sticky-note mx-auto max-w-2xl px-7 py-9">
          <h2 className="hand text-3xl text-foreground">What Roshni will never do</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Restraint is the feature. Roshni never uses clinical language, never labels a child's
            character, never ranks children, and never speculates about a home.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {TENETS.map((t) => (
              <span key={t.text} className="chip-dashed text-sm">
                <t.icon className="h-4 w-4" strokeWidth={1.75} />
                {t.text}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-faint">
            Raw noticings auto-purge after 24 months. Roshni forgets on purpose.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-faint">
        Roshni — a noticing record for teachers. Never a record about a teacher.
      </footer>
    </div>
  );
}

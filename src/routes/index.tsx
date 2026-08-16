import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeOff, Gauge, Timer, PenLine, Eye, HandHeart } from "lucide-react";

import { LanguageToggle } from "@/components/roshni/LanguageToggle";
import { Wordmark, SunMark } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useLang";

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
      { property: "og:url", content: "https://roshni-bright-start.lovable.app/" },
      { property: "og:image", content: "https://roshni-bright-start.lovable.app/og-roshni.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://roshni-bright-start.lovable.app/og-roshni.png" },
    ],
    links: [{ rel: "canonical", href: "https://roshni-bright-start.lovable.app/" }],
  }),
  component: Landing,
});

const STATS = [
  { bigKey: "stat1v", key: "stat1" },
  { bigKey: "stat2v", key: "stat2" },
  { bigKey: "stat3v", key: "stat3" },
  { bigKey: "stat4v", key: "stat4" },
];

const STEPS = [
  { icon: PenLine, title: "s1t", body: "s1d" },
  { icon: Eye, title: "s2t", body: "s2d" },
  { icon: HandHeart, title: "s3t", body: "s3d" },
];

const TENETS = [
  { icon: EyeOff, key: "t1" },
  { icon: Gauge, key: "t2" },
  { icon: Timer, key: "t3" },
];

function Landing() {
  const t = useT();

  return (
    <div className="min-h-screen paper">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <Wordmark size={30} textClass="text-3xl" />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/auth">{t("signin")}</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">{t("getstarted")}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-10 pb-16 text-center sm:pt-20">
        <div className="mx-auto mb-6 flex justify-center">
          <SunMark size={72} />
        </div>
        <span className="chip-dashed text-xs">{t("track")}</span>
        <h1 className="hand mt-6 text-5xl leading-tight text-foreground sm:text-7xl">
          {t("hero")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("sub")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <span className="sticky-note hand -rotate-2 px-5 py-3 text-lg text-foreground">
            {t("note1")}
          </span>
          <span className="sticky-note hand rotate-1 px-5 py-3 text-lg text-foreground">
            {t("note2")}
          </span>
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">{t("getstarted")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-card">
            <a href="#how">{t("seehow")}</a>
          </Button>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-card/70 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="hand text-center text-4xl text-foreground">{t("gravtitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
            {t("gravsub")}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.key} className="card-paper p-6">
                <div className="hand text-4xl text-gold-deep">{t(s.bigKey)}</div>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(s.key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="hand text-center text-4xl text-foreground">{t("howtitle")}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card-paper relative p-7">
              <span className="absolute right-5 top-4 hand text-4xl text-border">0{i + 1}</span>
              <s.icon className="h-6 w-6 text-gold-deep" strokeWidth={1.75} />
              <h3 className="mt-4 hand text-3xl text-foreground">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Restraint */}
      <section className="mx-auto max-w-4xl px-5 pb-24 text-center">
        <div className="sticky-note mx-auto max-w-2xl px-7 py-9">
          <h2 className="hand text-3xl text-foreground">{t("caretitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("caredesc")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {TENETS.map((tenet) => (
              <span key={tenet.key} className="chip-dashed text-sm">
                <tenet.icon className="h-4 w-4" strokeWidth={1.75} />
                {t(tenet.key)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_1.4fr_0.9fr]">
          <div>
            <Wordmark size={26} textClass="text-2xl" />
            <p className="hand mt-2 text-xl text-muted-foreground">{t("footl")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {TENETS.map((tenet) => (
                <span key={tenet.key} className="chip-dashed text-xs">
                  {t(tenet.key)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("ft_privacy_h")}</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>{t("ft_privacy_1")}</li>
              <li>{t("ft_privacy_2")}</li>
              <li>{t("ft_privacy_3")}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("ft_links_h")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  className="underline underline-offset-4 hover:text-gold-deep"
                  href="https://github.com/your-org/roshni"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("ft_source")}
                </a>
              </li>
              <li>
                <a className="underline underline-offset-4 hover:text-gold-deep" href="#">
                  {t("ft_screencast")}
                </a>{" "}
                <span className="text-faint">({t("ft_soon")})</span>
              </li>
              <li>
                {t("ft_contact")}:{" "}
                <a
                  className="underline underline-offset-4 hover:text-gold-deep"
                  href="mailto:maheshjs@cricduel.com"
                >
                  maheshjs@cricduel.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-faint">
            <span>Roshni · {t("ft_demo")}</span>
            <span>{t("ft_license")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

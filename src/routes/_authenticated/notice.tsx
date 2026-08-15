import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notice")({
  head: () => ({
    meta: [
      { title: "Notice — Roshni" },
      {
        name: "description",
        content: "Write a short, honest noticing about a child in your class.",
      },
      { property: "og:title", content: "Notice — Roshni" },
      { property: "og:description", content: "Write a short, honest noticing." },
    ],
  }),
  component: NoticePage,
});

function NoticePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="hand text-5xl text-foreground">Notice</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        One honest line, in your own words. Ten seconds is enough.
      </p>

      <div className="card-paper mt-6 p-8 text-center">
        <p className="hand text-3xl text-foreground">The composer is coming next.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          It will take messy typed text, structure it into tagged noticings, and gently push back on
          clinical or judgemental language before anything is saved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="bg-card">
            <Link to="/class">Open the register</Link>
          </Button>
        </div>
      </div>

      <p className="mt-4 text-xs text-faint">
        Reminder: describe what you saw, not what you concluded. Roshni does not accept diagnoses,
        character labels, or guesses about a child's home.
      </p>
    </div>
  );
}

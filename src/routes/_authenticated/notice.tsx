import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUser } from "@/hooks/useSession";
import { studentsQuery } from "@/lib/queries";
import {
  BLOCK_MSG,
  EXAMPLE_TEXT,
  detectFacet,
  detectValence,
  makeDrafts,
  scan,
  type Draft,
} from "@/lib/composer";
import { FACETS, FACET_LABEL, FACET_VAR, type Facet } from "@/lib/roshni";

export const Route = createFileRoute("/_authenticated/notice")({
  validateSearch: (search: Record<string, unknown>): { draft?: string } =>
    typeof search['draft'] === "string" ? { draft: search['draft'] as string } : {},
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

const selectClass =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-2 focus:outline-gold";

function NoticePage() {
  const { draft: incoming } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const classId = profile?.role === "admin" ? null : (profile?.class_id ?? null);
  const { data: students } = useQuery({ ...studentsQuery(classId), enabled: !!profile });
  const scope = useMemo(() => students ?? [], [students]);

  const [raw, setRaw] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});

  useEffect(() => {
    if (incoming) {
      setRaw(incoming);
      void navigate({ to: "/notice", search: { draft: undefined }, replace: true });
    }
  }, [incoming, navigate]);

  function structure() {
    if (!raw.trim()) {
      toast("Nothing to structure");
      return;
    }
    setEditing({});
    setDrafts(makeDrafts(raw, scope));
  }

  function patch(id: number, next: Partial<Draft>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...next } : d)));
  }

  function recheck(d: Draft) {
    const text = (editing[d.id] ?? d.text).trim();
    const hits = scan(text);
    const facet = detectFacet(text);
    patch(d.id, {
      text,
      hits,
      facet,
      valence: detectValence(text, facet),
      approved: hits.length === 0 && !!d.studentId,
    });
    setEditing((e) => {
      const next = { ...e };
      delete next[d.id];
      return next;
    });
    if (hits.length) toast("Still flagged — describe what you saw.");
  }

  const save = useMutation({
    mutationFn: async () => {
      const ok = drafts.filter((d) => d.approved && d.studentId && d.hits.length === 0);
      if (!ok.length) throw new Error("Nothing approved yet");
      const { error } = await supabase.from("noticings").insert(
        ok.map((d) => ({
          student_id: d.studentId!,
          author_id: user!.id,
          facet: d.facet,
          valence: d.valence,
          text: d.text,
          retracted: false,
        })),
      );
      if (error) throw error;
      return ok.length;
    },
    onSuccess: (n) => {
      setDrafts([]);
      setRaw("");
      void queryClient.invalidateQueries({ queryKey: ["noticings"] });
      void queryClient.invalidateQueries({ queryKey: ["student-noticings"] });
      toast.success(`${n} noticing${n > 1 ? "s" : ""} saved`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savable = drafts.some((d) => d.hits.length === 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="hand text-5xl text-foreground">Notice</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Type it the way you'd say it. Roshni will split it into clean, dated observations —
        nothing is saved until you approve every word.
      </p>

      <div className="card-paper mt-6 p-5">
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={6}
          placeholder="Fatima was quiet all morning, one-word answers. Arjun sat alone at lunch again…"
          className="resize-y bg-background text-[15px]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={structure}>Structure it →</Button>
          <Button variant="outline" className="bg-card" onClick={() => setRaw(EXAMPLE_TEXT)}>
            Use example
          </Button>
          <span className="text-xs text-faint">{raw.length} chars</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-strength/40 bg-strength/8 p-4 text-sm text-foreground">
        <b>The one rule: observation, not interpretation.</b> Describe what a child did, and when.
        Roshni will not save a character label, a diagnosis, a theory about a home, an identity
        remark, or medical detail.
      </div>

      <div className="mt-6 space-y-4">
        {drafts.length === 0 && (
          <div className="card-paper p-8 text-center text-sm text-muted-foreground">
            Nothing parsed yet.
          </div>
        )}

        {drafts.map((d) => {
          const blocked = d.hits.length > 0;
          return (
            <div
              key={d.id}
              className={`card-paper overflow-hidden ${blocked ? "border-concern/60" : ""}`}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    blocked ? "border-concern text-concern" : "border-border text-muted-foreground"
                  }`}
                >
                  {blocked ? "Needs a rewrite" : `Noticing ${String(d.id + 1).padStart(2, "0")}`}
                </span>
                {!blocked && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="accent-gold"
                      checked={d.approved}
                      onChange={(e) => patch(d.id, { approved: e.target.checked })}
                    />
                    Approve
                  </label>
                )}
              </div>

              <div className="px-4 py-3">
                {editing[d.id] !== undefined ? (
                  <Textarea
                    value={editing[d.id]}
                    rows={3}
                    onChange={(e) => setEditing((s) => ({ ...s, [d.id]: e.target.value }))}
                    className="bg-background text-sm"
                  />
                ) : (
                  <p className="text-[15px] text-foreground">{d.text}</p>
                )}
              </div>

              {blocked &&
                d.hits.slice(0, 2).map((h) => (
                  <div
                    key={h.word}
                    className="mx-4 mb-3 rounded-lg bg-concern/10 px-3 py-2 text-xs text-foreground"
                  >
                    <b>“{h.word}”</b> — {BLOCK_MSG[h.cat]}
                  </div>
                ))}

              {!blocked && !d.studentId && (
                <div className="mx-4 mb-3 rounded-lg bg-gold-soft px-3 py-2 text-xs text-foreground">
                  No student matched. Pick one below, or add a first name.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                <select
                  className={selectClass}
                  value={d.studentId ?? ""}
                  onChange={(e) =>
                    patch(d.id, {
                      studentId: e.target.value || null,
                      approved: !!e.target.value && d.hits.length === 0 && d.approved,
                    })
                  }
                >
                  <option value="">— student —</option>
                  {scope.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  className={selectClass}
                  value={d.facet}
                  onChange={(e) => {
                    const facet = e.target.value as Facet;
                    patch(d.id, { facet, valence: detectValence(d.text, facet) });
                  }}
                >
                  {FACETS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: FACET_VAR[d.facet] }}
                  />
                  {d.valence > 0 ? "Strength" : d.valence < 0 ? "Concern" : "Neutral"}
                </span>

                {blocked && (
                  <button
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      editing[d.id] !== undefined
                        ? recheck(d)
                        : setEditing((s) => ({ ...s, [d.id]: d.text }))
                    }
                  >
                    {editing[d.id] !== undefined
                      ? "Recheck"
                      : "I've rewritten it — recheck"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {savable && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save approved noticings →
          </Button>
          <Button asChild variant="outline" className="bg-card">
            <Link to="/class">Open the register</Link>
          </Button>
        </div>
      )}

      <p className="mt-6 text-xs text-faint">
        Raw noticings are removed automatically after 24 months. Roshni never speaks to a child and
        never holds a diagnosis.
      </p>
    </div>
  );
}

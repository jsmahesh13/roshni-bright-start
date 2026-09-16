import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, Hand, Mic, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceCapture } from "@/components/roshni/VoiceCapture";
import { useProfile, useUser } from "@/hooks/useSession";
import { useT } from "@/hooks/useLang";
import { fill } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { attendanceForDateQuery, classesQuery, studentsQuery } from "@/lib/queries";
import { matchAbsentees, todayISO, type AttendanceStatus } from "@/lib/attendance";
import type { Student } from "@/lib/roshni";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Take attendance — Roshni" },
      {
        name: "description",
        content:
          "Mark today's attendance by speaking the names of absent children, or by tapping each child — the teacher always confirms before saving.",
      },
      { property: "og:title", content: "Take attendance — Roshni" },
      {
        property: "og:description",
        content: "Daily attendance by voice or by tap, confirmed by the teacher.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const t = useT();
  const { user } = useUser();
  const { data: profile } = useProfile();
  const { data: classes } = useQuery(classesQuery);
  const queryClient = useQueryClient();

  const date = todayISO();
  const [classId, setClassId] = useState<string | null>(null);
  const activeClassId =
    profile?.role === "admin" ? (classId ?? classes?.[0]?.id ?? null) : (profile?.class_id ?? null);

  const { data: students, isLoading } = useQuery({
    ...studentsQuery(activeClassId),
    enabled: !!activeClassId,
  });
  const { data: saved } = useQuery(attendanceForDateQuery(activeClassId, date));

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [heard, setHeard] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ student: Student; heard: string }[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  // Start from what is already stored for today, otherwise everyone present.
  useEffect(() => {
    if (!students) return;
    const base: Record<string, AttendanceStatus> = {};
    for (const s of students) base[s.id] = "present";
    for (const row of saved ?? []) {
      if (row.student_id in base) base[row.student_id] = row.status;
    }
    setMarks(base);
  }, [students, saved]);

  function applyTranscript(text: string) {
    if (!students) return;
    const result = matchAbsentees(text, students);
    setHeard(text);
    setMatched(result.matches);
    setUnmatched(result.unmatched);
    setMarks(() => {
      const next: Record<string, AttendanceStatus> = {};
      for (const s of students) next[s.id] = result.absentIds.includes(s.id) ? "absent" : "present";
      return next;
    });
  }

  const absentCount = Object.values(marks).filter((m) => m === "absent").length;
  const presentCount = Object.values(marks).length - absentCount;

  const save = useMutation({
    mutationFn: async () => {
      if (!activeClassId || !students || !user) throw new Error("not-ready");
      const rows = students.map((s) => ({
        student_id: s.id,
        class_id: activeClassId,
        date,
        status: marks[s.id] ?? "present",
        marked_by: user.id,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "student_id,date" })
        .select("id");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("at_saved"));
      void queryClient.invalidateQueries({ queryKey: ["attendance"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["attendance-student"], refetchType: "all" });
    },
    onError: () => toast.error(t("at_savefail")),
  });

  const dateLabel = useMemo(
    () => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "full" }),
    [date],
  );
  const className = classes?.find((c) => c.id === activeClassId)?.name ?? "";

  if (!activeClassId && !isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="hand text-5xl text-foreground">{t("at_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("at_noclass")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 pb-28">
      <header>
        <h1 className="hand text-5xl text-foreground">{t("at_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {className ? `${className} · ` : ""}
          {t("at_today")} · {dateLabel}
        </p>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t("at_sub")}</p>
      </header>

      {profile?.role === "admin" && classes && classes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setClassId(c.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                c.id === activeClassId
                  ? "bg-gold-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {(saved?.length ?? 0) > 0 && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold-soft/50 px-4 py-3 text-sm text-foreground">
          {t("at_already")}
        </p>
      )}

      {/* Two equal ways in: speak, or just tap. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mic className="h-4 w-4 text-engagement" aria-hidden />
            {t("at_voice_way")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("at_voice_help")}</p>
          <div className="mt-4">
            <VoiceCapture
              mode="attendance"
              big
              recordKey="at_record"
              hintKey=""
              onTranscript={applyTranscript}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hand className="h-4 w-4 text-strength" aria-hidden />
            {t("at_manual_way")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("at_manual_help")}</p>
          <Button
            variant="outline"
            className="mt-4 h-16 w-full bg-card text-base"
            onClick={() => {
              if (!students) return;
              const next: Record<string, AttendanceStatus> = {};
              for (const s of students) next[s.id] = "present";
              setMarks(next);
              setHeard(null);
              setMatched([]);
              setUnmatched([]);
            }}
          >
            {t("at_allpresent")}
          </Button>
        </section>
      </div>

      {heard && (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card/70 p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-faint">{t("at_heard")}</p>
          <p className="mt-1 text-foreground">“{heard}”</p>
          {matched.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("at_matched")}:{" "}
              <span className="font-medium text-foreground">
                {matched.map((m) => m.student.name).join(", ")}
              </span>
            </p>
          )}
          {unmatched.length > 0 && (
            <p className="mt-2 text-xs text-concern">
              {t("at_unmatched")}: {unmatched.join(", ")}
            </p>
          )}
        </div>
      )}

      <section className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="hand text-3xl text-foreground">{t("at_roster")}</h2>
          <span className="text-sm text-muted-foreground">
            {fill(t("at_summary"), { p: presentCount, a: absentCount })}
          </span>
        </div>

        <ul className="mt-3 space-y-2">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}

          {(students ?? []).map((s) => {
            const status = marks[s.id] ?? "present";
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-faint">#{s.roll}</p>
                </div>
                <div className="flex shrink-0 gap-1 rounded-xl border border-border p-1">
                  <button
                    onClick={() => setMarks((m) => ({ ...m, [s.id]: "present" }))}
                    aria-pressed={status === "present"}
                    className={cn(
                      "flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                      status === "present"
                        ? "bg-strength/15 text-strength"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    {t("at_present")}
                  </button>
                  <button
                    onClick={() => setMarks((m) => ({ ...m, [s.id]: "absent" }))}
                    aria-pressed={status === "absent"}
                    className={cn(
                      "flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                      status === "absent"
                        ? "bg-concern/15 text-concern"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <X className="h-4 w-4" aria-hidden />
                    {t("at_absent")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">
            {fill(t("at_summary"), { p: presentCount, a: absentCount })}
          </span>
          <Button
            className="h-14 flex-1 text-base"
            disabled={save.isPending || !students?.length}
            onClick={() => save.mutate()}
          >
            {save.isPending ? t("at_saving") : t("at_save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

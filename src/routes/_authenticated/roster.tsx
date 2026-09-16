import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Upload, Download } from "lucide-react";

import { AppShell } from "@/components/roshni/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useSession";
import { useT } from "@/hooks/useLang";
import { classesQuery, studentsQuery } from "@/lib/queries";
import { CSV_TEMPLATE, parseStudentCSV, type ParsedRow } from "@/lib/csv";
import { fill } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  errorComponent: () => <AppShell><p className="p-6">…</p></AppShell>,
  notFoundComponent: () => <AppShell><p className="p-6">…</p></AppShell>,
});

function RosterPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: classes = [] } = useQuery(classesQuery);

  const [pickedClassId, setPickedClassId] = useState<string | null>(null);
  const activeClassId =
    profile?.role === "admin"
      ? pickedClassId ?? classes[0]?.id ?? null
      : profile?.class_id ?? null;
  const activeClass = classes.find((c) => c.id === activeClassId) ?? null;

  const { data: students = [] } = useQuery({
    ...studentsQuery(activeClassId),
    enabled: !!activeClassId,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const schoolId = profile?.school_id ?? activeClass?.school_id ?? "";
  const existingRolls = useMemo(() => students.map((s) => s.roll), [students]);

  const addOne = useMutation({
    mutationFn: async () => {
      if (!activeClassId) throw new Error("no class");
      const { error } = await supabase.from("students").insert({
        class_id: activeClassId,
        name: newName.trim(),
        roll: Number(newRoll),
        school_id: schoolId,
        grade: activeClass?.grade ?? profile?.grade ?? "",
        section: activeClass?.section ?? profile?.section ?? "",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewName("");
      setNewRoll("");
      setShowAdd(false);
      toast.success(t("ro_added"));
      await queryClient.invalidateQueries({ queryKey: ["students"], refetchType: "all" });
    },
    onError: () => toast.error(t("ro_addfail")),
  });

  const importRows = useMutation({
    mutationFn: async (good: ParsedRow[]) => {
      if (!activeClassId) throw new Error("no class");
      const { error } = await supabase.from("students").insert(
        good.map((r) => ({
          class_id: activeClassId,
          name: r.fullName,
          roll: Number(r.rollNumber),
          school_id: schoolId,
          grade: r.grade,
          section: r.section,
        })),
      );
      if (error) throw error;
      return good.length;
    },
    onSuccess: async (n) => {
      setRows(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success(fill(t("csv_done"), { n }));
      await queryClient.invalidateQueries({ queryKey: ["students"], refetchType: "all" });
    },
    onError: () => toast.error(t("csv_fail")),
  });

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseStudentCSV(text, {
      defaultGrade: activeClass?.grade ?? profile?.grade ?? "",
      defaultSection: activeClass?.section ?? profile?.section ?? "",
      existingRolls,
    });
    if (parsed.length === 0) {
      toast.error(t("csv_emptyfile"));
      return;
    }
    setRows(parsed);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roshni-class-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const good = (rows ?? []).filter((r) => !r.error);
  const bad = (rows ?? []).filter((r) => r.error);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl text-foreground">{t("ro_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("ro_sub")}</p>
          {activeClass && (
            <p className="text-xs text-faint">
              {profile?.school?.name ? `${profile.school.name} · ` : ""}
              {activeClass.name} · {fill(t("ro_count"), { n: students.length })}
            </p>
          )}
        </header>

        {profile?.role === "admin" && classes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Button
                key={c.id}
                variant={c.id === activeClassId ? "default" : "outline"}
                size="sm"
                className={c.id === activeClassId ? "" : "bg-card"}
                onClick={() => setPickedClassId(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        )}

        {!activeClassId ? (
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
            {t("ro_noclass")}
          </p>
        ) : (
          <>
            <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
              {students.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("ro_empty")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {students.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-3">
                      <span className="w-10 shrink-0 text-sm tabular-nums text-faint">{s.roll}</span>
                      <span className="text-[15px] text-foreground">{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="min-h-11" onClick={() => setShowAdd((v) => !v)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("ro_add")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 bg-card"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("csv_pick")}
                </Button>
                <Button variant="ghost" className="min-h-11" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("csv_template")}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  aria-label={t("csv_pick")}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-faint">{t("csv_headers")}</p>

              {showAdd && (
                <form
                  className="mt-4 space-y-3 rounded-xl border border-border p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addOne.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="sname">{t("ro_name")}</Label>
                    <Input
                      id="sname"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      maxLength={80}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sroll">{t("ro_roll")}</Label>
                    <Input
                      id="sroll"
                      type="number"
                      min={1}
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="min-h-11" disabled={addOne.isPending}>
                      {addOne.isPending ? t("ro_saving") : t("ro_save")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => setShowAdd(false)}
                    >
                      {t("ro_cancel")}
                    </Button>
                  </div>
                </form>
              )}
            </section>

            {rows && (
              <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
                <h2 className="font-display text-2xl text-foreground">{t("csv_preview")}</h2>
                <p className="mt-1 text-xs text-faint">
                  {fill(t("csv_ready"), { n: good.length })}
                  {bad.length > 0 ? ` · ${fill(t("csv_skipped"), { n: bad.length })}` : ""}
                </p>
                <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm">
                  {rows.map((r) => (
                    <li
                      key={r.line}
                      className={
                        r.error
                          ? "rounded-md bg-concern/10 px-2 py-1 text-concern"
                          : "px-2 py-1 text-foreground"
                      }
                    >
                      <span className="tabular-nums text-faint">{r.rollNumber || "—"}</span>{" "}
                      {r.fullName || "—"}{" "}
                      <span className="text-faint">
                        {r.grade}
                        {r.section}
                      </span>
                      {r.error && <span className="ml-2 text-xs">{t(r.error)}</span>}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button
                    className="min-h-11"
                    disabled={good.length === 0 || importRows.isPending}
                    onClick={() => importRows.mutate(good)}
                  >
                    {importRows.isPending ? t("csv_importing") : t("csv_import")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      setRows(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    {t("ro_cancel")}
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

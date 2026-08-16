import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { classesQuery } from "@/lib/queries";
import type { Profile } from "@/lib/roshni";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/school")({
  head: () => ({
    meta: [
      { title: "School — Roshni" },
      {
        name: "description",
        content: "Head-teacher settings: classes, staff and how Roshni forgets.",
      },
      { property: "og:title", content: "School — Roshni" },
      { property: "og:description", content: "Head-teacher settings for Roshni." },
    ],
  }),
  component: SchoolPage,
});

function SchoolPage() {
  const t = useT();
  const { data: classes, isLoading } = useQuery(classesQuery);
  const { data: staff } = useQuery({
    queryKey: ["staff"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role, class_id")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="hand text-5xl text-foreground">{t("sch_h1")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("sch_sub")}
      </p>

      <section className="mt-7">
        <h2 className="hand text-3xl text-foreground">{t("sch_classes")}</h2>
        {isLoading ? (
          <Skeleton className="mt-3 h-24 w-full" />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(classes ?? []).map((c) => (
              <Link
                key={c.id}
                to="/class"
                className="card-paper p-5 text-center transition-shadow hover:shadow-lift"
              >
                <div className="hand text-4xl text-gold-deep">{c.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("sch_open")}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="hand text-3xl text-foreground">{t("sch_staff")}</h2>
        <div className="card-paper mt-3 divide-y divide-border">
          {(staff ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.email}</div>
              </div>
              <span className="shrink-0 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-deep">
                {p.role === "admin" ? t("sch_headteacher") : (classes?.find((c) => c.id === p.class_id)?.name ?? t("sch_unassigned"))}
              </span>
            </div>
          ))}
          {(staff ?? []).length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">{t("sch_nostaff")}</div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="hand text-3xl text-foreground">{t("sch_forgetting")}</h2>
        <div className="sticky-note mt-3 p-5 text-sm text-muted-foreground">
          {t("sch_forget_body")}
        </div>
      </section>
    </div>
  );
}

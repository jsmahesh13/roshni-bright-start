import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { adminAuditQuery } from "@/lib/admin-queries";
import { useT } from "@/hooks/useLang";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit — Roshni Console" },
      { name: "description", content: "Administrative action log." },
      { property: "og:title", content: "Audit — Roshni Console" },
      { property: "og:description", content: "Administrative action log." },
    ],
  }),
  component: AdminAudit,
});

function AdminAudit() {
  const t = useT();
  const { data: rows } = useQuery(adminAuditQuery);

  return (
    <div>
      <h2 className="hand text-3xl text-foreground">{t("ad_audit")}</h2>
      <div className="card-paper mt-4 divide-y divide-border">
        {(rows ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">{t("ad_audit_empty")}</p>
        )}
        {(rows ?? []).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-gold-deep">
                  {r.action}
                </span>
                {r.entity_type && (
                  <span className="text-xs text-muted-foreground">{r.entity_type}</span>
                )}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {r.actor_role ?? "—"}
                {Object.keys(r.details ?? {}).length > 0 && (
                  <>
                    {" · "}
                    {Object.entries(r.details)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ")}
                  </>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

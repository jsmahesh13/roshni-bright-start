import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutGrid, School as SchoolIcon, Users, UsersRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: isSA } = await supabase.rpc("is_super_admin");
    if (isSA !== true) throw redirect({ to: "/this-week" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/admin", label: t("ad_overview"), icon: LayoutGrid, exact: true },
    { to: "/admin/schools", label: t("ad_schools"), icon: SchoolIcon, exact: false },
    { to: "/admin/teachers", label: t("ad_teachers"), icon: Users, exact: false },
    { to: "/admin/students", label: t("ad_students"), icon: UsersRound, exact: false },
    { to: "/admin/audit", label: t("ad_audit"), icon: ClipboardList, exact: false },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="hand text-5xl text-foreground">{t("nav_console")}</h1>
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-gold/60 bg-gold-soft text-gold-deep"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.75} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

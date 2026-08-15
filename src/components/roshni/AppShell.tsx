import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CalendarDays, PenLine, Users, Building2, LogOut, Menu, X } from "lucide-react";

import { Wordmark } from "@/components/roshni/SunLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/this-week", label: "This week", icon: CalendarDays },
    { to: "/notice", label: "Notice", icon: PenLine },
    { to: "/class", label: "The class", icon: Users },
    ...(profile?.role === "admin"
      ? [{ to: "/school", label: "School", icon: Building2 as typeof Users }]
      : []),
  ] as const;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-5 py-6">
        <Link to="/this-week" onClick={() => setOpen(false)}>
          <Wordmark size={26} textClass="text-2xl" />
        </Link>
        <button
          className="lg:hidden text-muted-foreground"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 px-4 pb-5">
        <div>
          <div className="mb-1.5 px-1 text-[11px] uppercase tracking-wide text-faint">Language</div>
          <div className="flex gap-1 rounded-xl border border-sidebar-border bg-card p-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  lang === l.code
                    ? "bg-gold-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-faint">Translations are on the way.</p>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-card p-3">
          <div className="truncate text-sm font-semibold text-foreground">
            {profile?.name ?? "…"}
          </div>
          <div className="text-xs text-muted-foreground">
            {profile?.role === "admin" ? "Head teacher" : "Class teacher"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start px-2 text-muted-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen paper">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/25"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border shadow-lift">
            {sidebar}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border bg-card/70 px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <Wordmark size={22} textClass="text-xl" />
        </div>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { endImpersonation } from "@/lib/admin.functions";
import { useT } from "@/hooks/useLang";

const SAVED_KEY = "roshni.impersonator";

export interface SavedImpersonator {
  access_token: string;
  refresh_token: string;
  teacherId: string;
  teacherName: string;
}

export function saveImpersonatorSession(saved: SavedImpersonator) {
  sessionStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

/** Persistent banner shown while the platform owner views a teacher's account read-only. */
export function ImpersonationBanner() {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const am = (data.user?.app_metadata ?? {}) as Record<string, unknown>;
      if (am["acting_readonly"] === true) {
        const saved = sessionStorage.getItem(SAVED_KEY);
        let name = data.user?.email ?? "";
        if (saved) {
          try {
            name = (JSON.parse(saved) as SavedImpersonator).teacherName || name;
          } catch {
            /* ignore */
          }
        }
        setTeacherName(name);
      } else {
        setTeacherName(null);
      }
    };
    void check();
    // The app shell never remounts across client-side navigation, so the
    // one-time mount check misses session swaps — listen for them instead.
    const { data: sub } = supabase.auth.onAuthStateChange(() => void check());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!teacherName) return null;

  async function exit() {
    setBusy(true);
    try {
      const raw = sessionStorage.getItem(SAVED_KEY);
      const saved = raw ? (JSON.parse(raw) as SavedImpersonator) : null;
      sessionStorage.removeItem(SAVED_KEY);
      if (saved) {
        await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token,
        });
        await endImpersonation({ data: { teacherId: saved.teacherId } }).catch(() => {});
      } else {
        await supabase.auth.signOut();
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      window.location.href = "/admin";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 border-b border-gold/50 bg-gold-soft px-4 py-2 text-sm text-gold-deep">
      <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">
        {t("imp_viewing")} <b>{teacherName}</b> — {t("imp_readonly")}
      </span>
      <Button size="sm" variant="outline" className="bg-card" disabled={busy} onClick={() => void exit()}>
        <LogOut className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
        {t("imp_exit")}
      </Button>
    </div>
  );
}

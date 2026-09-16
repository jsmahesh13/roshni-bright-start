import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { TeacherProfile } from "@/lib/roshni";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useProfile() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TeacherProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role, class_id, school_id, grade, section, schools(id, name)")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { schools, ...rest } = data as typeof data & {
        schools: { id: string; name: string } | null;
      };
      return { ...(rest as unknown as TeacherProfile), school: schools ?? null };
    },
  });
}

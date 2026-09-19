import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface AdminSchool {
  id: string;
  name: string;
  code: string;
  is_sandbox: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: string;
  school_id: string;
  class_id: string | null;
  archived_at: string | null;
}

export interface AdminClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  school_id: string;
  archived_at: string | null;
}

export interface AdminStudent {
  id: string;
  name: string;
  roll: number;
  class_id: string;
  school_id: string;
  grade: string;
  section: string;
  archived_at: string | null;
}

export interface AuditRow {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export const isSuperAdminQuery = queryOptions({
  queryKey: ["is-super-admin"],
  queryFn: async (): Promise<boolean> => {
    const { data } = await supabase.rpc("is_super_admin");
    return data === true;
  },
  staleTime: 60_000,
});

export const adminSchoolsQuery = queryOptions({
  queryKey: ["admin", "schools"],
  queryFn: async (): Promise<AdminSchool[]> => {
    const { data, error } = await supabase
      .from("schools")
      .select("id, name, code, is_sandbox, archived_at, created_at")
      .order("name");
    if (error) throw error;
    return (data ?? []) as AdminSchool[];
  },
});

export const adminTeachersQuery = queryOptions({
  queryKey: ["admin", "teachers"],
  queryFn: async (): Promise<AdminProfile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, username, role, school_id, class_id, archived_at")
      .order("name");
    if (error) throw error;
    return (data ?? []) as AdminProfile[];
  },
});

export const adminClassesQuery = queryOptions({
  queryKey: ["admin", "classes"],
  queryFn: async (): Promise<AdminClass[]> => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, grade, section, school_id, archived_at")
      .order("name");
    if (error) throw error;
    return (data ?? []) as AdminClass[];
  },
});

export const adminStudentsQuery = queryOptions({
  queryKey: ["admin", "students"],
  queryFn: async (): Promise<AdminStudent[]> => {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, roll, class_id, school_id, grade, section, archived_at")
      .order("roll");
    if (error) throw error;
    return (data ?? []) as AdminStudent[];
  },
});

export const adminNoticingsCountQuery = queryOptions({
  queryKey: ["admin", "noticings-count"],
  queryFn: async (): Promise<number> => {
    const { count, error } = await supabase
      .from("noticings")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },
});

export const adminAuditQuery = queryOptions({
  queryKey: ["admin", "audit"],
  queryFn: async (): Promise<AuditRow[]> => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, actor_id, actor_role, action, entity_type, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AuditRow[];
  },
});

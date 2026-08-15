import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Noticing, Student } from "@/lib/roshni";

export interface ClassRow {
  id: string;
  name: string;
}

export const classesQuery = queryOptions({
  queryKey: ["classes"],
  queryFn: async (): Promise<ClassRow[]> => {
    const { data, error } = await supabase.from("classes").select("id, name").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export function studentsQuery(classId: string | null) {
  return queryOptions({
    queryKey: ["students", classId ?? "all"],
    queryFn: async (): Promise<Student[]> => {
      let q = supabase.from("students").select("id, class_id, name, roll").order("roll");
      if (classId) q = q.eq("class_id", classId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });
}

export function noticingsQuery(studentIds: string[]) {
  return queryOptions({
    queryKey: ["noticings", [...studentIds].sort().join(",")],
    enabled: studentIds.length > 0,
    queryFn: async (): Promise<Noticing[]> => {
      const { data, error } = await supabase
        .from("noticings")
        .select("id, student_id, author_id, facet, valence, text, retracted, created_at")
        .in("student_id", studentIds)
        .eq("retracted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Noticing[];
    },
  });
}

export function studentQuery(studentId: string) {
  return queryOptions({
    queryKey: ["student", studentId],
    queryFn: async (): Promise<Student | null> => {
      const { data, error } = await supabase
        .from("students")
        .select("id, class_id, name, roll")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return (data as Student) ?? null;
    },
  });
}

export interface BadgeRow {
  id: string;
  student_id: string;
  teacher_id: string | null;
  key: string;
}

/** Every noticing for one child, retracted ones included (they stay in the record). */
export function studentNoticingsQuery(studentId: string) {
  return queryOptions({
    queryKey: ["student-noticings", studentId],
    queryFn: async (): Promise<Noticing[]> => {
      const { data, error } = await supabase
        .from("noticings")
        .select("id, student_id, author_id, facet, valence, text, retracted, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Noticing[];
    },
  });
}

export function badgesQuery(studentId: string, teacherId: string | undefined) {
  return queryOptions({
    queryKey: ["badges", studentId, teacherId ?? "anon"],
    enabled: !!teacherId,
    queryFn: async (): Promise<BadgeRow[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("id, student_id, teacher_id, key")
        .eq("student_id", studentId)
        .eq("teacher_id", teacherId!);
      if (error) throw error;
      return (data ?? []) as BadgeRow[];
    },
  });
}

export const staffQuery = queryOptions({
  queryKey: ["staff"],
  queryFn: async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase.from("profiles").select("id, name");
    if (error) throw error;
    return data ?? [];
  },
});

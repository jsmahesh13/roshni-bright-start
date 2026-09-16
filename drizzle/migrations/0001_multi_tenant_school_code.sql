-- PHASE 1: multi-tenant school-code model. Additive only.
-- Existing GHS Kadugodi data becomes the sandbox school.

-- 1. schools: code + sandbox flag
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT false;
UPDATE public.schools SET code = upper(btrim(join_code)) WHERE code IS NULL;
ALTER TABLE public.schools ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS schools_code_uniq ON public.schools (upper(btrim(code)));
UPDATE public.schools SET is_sandbox = true WHERE upper(btrim(code)) = 'KADUGODI-2026';

-- 2. the real test school
INSERT INTO public.schools (name, join_code, code, is_sandbox)
SELECT 'Roshni Test School', 'DEMO-GOV-01', 'DEMO-GOV-01', false
WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE upper(btrim(code)) = 'DEMO-GOV-01');

-- 3. classes gain grade + section, derived from the name ("6A" -> 6 / A)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS section text;
UPDATE public.classes
   SET grade = COALESCE(NULLIF(substring(btrim(name) from '^[0-9]+'), ''), btrim(name)),
       section = upper(COALESCE(NULLIF(substring(btrim(name) from '([A-Za-z]+)\s*$'), ''), 'A'))
 WHERE grade IS NULL OR section IS NULL;
ALTER TABLE public.classes ALTER COLUMN grade SET NOT NULL;
ALTER TABLE public.classes ALTER COLUMN section SET NOT NULL;
ALTER TABLE public.classes ALTER COLUMN school_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS classes_school_grade_section_uniq
  ON public.classes (school_id, grade, upper(section));

-- 4. students gain school_id + grade + section (nullable -> backfill -> NOT NULL)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section text;
UPDATE public.students s
   SET school_id = COALESCE(s.school_id, c.school_id),
       grade = COALESCE(s.grade, c.grade),
       section = COALESCE(s.section, c.section)
  FROM public.classes c
 WHERE c.id = s.class_id;
ALTER TABLE public.students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN grade SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN section SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_school_class_roll_uniq
  ON public.students (school_id, grade, upper(section), roll);

-- 5. noticings + attendance carry school_id
ALTER TABLE public.noticings ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
UPDATE public.noticings n SET school_id = s.school_id
  FROM public.students s WHERE s.id = n.student_id AND n.school_id IS NULL;
ALTER TABLE public.noticings ALTER COLUMN school_id SET NOT NULL;

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
UPDATE public.attendance a SET school_id = s.school_id
  FROM public.students s WHERE s.id = a.student_id AND a.school_id IS NULL;
ALTER TABLE public.attendance ALTER COLUMN school_id SET NOT NULL;

-- 6. profiles gain grade/section (nullable: admins have no class) + role check
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section text;
UPDATE public.profiles p
   SET grade = COALESCE(p.grade, c.grade), section = COALESCE(p.section, c.section)
  FROM public.classes c WHERE c.id = p.class_id;
ALTER TABLE public.profiles ALTER COLUMN school_id SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('teacher','admin'));
  END IF;
END $$;

-- 7. keep grade/section in sync with class_id on write
CREATE OR REPLACE FUNCTION public.sync_student_class()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record;
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    SELECT grade, section, school_id INTO c FROM public.classes WHERE id = NEW.class_id;
    IF FOUND THEN
      NEW.grade := COALESCE(NEW.grade, c.grade);
      NEW.section := COALESCE(NEW.section, c.section);
      NEW.school_id := COALESCE(NEW.school_id, c.school_id);
    END IF;
  ELSIF NEW.school_id IS NOT NULL AND NEW.grade IS NOT NULL AND NEW.section IS NOT NULL THEN
    SELECT id INTO NEW.class_id FROM public.classes
     WHERE school_id = NEW.school_id AND grade = NEW.grade AND upper(section) = upper(NEW.section);
  END IF;
  NEW.section := upper(NEW.section);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS students_sync_class ON public.students;
CREATE TRIGGER students_sync_class BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_class();

-- 8. helpers
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.get_user_class()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT class_id FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_class() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_school_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_class() TO authenticated, service_role;

-- 9. code verification RPC (service_role only; reached through a server function)
CREATE OR REPLACE FUNCTION public.verify_school_code(p_code text)
RETURNS TABLE(school_id uuid, school_name text, class_id uuid, grade text, section text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.name, c.id, c.grade, c.section
  FROM public.schools s
  LEFT JOIN public.classes c ON c.school_id = s.id
  WHERE upper(btrim(s.code)) = upper(btrim(p_code))
  ORDER BY c.grade, c.section
$$;
REVOKE EXECUTE ON FUNCTION public.verify_school_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_school_code(text) TO service_role;

-- 10. school-scoped RLS
DROP POLICY IF EXISTS "staff read students of visible classes" ON public.students;
CREATE POLICY "staff read students in scope" ON public.students FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR class_id = public.get_user_class()));

DROP POLICY IF EXISTS "staff insert students in scope" ON public.students;
CREATE POLICY "staff insert students in scope" ON public.students FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR class_id = public.get_user_class()));

DROP POLICY IF EXISTS "staff update students in scope" ON public.students;
CREATE POLICY "staff update students in scope" ON public.students FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR class_id = public.get_user_class()))
WITH CHECK (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR class_id = public.get_user_class()));

DROP POLICY IF EXISTS "staff read classes in scope" ON public.classes;
CREATE POLICY "staff read classes in scope" ON public.classes FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR id = public.get_user_class()));

DROP POLICY IF EXISTS "staff read attendance of visible classes" ON public.attendance;
CREATE POLICY "staff read attendance in scope" ON public.attendance FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id()
       AND (public.current_staff_role() = 'admin' OR class_id = public.get_user_class()));

DROP POLICY IF EXISTS "staff read noticings of visible classes" ON public.noticings;
CREATE POLICY "staff read noticings in scope" ON public.noticings FOR SELECT TO authenticated
USING (school_id = public.get_user_school_id()
       AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = noticings.student_id
                   AND (public.current_staff_role() = 'admin' OR s.class_id = public.get_user_class())));

GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.schools TO service_role;

-- 11. abort if any row was left unassigned
DO $$
DECLARE bad int;
BEGIN
  SELECT (SELECT count(*) FROM public.students WHERE school_id IS NULL)
       + (SELECT count(*) FROM public.noticings WHERE school_id IS NULL)
       + (SELECT count(*) FROM public.attendance WHERE school_id IS NULL)
       + (SELECT count(*) FROM public.profiles WHERE school_id IS NULL)
    INTO bad;
  IF bad > 0 THEN
    RAISE EXCEPTION 'Backfill verification failed: % rows without school_id', bad;
  END IF;
END $$;
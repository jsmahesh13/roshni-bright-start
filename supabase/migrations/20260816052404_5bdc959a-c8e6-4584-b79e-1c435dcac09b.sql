CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_staff_class()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id FROM public.profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "signed in staff can read profiles" ON public.profiles;
CREATE POLICY "staff read own and in-scope profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.current_staff_role() = 'admin'
  OR (class_id IS NOT NULL AND class_id = public.current_staff_class())
);

DROP POLICY IF EXISTS "signed in staff can read classes" ON public.classes;
CREATE POLICY "staff read classes in scope"
ON public.classes
FOR SELECT
TO authenticated
USING (
  public.current_staff_role() = 'admin'
  OR id = public.current_staff_class()
);

CREATE POLICY "staff update own badges"
ON public.badges
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX schools_join_code_lower_idx ON public.schools (lower(join_code));

GRANT SELECT ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.classes ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

INSERT INTO public.schools (name, join_code) VALUES ('GHS Kadugodi', 'KADUGODI-2026');

UPDATE public.classes SET school_id = (SELECT id FROM public.schools WHERE join_code = 'KADUGODI-2026')
  WHERE name IN ('6A','6B','7A','7B','8A');
UPDATE public.profiles SET school_id = (SELECT id FROM public.schools WHERE join_code = 'KADUGODI-2026');

CREATE POLICY "staff read own school" ON public.schools FOR SELECT TO authenticated
  USING (id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()));

-- Verify a submitted join code without ever exposing the code list.
CREATE OR REPLACE FUNCTION public.lookup_school(p_code text)
RETURNS TABLE (school_id uuid, school_name text, class_id uuid, class_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, c.id, c.name
  FROM public.schools s
  LEFT JOIN public.classes c ON c.school_id = s.id
  WHERE lower(btrim(s.join_code)) = lower(btrim(p_code))
  ORDER BY c.name
$$;

GRANT EXECUTE ON FUNCTION public.lookup_school(text) TO anon, authenticated;

-- Create the caller's staff profile after verifying the join code server-side.
CREATE OR REPLACE FUNCTION public.join_school(p_name text, p_code text, p_class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school uuid;
  v_class uuid := NULL;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id INTO v_school FROM public.schools
   WHERE lower(btrim(join_code)) = lower(btrim(coalesce(p_code, '')));
  IF v_school IS NULL THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  IF p_class_id IS NOT NULL THEN
    SELECT id INTO v_class FROM public.classes WHERE id = p_class_id AND school_id = v_school;
    IF v_class IS NULL THEN
      RAISE EXCEPTION 'class does not belong to that school';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, name, email, role, class_id, school_id)
  VALUES (
    auth.uid(),
    coalesce(nullif(btrim(p_name), ''), 'Teacher'),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'teacher',
    v_class,
    v_school
  )
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        class_id = EXCLUDED.class_id,
        school_id = EXCLUDED.school_id
    WHERE public.profiles.role <> 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_school(text, text, uuid) TO authenticated;
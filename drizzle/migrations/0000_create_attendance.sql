CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  status text NOT NULL DEFAULT 'present',
  marked_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_status_check CHECK (status IN ('present','absent'))
);

CREATE UNIQUE INDEX attendance_student_date_key ON public.attendance (student_id, date);
CREATE INDEX attendance_class_date_idx ON public.attendance (class_id, date);

GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read attendance of visible classes"
ON public.attendance FOR SELECT TO authenticated
USING (public.current_staff_role() = 'admin' OR class_id = public.current_staff_class());

CREATE POLICY "staff insert attendance for own class"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  marked_by = auth.uid()
  AND (public.current_staff_role() = 'admin' OR class_id = public.current_staff_class())
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.class_id = attendance.class_id)
);

CREATE POLICY "staff update attendance for own class"
ON public.attendance FOR UPDATE TO authenticated
USING (public.current_staff_role() = 'admin' OR class_id = public.current_staff_class())
WITH CHECK (
  marked_by = auth.uid()
  AND (public.current_staff_role() = 'admin' OR class_id = public.current_staff_class())
);
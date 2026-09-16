-- Keep shipped write paths working: derive school_id from the student on insert.
CREATE OR REPLACE FUNCTION public.set_school_from_student()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT s.school_id INTO NEW.school_id FROM public.students s WHERE s.id = NEW.student_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS noticings_set_school ON public.noticings;
CREATE TRIGGER noticings_set_school BEFORE INSERT OR UPDATE ON public.noticings
  FOR EACH ROW EXECUTE FUNCTION public.set_school_from_student();

DROP TRIGGER IF EXISTS attendance_set_school ON public.attendance;
CREATE TRIGGER attendance_set_school BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_school_from_student();
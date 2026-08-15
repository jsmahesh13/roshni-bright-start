
DROP POLICY "staff read students of visible classes" ON public.students;
DROP POLICY "staff read noticings of visible classes" ON public.noticings;
DROP POLICY "staff write noticings for visible classes" ON public.noticings;
DROP POLICY "staff read badges of visible classes" ON public.badges;
DROP POLICY "staff manage own badges" ON public.badges;

DROP FUNCTION IF EXISTS public.can_see_class(uuid);
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.my_class_id(uuid);

CREATE POLICY "staff read students of visible classes" ON public.students
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.class_id = students.class_id))
  );

CREATE POLICY "staff read noticings of visible classes" ON public.noticings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE s.id = noticings.student_id AND (p.role = 'admin' OR p.class_id = s.class_id))
  );

CREATE POLICY "staff write noticings for visible classes" ON public.noticings
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.students s
                JOIN public.profiles p ON p.id = auth.uid()
                WHERE s.id = noticings.student_id AND (p.role = 'admin' OR p.class_id = s.class_id))
  );

CREATE POLICY "staff read badges of visible classes" ON public.badges
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE s.id = badges.student_id AND (p.role = 'admin' OR p.class_id = s.class_id))
  );

CREATE POLICY "staff manage own badges" ON public.badges
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.students s
                JOIN public.profiles p ON p.id = auth.uid()
                WHERE s.id = badges.student_id AND (p.role = 'admin' OR p.class_id = s.class_id))
  );

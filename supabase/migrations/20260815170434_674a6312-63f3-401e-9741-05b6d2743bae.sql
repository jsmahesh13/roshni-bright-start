
-- ============ tables ============
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher','admin')),
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  roll integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX students_class_idx ON public.students(class_id);

CREATE TABLE public.noticings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  facet text NOT NULL CHECK (facet IN ('engagement','social','academic','affect','strength','action')),
  valence integer NOT NULL DEFAULT 0 CHECK (valence IN (-1,0,1)),
  text text NOT NULL,
  retracted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX noticings_student_idx ON public.noticings(student_id);
CREATE INDEX noticings_created_idx ON public.noticings(created_at);

CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (key IN ('pin','watch','follow','parent','celebrate','checkin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, teacher_id, key)
);

-- ============ grants ============
GRANT SELECT ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.noticings TO authenticated;
GRANT ALL ON public.noticings TO service_role;
GRANT SELECT, INSERT, DELETE ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;

-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _uid AND p.role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.my_class_id(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.class_id FROM public.profiles p WHERE p.id = _uid;
$$;

CREATE OR REPLACE FUNCTION public.can_see_class(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(auth.uid()) OR _class_id = public.my_class_id(auth.uid());
$$;

-- ============ RLS ============
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signed in staff can read classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "signed in staff can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff read students of visible classes" ON public.students
  FOR SELECT TO authenticated USING (public.can_see_class(class_id));

CREATE POLICY "staff read noticings of visible classes" ON public.noticings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND public.can_see_class(s.class_id))
  );

CREATE POLICY "staff write noticings for visible classes" ON public.noticings
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND public.can_see_class(s.class_id))
  );

CREATE POLICY "authors can retract own noticings" ON public.noticings
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "staff read badges of visible classes" ON public.badges
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND public.can_see_class(s.class_id))
  );

CREATE POLICY "staff manage own badges" ON public.badges
  FOR INSERT TO authenticated WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND public.can_see_class(s.class_id))
  );

CREATE POLICY "staff delete own badges" ON public.badges
  FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- ============ seed ============
INSERT INTO public.classes (name) VALUES ('6A'),('6B'),('7A'),('7B'),('8A');

DO $seed$
DECLARE
  first_names text[] := ARRAY['Aarav','Ananya','Rohit','Priya','Kiran','Meera','Sahil','Divya','Arjun','Kavya','Rahul','Sneha','Vikram','Pooja','Nikhil','Ishita','Manish','Lakshmi','Farhan','Anjali','Deepak','Ritu','Suresh','Neha','Imran','Shruti','Karthik','Bhavna','Ravi','Tanvi','Yusuf','Payal','Aditya','Swati','Naveen','Gauri','Harsha','Rekha','Vivek','Asha','Sanjay','Mitali','Prakash','Nisha'];
  last_names text[] := ARRAY['Sharma','Patil','Reddy','Kumar','Nair','Gowda','Iyer','Verma','Joshi','Das','Shetty','Mishra','Chauhan','Pillai','Bhat','Rao','Singh','Yadav','Desai','Kulkarni'];
  eng_pos text[] := ARRAY['Put his hand up twice today, first time this month.','Stayed back after class to finish the map.','Asked a question about the experiment nobody else thought of.','Volunteered to read aloud.'];
  eng_neg text[] := ARRAY['Looked out of the window most of the second period.','Book stayed closed for the whole lesson.','Did not start the exercise until I sat beside her.','Absent three days this week without a note.'];
  soc_pos text[] := ARRAY['Sat with the new boy at lunch.','Shared her lunch without being asked.','Explained the sum to two classmates at the back.','Was chosen by the group as their speaker.'];
  soc_neg text[] := ARRAY['Ate lunch alone again near the gate.','Left out when the teams were picked.','Two boys were teasing him about his slippers.','Very quiet in group work, let others talk.'];
  aca_pos text[] := ARRAY['Handwriting has become much clearer this term.','Got the long division right on the first try.','Remembered last week''s poem word for word.','Finished the worksheet before the bell.'];
  aca_neg text[] := ARRAY['Struggled to read the paragraph out loud.','Homework not done for the fourth time.','Copied the answer from the board without following.','Mixed up the units again in the sums.'];
  aff_pos text[] := ARRAY['Smiled a lot today, seemed lighter.','Laughed with the others during the game.','Seemed proud when the class clapped.','Came in humming this morning.'];
  aff_neg text[] := ARRAY['Head on the desk for most of the morning.','Teary at assembly, would not say why.','Snapped at a classmate over a pencil.','Looked very tired again today.'];
  str_pos text[] := ARRAY['Very good at drawing, the class notice board is his.','Sings beautifully, led the prayer today.','Fast runner, everyone wants her on their team.','Careful and patient with the younger children.'];
  act_txt text[] := ARRAY['Moved her to the front row.','Spoke to him for two minutes after class.','Will mention this at the parent meeting.','Paired her with Meera for the next project.'];
  cls RECORD;
  i int;
  sid uuid;
  sname text;
  kase text;
  n int;
  j int;
  d numeric;
  f text;
  v int;
  t text;
  seed_shift int := 0;
BEGIN
  FOR cls IN SELECT id, name FROM public.classes ORDER BY name LOOP
    FOR i IN 1..22 LOOP
      seed_shift := seed_shift + 1;
      sname := first_names[1 + ((seed_shift * 7) % array_length(first_names,1))] || ' ' ||
               last_names[1 + ((seed_shift * 5) % array_length(last_names,1))];
      INSERT INTO public.students (class_id, name, roll) VALUES (cls.id, sname, i) RETURNING id INTO sid;

      kase := 'normal';
      IF i IN (5, 12) AND cls.name IN ('7B','6A') THEN kase := 'invisible';
      ELSIF i = 3 THEN kase := 'concern_heavy';
      ELSIF i = 8 THEN kase := 'recent_run';
      ELSIF i = 1 THEN kase := 'thriving';
      END IF;

      IF kase = 'invisible' THEN n := 1 + (seed_shift % 3);
      ELSIF kase = 'thriving' THEN n := 16 + (seed_shift % 6);
      ELSIF kase = 'concern_heavy' THEN n := 11 + (seed_shift % 5);
      ELSIF kase = 'recent_run' THEN n := 12 + (seed_shift % 6);
      ELSE n := 6 + (seed_shift % 14);
      END IF;

      FOR j IN 1..n LOOP
        -- days ago
        IF kase = 'invisible' THEN
          d := 320 + (j * 97 + seed_shift * 13) % 380;
        ELSIF kase = 'recent_run' AND j > n - 4 THEN
          d := 2 + ((j * 5 + seed_shift) % 16);
        ELSE
          d := 4 + ((j * 61 + seed_shift * 29) % 720);
        END IF;

        -- facet + valence
        IF kase = 'concern_heavy' THEN
          v := -1;
          f := (ARRAY['engagement','social','academic','affect'])[1 + ((j + seed_shift) % 4)];
        ELSIF kase = 'thriving' THEN
          v := CASE WHEN (j + seed_shift) % 7 = 0 THEN -1 ELSE 1 END;
          f := CASE WHEN v = 1 THEN (ARRAY['strength','academic','social','engagement'])[1 + ((j + seed_shift) % 4)]
                    ELSE (ARRAY['affect','academic'])[1 + (j % 2)] END;
        ELSIF kase = 'recent_run' AND j > n - 4 THEN
          v := -1;
          f := (ARRAY['affect','engagement','social'])[1 + (j % 3)];
        ELSE
          v := (ARRAY[1,-1,1,0,-1,1])[1 + ((j * 3 + seed_shift) % 6)];
          IF v = 0 THEN f := 'action';
          ELSIF v = 1 THEN f := (ARRAY['strength','academic','social','engagement','affect'])[1 + ((j + seed_shift) % 5)];
          ELSE f := (ARRAY['engagement','social','academic','affect'])[1 + ((j + seed_shift) % 4)];
          END IF;
        END IF;

        IF f = 'action' THEN t := act_txt[1 + ((j + seed_shift) % 4)];
        ELSIF f = 'strength' THEN t := str_pos[1 + ((j + seed_shift) % 4)];
        ELSIF f = 'engagement' THEN t := CASE WHEN v = 1 THEN eng_pos[1 + ((j + seed_shift) % 4)] ELSE eng_neg[1 + ((j + seed_shift) % 4)] END;
        ELSIF f = 'social' THEN t := CASE WHEN v = 1 THEN soc_pos[1 + ((j + seed_shift) % 4)] ELSE soc_neg[1 + ((j + seed_shift) % 4)] END;
        ELSIF f = 'academic' THEN t := CASE WHEN v = 1 THEN aca_pos[1 + ((j + seed_shift) % 4)] ELSE aca_neg[1 + ((j + seed_shift) % 4)] END;
        ELSE t := CASE WHEN v = 1 THEN aff_pos[1 + ((j + seed_shift) % 4)] ELSE aff_neg[1 + ((j + seed_shift) % 4)] END;
        END IF;

        INSERT INTO public.noticings (student_id, facet, valence, text, created_at)
        VALUES (sid, f, v, t, now() - (d || ' days')::interval - ((j * 37 + seed_shift) % 8 || ' hours')::interval);
      END LOOP;
    END LOOP;
  END LOOP;
END
$seed$;

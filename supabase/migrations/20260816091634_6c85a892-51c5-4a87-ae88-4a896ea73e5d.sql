DELETE FROM public.badges;
DELETE FROM public.noticings;
DELETE FROM public.students;

DO $seed$
DECLARE
  first_names text[] := ARRAY['Aarav','Ananya','Rohit','Priya','Kiran','Meera','Sahil','Divya','Arjun','Kavya','Rahul','Sneha','Vikram','Pooja','Nikhil','Ishita','Manish','Lakshmi','Farhan','Anjali','Deepak','Ritu','Suresh','Neha','Imran','Shruti','Karthik','Bhavna','Ravi','Tanvi','Yusuf','Payal','Aditya','Swati','Naveen','Gauri','Harsha','Rekha','Vivek','Asha','Sanjay','Mitali','Prakash','Nisha'];
  last_names text[] := ARRAY['Sharma','Patil','Reddy','Kumar','Nair','Gowda','Iyer','Verma','Joshi','Das','Shetty','Mishra','Chauhan','Pillai','Bhat','Rao','Singh','Yadav','Desai','Kulkarni'];
  female_names text[] := ARRAY['Ananya','Priya','Meera','Divya','Kavya','Sneha','Pooja','Ishita','Lakshmi','Anjali','Ritu','Neha','Shruti','Bhavna','Tanvi','Payal','Swati','Gauri','Rekha','Asha','Mitali','Nisha'];
  eng_pos text[] := ARRAY['Put ~P~ hand up twice today, first time this month.','Stayed back after class to finish the map.','Asked a question about the experiment nobody else thought of.','Volunteered to read aloud.'];
  eng_neg text[] := ARRAY['Looked out of the window most of the second period.','Book stayed closed for the whole lesson.','Did not start the exercise until I sat beside ~O~.','Absent three days this week without a note.'];
  soc_pos text[] := ARRAY['Sat with the new child at lunch.','Shared ~P~ lunch without being asked.','Explained the sum to two classmates at the back.','Was chosen by the group as their speaker.'];
  soc_neg text[] := ARRAY['Ate lunch alone again near the gate.','Left out when the teams were picked.','Two children were teasing ~O~ about ~P~ slippers.','Very quiet in group work, let others talk.'];
  aca_pos text[] := ARRAY['Handwriting has become much clearer this term.','Got the long division right on the first try.','Remembered last week''s poem word for word.','Finished the worksheet before the bell.'];
  aca_neg text[] := ARRAY['Struggled to read the paragraph out loud.','Homework not done for the fourth time.','Copied the answer from the board without following.','Mixed up the units again in the sums.'];
  aff_pos text[] := ARRAY['Smiled a lot today, seemed lighter.','Laughed with the others during the game.','Seemed proud when the class clapped.','Came in humming this morning.'];
  aff_neg text[] := ARRAY['Head on the desk for most of the morning.','Teary at assembly, would not say why.','Snapped at a classmate over a pencil.','Looked very tired again today.'];
  str_pos text[] := ARRAY['Very good at drawing, the class notice board is ~P~ work.','Sings beautifully, led the prayer today.','Fast runner, everyone wants ~O~ on their team.','Careful and patient with the younger children.'];
  act_txt text[] := ARRAY['Moved ~O~ to the front row.','Spoke to ~O~ for two minutes after class.','Will mention this at the parent meeting.','Paired ~O~ with a partner for the next project.'];
  cls RECORD;
  i int;
  sid uuid;
  sname text;
  fname text;
  female boolean;
  kase text;
  n int;
  j int;
  d numeric;
  last_gap int;
  span int;
  f text;
  v int;
  t text;
  seed_shift int := 0;
BEGIN
  FOR cls IN SELECT id, name FROM public.classes ORDER BY name LOOP
    FOR i IN 1..22 LOOP
      seed_shift := seed_shift + 1;
      fname := first_names[1 + ((seed_shift * 7) % array_length(first_names,1))];
      sname := fname || ' ' || last_names[1 + ((seed_shift * 5) % array_length(last_names,1))];
      female := fname = ANY(female_names);
      INSERT INTO public.students (class_id, name, roll) VALUES (cls.id, sname, i) RETURNING id INTO sid;

      kase := 'normal';
      IF i IN (5, 12) AND cls.name IN ('7B','6A') THEN kase := 'invisible';
      ELSIF i IN (15, 19) THEN kase := 'fading';
      ELSIF i = 3 THEN kase := 'concern_heavy';
      ELSIF i = 8 THEN kase := 'recent_run';
      ELSIF i = 1 THEN kase := 'thriving';
      END IF;

      IF kase = 'invisible' THEN n := 1 + (seed_shift % 3);
      ELSIF kase = 'fading' THEN n := 5 + (seed_shift % 5);
      ELSIF kase = 'thriving' THEN n := 16 + (seed_shift % 6);
      ELSIF kase = 'concern_heavy' THEN n := 11 + (seed_shift % 5);
      ELSIF kase = 'recent_run' THEN n := 12 + (seed_shift % 6);
      ELSE n := 6 + (seed_shift % 14);
      END IF;

      IF kase = 'invisible' THEN last_gap := 38 + (seed_shift % 55); span := 200;
      ELSIF kase = 'fading' THEN last_gap := 44 + (seed_shift % 78); span := 260;
      ELSIF kase = 'recent_run' THEN last_gap := 1 + (seed_shift % 4); span := 300;
      ELSIF kase = 'concern_heavy' THEN last_gap := 2 + (seed_shift % 11); span := 300;
      ELSIF kase = 'thriving' THEN last_gap := 1 + (seed_shift % 9); span := 320;
      ELSE last_gap := 1 + (seed_shift % 13); span := 280;
      END IF;

      FOR j IN 1..n LOOP
        d := last_gap + ((n - j)::numeric * span / GREATEST(n - 1, 1))
             + ((j * 7 + seed_shift) % 5);

        IF kase = 'recent_run' AND j > n - 4 THEN
          d := 2 + ((j * 5 + seed_shift) % 16);
        END IF;

        IF kase = 'concern_heavy' THEN
          v := -1;
          f := (ARRAY['engagement','social','academic','affect'])[1 + ((j + seed_shift) % 4)];
        ELSIF kase = 'thriving' THEN
          v := CASE WHEN (j * 5 + seed_shift) % 7 = 0 THEN -1 ELSE 1 END;
          f := CASE WHEN v = 1 THEN (ARRAY['strength','academic','social','engagement'])[1 + ((j + seed_shift) % 4)]
                    ELSE (ARRAY['affect','academic'])[1 + (j % 2)] END;
        ELSIF kase = 'recent_run' AND j > n - 4 THEN
          v := -1;
          f := (ARRAY['affect','engagement','social'])[1 + (j % 3)];
        ELSE
          -- j*5 is coprime with 6, so every child gets a real mix of
          -- strengths, concerns and actions rather than a one-sided page
          v := (ARRAY[1,-1,1,0,-1,1])[1 + ((j * 5 + seed_shift) % 6)];
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

        t := replace(replace(t, '~P~', CASE WHEN female THEN 'her' ELSE 'his' END),
                     '~O~', CASE WHEN female THEN 'her' ELSE 'him' END);

        INSERT INTO public.noticings (student_id, facet, valence, text, created_at)
        VALUES (sid, f, v, t, now() - (d || ' days')::interval - ((j * 37 + seed_shift) % 8 || ' hours')::interval);
      END LOOP;
    END LOOP;
  END LOOP;
END
$seed$;

UPDATE public.noticings n
SET author_id = p.id
FROM public.profiles p
WHERE p.email = 'meena.rao@roshni.school'
  AND n.id IN (
    SELECT n2.id
    FROM public.noticings n2
    JOIN public.students s ON s.id = n2.student_id
    JOIN public.classes c ON c.id = s.class_id
    WHERE c.name = '7B'
    ORDER BY n2.created_at DESC
    LIMIT 3
  );

-- Platform-owner allowlist (no client policies: fail-closed, service-role only)
create table if not exists public.platform_owners (
  email text primary key,
  created_at timestamptz not null default now()
);
grant all on public.platform_owners to service_role;
alter table public.platform_owners enable row level security;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.platform_owners po
    join auth.users u on lower(u.email) = lower(po.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.is_acting_readonly()
returns boolean language sql stable set search_path = public as $$
  select coalesce(((auth.jwt() -> 'app_metadata') ->> 'acting_readonly')::boolean, false);
$$;

revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.is_acting_readonly() from public, anon;
grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.is_acting_readonly() to authenticated, service_role;

alter table public.schools add column if not exists archived_at timestamptz, add column if not exists archived_by uuid;
alter table public.classes add column if not exists archived_at timestamptz, add column if not exists archived_by uuid;
alter table public.students add column if not exists archived_at timestamptz, add column if not exists archived_by uuid;
alter table public.profiles add column if not exists archived_at timestamptz, add column if not exists archived_by uuid;

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles (lower(username)) where username is not null;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null check (action in ('archive','restore','create_school','create_admin','create_teacher','impersonate_view','reset_password')),
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "super admin reads audit log" on public.audit_log for select to authenticated using (public.is_super_admin());

drop policy if exists "staff read own school" on public.schools;
create policy "staff read own school" on public.schools for select to authenticated using (
  public.is_super_admin()
  or (archived_at is null and id = (select p.school_id from public.profiles p where p.id = auth.uid()))
);
create policy "super admin inserts schools" on public.schools for insert to authenticated
  with check (public.is_super_admin() and not public.is_acting_readonly());
create policy "super admin updates schools" on public.schools for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin() and not public.is_acting_readonly());

drop policy if exists "staff read own and in-scope profiles" on public.profiles;
create policy "staff read own and in-scope profiles" on public.profiles for select to authenticated using (
  public.is_super_admin()
  or (archived_at is null and (
    id = auth.uid()
    or public.current_staff_role() = 'admin'
    or (class_id is not null and class_id = public.current_staff_class())
  ))
);
create policy "super admin updates profiles" on public.profiles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin() and not public.is_acting_readonly());

drop policy if exists "staff read classes in scope" on public.classes;
create policy "staff read classes in scope" on public.classes for select to authenticated using (
  public.is_super_admin()
  or (archived_at is null and school_id = public.get_user_school_id()
      and (public.current_staff_role() = 'admin' or id = public.get_user_class()))
);
create policy "super admin inserts classes" on public.classes for insert to authenticated
  with check (public.is_super_admin() and not public.is_acting_readonly());
create policy "super admin updates classes" on public.classes for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin() and not public.is_acting_readonly());

drop policy if exists "staff read students in scope" on public.students;
create policy "staff read students in scope" on public.students for select to authenticated using (
  public.is_super_admin()
  or (archived_at is null and school_id = public.get_user_school_id()
      and (public.current_staff_role() = 'admin' or class_id = public.get_user_class()))
);
drop policy if exists "staff insert students in scope" on public.students;
create policy "staff insert students in scope" on public.students for insert to authenticated with check (
  not public.is_acting_readonly() and (
    public.is_super_admin()
    or (school_id = public.get_user_school_id()
        and (public.current_staff_role() = 'admin' or class_id = public.get_user_class()))
  )
);
drop policy if exists "staff update students in scope" on public.students;
create policy "staff update students in scope" on public.students for update to authenticated using (
  public.is_super_admin()
  or (school_id = public.get_user_school_id()
      and (public.current_staff_role() = 'admin' or class_id = public.get_user_class()))
) with check (
  not public.is_acting_readonly() and (
    public.is_super_admin()
    or (school_id = public.get_user_school_id()
        and (public.current_staff_role() = 'admin' or class_id = public.get_user_class()))
  )
);

drop policy if exists "staff read attendance in scope" on public.attendance;
create policy "staff read attendance in scope" on public.attendance for select to authenticated using (
  public.is_super_admin()
  or (school_id = public.get_user_school_id()
      and (public.current_staff_role() = 'admin' or class_id = public.get_user_class()))
);
drop policy if exists "staff insert attendance for own class" on public.attendance;
create policy "staff insert attendance for own class" on public.attendance for insert to authenticated with check (
  not public.is_acting_readonly()
  and marked_by = auth.uid()
  and (public.current_staff_role() = 'admin' or class_id = public.current_staff_class())
  and exists (select 1 from public.students s where s.id = attendance.student_id and s.class_id = attendance.class_id)
);
drop policy if exists "staff update attendance for own class" on public.attendance;
create policy "staff update attendance for own class" on public.attendance for update to authenticated using (
  public.current_staff_role() = 'admin' or class_id = public.current_staff_class()
) with check (
  not public.is_acting_readonly()
  and marked_by = auth.uid()
  and (public.current_staff_role() = 'admin' or class_id = public.current_staff_class())
);

drop policy if exists "staff read noticings in scope" on public.noticings;
create policy "staff read noticings in scope" on public.noticings for select to authenticated using (
  public.is_super_admin()
  or (school_id = public.get_user_school_id()
      and exists (select 1 from public.students s where s.id = noticings.student_id
                  and (public.current_staff_role() = 'admin' or s.class_id = public.get_user_class())))
);
drop policy if exists "staff write noticings for visible classes" on public.noticings;
create policy "staff write noticings for visible classes" on public.noticings for insert to authenticated with check (
  not public.is_acting_readonly()
  and author_id = auth.uid()
  and exists (select 1 from public.students s join public.profiles p on p.id = auth.uid()
              where s.id = noticings.student_id
                and (p.role = 'admin' or p.class_id = s.class_id))
);
drop policy if exists "authors can retract own noticings" on public.noticings;
create policy "authors can retract own noticings" on public.noticings for update to authenticated using (
  not public.is_acting_readonly() and author_id = auth.uid()
) with check (
  not public.is_acting_readonly() and author_id = auth.uid()
);

drop policy if exists "staff read badges of visible classes" on public.badges;
create policy "staff read badges of visible classes" on public.badges for select to authenticated using (
  public.is_super_admin()
  or exists (select 1 from public.students s join public.profiles p on p.id = auth.uid()
             where s.id = badges.student_id and (p.role = 'admin' or p.class_id = s.class_id))
);
drop policy if exists "staff manage own badges" on public.badges;
create policy "staff manage own badges" on public.badges for insert to authenticated with check (
  not public.is_acting_readonly()
  and teacher_id = auth.uid()
  and exists (select 1 from public.students s join public.profiles p on p.id = auth.uid()
              where s.id = badges.student_id and (p.role = 'admin' or p.class_id = s.class_id))
);
drop policy if exists "staff update own badges" on public.badges;
create policy "staff update own badges" on public.badges for update to authenticated using (
  not public.is_acting_readonly() and teacher_id = auth.uid()
) with check (
  not public.is_acting_readonly() and teacher_id = auth.uid()
);
drop policy if exists "staff delete own badges" on public.badges;
create policy "staff delete own badges" on public.badges for delete to authenticated using (
  not public.is_acting_readonly() and teacher_id = auth.uid()
);

-- Verification: live counts must be at least the known snapshot (growth is fine, loss is not)
do $$
declare s int; n int; a int;
begin
  select count(*) into s from public.students;
  select count(*) into n from public.noticings;
  select count(*) into a from public.attendance;
  if s < 110 or n < 1329 or a < 66 then
    raise exception 'verification failed: students %, noticings %, attendance %', s, n, a;
  end if;
end $$;

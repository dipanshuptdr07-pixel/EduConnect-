-- EduConnect
-- Migration 016
-- Core tenant RLS policies.

begin;

-- =========================================================
-- HELPER
-- =========================================================

create or replace function public.is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'ADMIN';
$$;

-- =========================================================
-- CLASSES
-- =========================================================

drop policy if exists classes_tenant_select on public.classes;
drop policy if exists classes_admin_write on public.classes;

create policy classes_tenant_select
on public.classes
for select
to authenticated
using (
  school_id = public.current_school_id()
);

create policy classes_admin_write
on public.classes
for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.is_school_admin()
)
with check (
  school_id = public.current_school_id()
  and public.is_school_admin()
);

-- =========================================================
-- STREAMS
-- =========================================================

drop policy if exists streams_tenant_select on public.streams;
drop policy if exists streams_admin_write on public.streams;

create policy streams_tenant_select
on public.streams
for select
to authenticated
using (
  school_id = public.current_school_id()
);

create policy streams_admin_write
on public.streams
for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.is_school_admin()
)
with check (
  school_id = public.current_school_id()
  and public.is_school_admin()
);

-- =========================================================
-- SECTIONS
-- =========================================================

drop policy if exists sections_tenant_select on public.sections;
drop policy if exists sections_admin_write on public.sections;
drop policy if exists sections_admin_stream_write on public.sections;
drop policy if exists sections_admin_password_update on public.sections;

create policy sections_tenant_select
on public.sections
for select
to authenticated
using (
  school_id = public.current_school_id()
);

create policy sections_admin_write
on public.sections
for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.is_school_admin()
)
with check (
  school_id = public.current_school_id()
  and public.is_school_admin()
);

-- =========================================================
-- SUBJECTS
-- =========================================================

drop policy if exists subjects_tenant_select on public.subjects;
drop policy if exists subjects_admin_write on public.subjects;

create policy subjects_tenant_select
on public.subjects
for select
to authenticated
using (
  school_id = public.current_school_id()
);

create policy subjects_admin_write
on public.subjects
for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.is_school_admin()
)
with check (
  school_id = public.current_school_id()
  and public.is_school_admin()
);

-- =========================================================
-- STUDENTS
-- =========================================================

drop policy if exists student_profiles_tenant_select
on public.student_profiles;

create policy student_profiles_tenant_select
on public.student_profiles
for select
to authenticated
using (
  school_id = public.current_school_id()
);

-- =========================================================
-- TEACHERS
-- =========================================================

drop policy if exists teacher_profiles_tenant_select
on public.teacher_profiles;

create policy teacher_profiles_tenant_select
on public.teacher_profiles
for select
to authenticated
using (
  school_id = public.current_school_id()
);

-- =========================================================
-- TEACHER ASSIGNMENTS
-- =========================================================

drop policy if exists teacher_assignments_tenant_select
on public.teacher_assignments;

create policy teacher_assignments_tenant_select
on public.teacher_assignments
for select
to authenticated
using (
  school_id = public.current_school_id()
);

-- =========================================================
-- SCHOOL SETTINGS
-- =========================================================

drop policy if exists school_settings_tenant_select
on public.school_settings;

create policy school_settings_tenant_select
on public.school_settings
for select
to authenticated
using (
  school_id = public.current_school_id()
);

commit;

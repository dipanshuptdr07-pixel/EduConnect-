-- EduConnect production foundation: multi-school tenancy + RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('STUDENT','TEACHER','ADMIN');
create type public.attendance_status as enum ('PRESENT','ABSENT','LEAVE');
create type public.leave_status as enum ('PENDING','APPROVED','REJECTED');
create type public.priority_level as enum ('LOW','NORMAL','HIGH','URGENT');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9]{4,12}$'),
  name text not null,
  logo_url text,
  address text,
  contact_phone text,
  academic_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  role public.app_role not null,
  full_name text not null,
  phone text not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, phone)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  grade text not null,
  created_at timestamptz not null default now(),
  unique(school_id, name)
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  unique(class_id, name)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  unique(school_id, name)
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  admission_no text not null,
  class_id uuid references public.classes(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(school_id, admission_no)
);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_no text not null,
  created_at timestamptz not null default now(),
  unique(school_id, employee_no)
);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  unique(teacher_id, class_id, section_id, subject_id)
);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_date date not null default current_date,
  due_date date not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  check (due_date >= assigned_date)
);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  submitted_at timestamptz,
  status text not null default 'PENDING' check(status in ('PENDING','SUBMITTED','LATE','REVIEWED')),
  attachment_url text,
  teacher_feedback text,
  unique(homework_id, student_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  date date not null,
  status public.attendance_status not null,
  marked_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(student_id, date, subject_id)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  priority public.priority_level not null default 'NORMAL',
  publish_at timestamptz not null default now(),
  target_role public.app_role,
  target_class_id uuid references public.classes(id) on delete set null,
  target_section_id uuid references public.sections(id) on delete set null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'GENERAL',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  room text,
  notes text,
  created_at timestamptz not null default now(),
  check(end_time > start_time)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  marks numeric(7,2) not null check(marks >= 0),
  max_marks numeric(7,2) not null check(max_marks > 0 and marks <= max_marks),
  grade text,
  comments text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(student_id, exam_id, subject_id)
);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null check(amount >= 0),
  due_date date not null,
  status text not null default 'PENDING' check(status in ('PAID','PENDING','OVERDUE')),
  receipt_ref text,
  created_at timestamptz not null default now()
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text not null,
  status public.leave_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check(to_date >= from_date)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  image_url text,
  created_at timestamptz not null default now(),
  check(ends_at is null or ends_at >= starts_at)
);

create table public.ptm (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'SCHEDULED',
  instructions text,
  check(ends_at > starts_at)
);

create table public.school_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  bucket text not null,
  object_path text not null,
  mime_type text not null,
  size_bytes bigint not null check(size_bytes > 0 and size_bytes <= 20971520),
  created_at timestamptz not null default now(),
  unique(bucket, object_path)
);

create or replace function public.current_school_id() returns uuid
language sql stable security definer set search_path = public
as $$ select school_id from public.profiles where id = auth.uid() and is_active = true limit 1 $$;

create or replace function public.current_role() returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and is_active = true limit 1 $$;

create or replace function public.resolve_school_code(p_code text) returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.schools where code = upper(trim(p_code)) limit 1 $$;

grant execute on function public.resolve_school_code(text) to anon, authenticated;
grant execute on function public.current_school_id() to authenticated;
grant execute on function public.current_role() to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger schools_updated before update on public.schools for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger school_settings_updated before update on public.school_settings for each row execute function public.set_updated_at();

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.notices enable row level security;
alter table public.notifications enable row level security;
alter table public.exams enable row level security;
alter table public.results enable row level security;
alter table public.fees enable row level security;
alter table public.leave_requests enable row level security;
alter table public.events enable row level security;
alter table public.ptm enable row level security;
alter table public.school_settings enable row level security;
alter table public.files enable row level security;
-- Tenant visibility: every school-owned table requires current_school_id() match.
do $$ declare t text; begin foreach t in array array['classes','sections','subjects','student_profiles','teacher_profiles','teacher_assignments','homework','homework_submissions','attendance','notices','notifications','exams','results','fees','leave_requests','events','ptm','school_settings','files'] loop execute format('create policy %I on public.%I for select using (school_id = public.current_school_id())', t||'_tenant_select', t); end loop; end $$;
create policy schools_self_select on public.schools for select using (id = public.current_school_id());
create policy profiles_tenant_select on public.profiles for select using (school_id = public.current_school_id());

-- Write policies are role-aware and school-scoped.
create policy profiles_self_update on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and school_id=public.current_school_id());
create policy admin_profiles_write on public.profiles for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());

create policy admin_school_write on public.schools for update using (id=public.current_school_id() and public.current_role()='ADMIN') with check (id=public.current_school_id());
create policy admin_classes_write on public.classes for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy admin_sections_write on public.sections for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy admin_subjects_write on public.subjects for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy admin_student_write on public.student_profiles for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy admin_teacher_write on public.teacher_profiles for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy teacher_assign_write on public.teacher_assignments for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());

create policy homework_teacher_write on public.homework for all using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER'));
create policy homework_student_submission on public.homework_submissions for insert with check (school_id=public.current_school_id());
create policy homework_student_update on public.homework_submissions for update using (school_id=public.current_school_id());
create policy attendance_staff_write on public.attendance for all using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER'));
create policy notices_staff_write on public.notices for all using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER'));
create policy notifications_self_update on public.notifications for update using (school_id=public.current_school_id() and user_id=auth.uid()) with check (school_id=public.current_school_id() and user_id=auth.uid());
create policy admin_exam_write on public.exams for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy result_staff_write on public.results for all using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id());
create policy admin_fee_write on public.fees for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy leave_student_insert on public.leave_requests for insert with check (school_id=public.current_school_id() and public.current_role()='STUDENT');
create policy leave_staff_update on public.leave_requests for update using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id());
create policy admin_event_write on public.events for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy admin_ptm_write on public.ptm for all using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER')) with check (school_id=public.current_school_id());
create policy admin_settings_write on public.school_settings for all using (school_id=public.current_school_id() and public.current_role()='ADMIN') with check (school_id=public.current_school_id());
create policy file_owner_write on public.files for all using (school_id=public.current_school_id() and owner_id=auth.uid()) with check (school_id=public.current_school_id() and owner_id=auth.uid());

-- Student-specific read boundaries on sensitive records.
drop policy if exists student_profiles_tenant_select on public.student_profiles;
create policy student_profiles_scoped_select on public.student_profiles for select using (school_id=public.current_school_id() and (profile_id=auth.uid() or public.current_role() in ('ADMIN','TEACHER')));
drop policy if exists teacher_profiles_tenant_select on public.teacher_profiles;
create policy teacher_profiles_scoped_select on public.teacher_profiles for select using (school_id=public.current_school_id());
drop policy if exists results_tenant_select on public.results;
create policy results_scoped_select on public.results for select using (school_id=public.current_school_id() and (public.current_role() in ('ADMIN','TEACHER') or student_id in (select id from public.student_profiles where profile_id=auth.uid())));
drop policy if exists fees_tenant_select on public.fees;
create policy fees_scoped_select on public.fees for select using (school_id=public.current_school_id() and (public.current_role()='ADMIN' or student_id in (select id from public.student_profiles where profile_id=auth.uid())));
drop policy if exists leave_requests_tenant_select on public.leave_requests;
create policy leave_scoped_select on public.leave_requests for select using (school_id=public.current_school_id() and (public.current_role() in ('ADMIN','TEACHER') or student_id in (select id from public.student_profiles where profile_id=auth.uid())));
drop policy if exists attendance_tenant_select on public.attendance;
create policy attendance_scoped_select on public.attendance for select using (school_id=public.current_school_id() and (public.current_role() in ('ADMIN','TEACHER') or student_id in (select id from public.student_profiles where profile_id=auth.uid())));

-- Storage bucket is created in Supabase dashboard/CLI because bucket policy deployment differs by environment.
-- Recommended bucket: educonnect-files, private, 20 MB object limit. Use signed URLs from server-side flows.

-- Optional school-scoped login identifier resolver for future auth adapters.
create or replace function public.resolve_login_identity(p_code text, p_phone text) returns text
language sql stable security definer set search_path = public
as $$
  select lower(s.code)||'.'||regexp_replace(p_phone,'\\D','','g')||'@accounts.educonnect.app'
  from public.schools s where s.code=upper(trim(p_code)) limit 1
$$;
grant execute on function public.resolve_login_identity(text,text) to anon, authenticated;

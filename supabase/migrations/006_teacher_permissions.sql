-- EduConnect
-- Migration 006
-- Teacher granular permissions.

begin;

create table if not exists public.teacher_permissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,

  can_manage_students boolean not null default false,
  can_manage_attendance boolean not null default true,
  can_manage_homework boolean not null default true,
  can_manage_results boolean not null default false,
  can_manage_notices boolean not null default false,
  can_manage_ptm boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(teacher_id)
);

create index if not exists teacher_permissions_school_idx
  on public.teacher_permissions(school_id);

create index if not exists teacher_permissions_teacher_idx
  on public.teacher_permissions(teacher_id);

alter table public.teacher_permissions enable row level security;

create policy teacher_permissions_tenant_select
on public.teacher_permissions
for select
using (
  school_id = public.current_school_id()
  and (
    public.current_role() = 'ADMIN'
    or teacher_id in (
      select tp.id
      from public.teacher_profiles tp
      where tp.profile_id = auth.uid()
    )
  )
);

create policy teacher_permissions_admin_write
on public.teacher_permissions
for all
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
)
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

drop trigger if exists teacher_permissions_updated
on public.teacher_permissions;

create trigger teacher_permissions_updated
before update on public.teacher_permissions
for each row
execute function public.set_updated_at();

commit;

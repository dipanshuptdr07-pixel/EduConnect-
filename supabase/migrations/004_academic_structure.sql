-- EduConnect
-- Migration 004
-- Academic hierarchy:
-- School → Class → Stream (optional) → Section → Student

begin;

create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(class_id, name)
);

alter table public.sections
  add column if not exists stream_id uuid
  references public.streams(id)
  on delete set null;

alter table public.sections
  add column if not exists is_active boolean not null default true;

alter table public.sections
  add column if not exists updated_at timestamptz not null default now();

create index if not exists streams_school_idx
  on public.streams(school_id);

create index if not exists streams_class_idx
  on public.streams(class_id);

create index if not exists sections_stream_idx
  on public.sections(stream_id);

create index if not exists sections_school_class_idx
  on public.sections(school_id, class_id);

alter table public.streams enable row level security;

create policy streams_tenant_select
on public.streams
for select
using (
  school_id = public.current_school_id()
);

create policy streams_admin_write
on public.streams
for all
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
)
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

create policy sections_admin_stream_write
on public.sections
for all
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
)
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

drop trigger if exists streams_updated on public.streams;

create trigger streams_updated
before update on public.streams
for each row
execute function public.set_updated_at();

commit;

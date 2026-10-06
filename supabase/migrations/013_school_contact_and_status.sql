-- EduConnect
-- Migration 013
-- School production metadata.

begin;

alter table public.schools
  add column if not exists contact_email text;

alter table public.schools
  add column if not exists status text not null default 'ACTIVE';

alter table public.schools
  add column if not exists created_at timestamptz not null default now();

alter table public.schools
  add column if not exists updated_at timestamptz not null default now();

alter table public.schools
  drop constraint if exists schools_status_check;

alter table public.schools
  add constraint schools_status_check
  check (status in ('ACTIVE', 'SUSPENDED'));

create index if not exists schools_status_idx
  on public.schools(status);

create trigger schools_updated
before update on public.schools
for each row
execute function public.set_updated_at();

commit;

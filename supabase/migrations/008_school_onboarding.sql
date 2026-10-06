-- EduConnect
-- Migration 008
-- Platform Owner school onboarding foundation.

begin;

create table if not exists public.platform_owners (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_owners_active_idx
  on public.platform_owners(is_active);

alter table public.platform_owners enable row level security;

create policy platform_owner_self_select
on public.platform_owners
for select
using (
  id = auth.uid()
  and is_active = true
);

create policy platform_owner_self_update
on public.platform_owners
for update
using (
  id = auth.uid()
  and is_active = true
)
with check (
  id = auth.uid()
  and is_active = true
);

drop trigger if exists platform_owners_updated
on public.platform_owners;

create trigger platform_owners_updated
before update on public.platform_owners
for each row
execute function public.set_updated_at();

-- Owner check helper.
create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_owners
    where id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function public.is_platform_owner()
from public;

grant execute on function public.is_platform_owner()
to authenticated;

-- Create a school and initialize its settings atomically.
create or replace function public.owner_create_school(
  p_code text,
  p_name text,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_contact_phone text default null,
  p_contact_email text default null,
  p_academic_year text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_full_address text;
begin
  if not public.is_platform_owner() then
    raise exception 'Platform owner access required';
  end if;

  if trim(coalesce(p_code, '')) = '' then
    raise exception 'School code is required';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'School name is required';
  end if;

  v_full_address :=
    nullif(
      trim(
        concat_ws(
          ', ',
          nullif(trim(p_address), ''),
          nullif(trim(p_city), ''),
          nullif(trim(p_state), '')
        )
      ),
      ''
    );

  insert into public.schools (
    code,
    name,
    address,
    contact_phone,
    academic_year
  )
  values (
    upper(trim(p_code)),
    trim(p_name),
    v_full_address,
    nullif(trim(p_contact_phone), ''),
    nullif(trim(p_academic_year), '')
  )
  returning id into v_school_id;

  perform public.initialize_school_settings(v_school_id);

  return v_school_id;

exception
  when unique_violation then
    raise exception 'A school with this code already exists';
end;
$$;

revoke all on function public.owner_create_school(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
from public;

grant execute on function public.owner_create_school(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
to authenticated;

commit;

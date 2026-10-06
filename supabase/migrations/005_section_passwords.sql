-- EduConnect
-- Migration 005
-- Section-level student access password.
-- Never stores plaintext passwords.

begin;

create extension if not exists pgcrypto;

alter table public.sections
  add column if not exists section_password_hash text;

alter table public.sections
  add column if not exists password_updated_at timestamptz;

create index if not exists sections_password_lookup_idx
  on public.sections(id, school_id);

-- Only school admins can create/change section passwords.
create policy sections_admin_password_update
on public.sections
for update
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
)
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

-- Helper for the backend/Edge Functions.
-- The plaintext password is supplied only during the operation
-- and is immediately converted to a bcrypt-compatible crypt hash.
create or replace function public.set_section_password(
  p_section_id uuid,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
begin
  if public.current_role() <> 'ADMIN' then
    raise exception 'Admin access required';
  end if;

  if length(coalesce(trim(p_password), '')) < 6 then
    raise exception 'Section password must be at least 6 characters';
  end if;

  select school_id
    into v_school_id
  from public.sections
  where id = p_section_id
    and school_id = public.current_school_id()
    and is_active = true;

  if v_school_id is null then
    raise exception 'Section not found';
  end if;

  update public.sections
  set
    section_password_hash = crypt(p_password, gen_salt('bf', 12)),
    password_updated_at = now(),
    updated_at = now()
  where id = p_section_id
    and school_id = v_school_id;

  return true;
end;
$$;

revoke all on function public.set_section_password(uuid, text)
from public;

grant execute on function public.set_section_password(uuid, text)
to authenticated;

commit;

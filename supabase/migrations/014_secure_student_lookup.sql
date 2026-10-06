-- EduConnect
-- Migration 014
-- Secure student account lookup.

begin;

drop function if exists public.resolve_student_accounts(text, text);

create or replace function public.resolve_student_accounts(
  p_code text,
  p_phone text
)
returns table (
  student_id uuid,
  profile_id uuid,
  display_name text,
  class_id uuid,
  section_id uuid,
  section_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.id as student_id,
    p.id as profile_id,

    -- Do not expose full personal details during account discovery.
    case
      when length(trim(coalesce(p.full_name, ''))) > 2
      then left(trim(p.full_name), 1) || '•••'
      else 'Student'
    end as display_name,

    sp.class_id,
    sp.section_id,
    s.name as section_name

  from public.student_profiles sp

  join public.profiles p
    on p.id = sp.profile_id

  join public.schools sc
    on sc.id = sp.school_id

  left join public.sections s
    on s.id = sp.section_id

  where sc.code = upper(trim(p_code))
    and sc.status = 'ACTIVE'

    and regexp_replace(
      coalesce(p.phone, ''),
      '\D',
      '',
      'g'
    ) = regexp_replace(
      coalesce(p_phone, ''),
      '\D',
      '',
      'g'
    )

    and p.role = 'STUDENT'
    and p.is_active = true
    and sp.school_id = sc.id

  order by display_name;
$$;

revoke all
on function public.resolve_student_accounts(text, text)
from public;

grant execute
on function public.resolve_student_accounts(text, text)
to anon, authenticated;

commit;

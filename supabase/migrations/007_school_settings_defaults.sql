-- EduConnect
-- Migration 007
-- Default school configuration.

begin;

create or replace function public.initialize_school_settings(
  p_school_id uuid
)
returns public.school_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.school_settings;
begin
  insert into public.school_settings (
    school_id,
    settings
  )
  values (
    p_school_id,
    jsonb_build_object(
      'language', 'en',
      'theme', 'system',
      'notifications', jsonb_build_object(
        'homework', true,
        'attendance', true,
        'results', true,
        'notices', true,
        'events', true,
        'ptm', true
      ),
      'academic', jsonb_build_object(
        'streams_enabled', false,
        'current_year', null
      ),
      'student', jsonb_build_object(
        'allow_feedback', true,
        'allow_leave_requests', true,
        'study_ai_enabled', false
      ),
      'branding', jsonb_build_object(
        'show_school_logo', true,
        'show_educonnect_branding', true
      )
    )
  )
  on conflict (school_id) do nothing
  returning *
  into v_settings;

  if v_settings.school_id is null then
    select *
      into v_settings
    from public.school_settings
    where school_id = p_school_id;
  end if;

  return v_settings;
end;
$$;

revoke all on function public.initialize_school_settings(uuid)
from public;

grant execute on function public.initialize_school_settings(uuid)
to authenticated;

commit;

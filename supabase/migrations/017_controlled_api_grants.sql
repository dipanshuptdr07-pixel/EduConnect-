-- EduConnect
-- Migration 017
-- Controlled API privileges.

begin;

-- Core school data
grant select on public.schools to authenticated;
grant select on public.profiles to authenticated;

-- Academic structure
grant select, insert, update, delete
on public.classes, public.streams, public.sections, public.subjects
to authenticated;

-- Student / teacher data
grant select, insert, update, delete
on public.student_profiles, public.teacher_profiles
to authenticated;

grant select, insert, update, delete
on public.teacher_assignments, public.teacher_permissions
to authenticated;

-- School settings
grant select, insert, update
on public.school_settings
to authenticated;

-- Academic modules
grant select, insert, update, delete
on public.homework,
   public.homework_submissions,
   public.attendance,
   public.notices,
   public.notifications,
   public.exams,
   public.results,
   public.fees,
   public.leave_requests,
   public.events,
   public.ptm
to authenticated;

-- File metadata
grant select, insert, update, delete
on public.files
to authenticated;

commit;

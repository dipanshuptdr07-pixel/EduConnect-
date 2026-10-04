-- EduConnect v1.1: tighter tenant boundaries, workflow helpers and daily attendance upsert key.
-- Run after 001_initial.sql.

create or replace function public.teacher_has_assignment(p_class_id uuid, p_section_id uuid, p_subject_id uuid default null)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1
    from public.teacher_profiles tp
    join public.teacher_assignments ta on ta.teacher_id = tp.id
    where tp.profile_id = auth.uid()
      and tp.school_id = public.current_school_id()
      and ta.school_id = public.current_school_id()
      and ta.class_id = p_class_id
      and ta.section_id = p_section_id
      and (p_subject_id is null or ta.subject_id = p_subject_id)
  )
$$;

grant execute on function public.teacher_has_assignment(uuid,uuid,uuid) to authenticated;

alter table public.attendance add column if not exists attendance_key text generated always as (student_id::text || ':' || date::text || ':' || coalesce(subject_id::text,'daily')) stored;
create unique index if not exists attendance_key_unique on public.attendance(attendance_key);

-- Replace broad tenant-select policies for records whose audience depends on role/class.
drop policy if exists homework_tenant_select on public.homework;
drop policy if exists exams_tenant_select on public.exams;
drop policy if exists notices_tenant_select on public.notices;
drop policy if exists ptm_tenant_select on public.ptm;
drop policy if exists homework_submissions_tenant_select on public.homework_submissions;

drop policy if exists attendance_staff_write on public.attendance;
create policy attendance_staff_write_scoped on public.attendance for all
using (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and public.teacher_has_assignment(class_id,section_id,subject_id))))
with check (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and public.teacher_has_assignment(class_id,section_id,subject_id))));

create policy homework_scoped_select on public.homework for select using (
 school_id=public.current_school_id() and (
   public.current_role()='ADMIN'
   or (public.current_role()='TEACHER' and public.teacher_has_assignment(class_id,section_id,subject_id))
   or (public.current_role()='STUDENT' and exists(select 1 from public.student_profiles sp where sp.profile_id=auth.uid() and sp.class_id=homework.class_id and sp.section_id=homework.section_id))
 )
);

create policy homework_submission_scoped_select on public.homework_submissions for select using (
 school_id=public.current_school_id() and (
   public.current_role()='ADMIN'
   or (public.current_role()='STUDENT' and student_id in (select id from public.student_profiles where profile_id=auth.uid()))
   or (public.current_role()='TEACHER' and exists(select 1 from public.homework h where h.id=homework_id and public.teacher_has_assignment(h.class_id,h.section_id,h.subject_id)))
 )
);

drop policy if exists homework_student_submission on public.homework_submissions;
drop policy if exists homework_student_update on public.homework_submissions;
create policy homework_student_submission_scoped on public.homework_submissions for insert
with check (school_id=public.current_school_id() and public.current_role()='STUDENT' and student_id in (select id from public.student_profiles where profile_id=auth.uid()));
create policy homework_student_update_scoped on public.homework_submissions for update
using (school_id=public.current_school_id() and ((public.current_role()='STUDENT' and student_id in (select id from public.student_profiles where profile_id=auth.uid())) or public.current_role()='ADMIN' or (public.current_role()='TEACHER' and exists(select 1 from public.homework h where h.id=homework_id and public.teacher_has_assignment(h.class_id,h.section_id,h.subject_id)))))
with check (school_id=public.current_school_id());

create policy exams_scoped_select on public.exams for select using (
 school_id=public.current_school_id() and (
  public.current_role()='ADMIN'
  or (public.current_role()='TEACHER' and public.teacher_has_assignment(class_id,section_id,subject_id))
  or (public.current_role()='STUDENT' and exists(select 1 from public.student_profiles sp where sp.profile_id=auth.uid() and sp.class_id=exams.class_id and sp.section_id=exams.section_id))
 )
);

create policy notices_scoped_select on public.notices for select using (
 school_id=public.current_school_id() and (
  public.current_role() in ('ADMIN','TEACHER')
  or (public.current_role()='STUDENT' and (target_role is null or target_role='STUDENT') and exists(select 1 from public.student_profiles sp where sp.profile_id=auth.uid() and (target_class_id is null or sp.class_id=target_class_id) and (target_section_id is null or sp.section_id=target_section_id)))
 )
);

create policy ptm_scoped_select on public.ptm for select using (
 school_id=public.current_school_id() and (
  public.current_role()='ADMIN'
  or (public.current_role()='TEACHER' and exists(select 1 from public.teacher_profiles tp where tp.id=teacher_id and tp.profile_id=auth.uid()))
  or (public.current_role()='STUDENT' and exists(select 1 from public.student_profiles sp where sp.profile_id=auth.uid() and sp.class_id=ptm.class_id and sp.section_id=ptm.section_id))
 )
);

-- Only admins can publish exam schedules/fees/events; teachers can manage authorized results/notices/PTM.
drop policy if exists result_staff_write on public.results;
create policy result_staff_write_scoped on public.results for all
using (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and exists(select 1 from public.exams e where e.id=exam_id and public.teacher_has_assignment(e.class_id,e.section_id,e.subject_id)))))
with check (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and exists(select 1 from public.exams e where e.id=exam_id and public.teacher_has_assignment(e.class_id,e.section_id,e.subject_id)))));

drop policy if exists notices_staff_write on public.notices;
create policy notices_staff_write_scoped on public.notices for all
using (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER'))
with check (school_id=public.current_school_id() and public.current_role() in ('ADMIN','TEACHER'));

-- Students may only create leave requests for themselves.
drop policy if exists leave_student_insert on public.leave_requests;
create policy leave_student_insert_scoped on public.leave_requests for insert
with check (school_id=public.current_school_id() and public.current_role()='STUDENT' and student_id in (select id from public.student_profiles where profile_id=auth.uid()));

-- Automatic notification fan-out for targeted notices. This is intentionally server-side.
create or replace function public.notify_notice_targets() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(school_id,user_id,title,body,type)
  select p.school_id,p.id,new.title,new.body,'NOTICE'
  from public.profiles p
  left join public.student_profiles sp on sp.profile_id=p.id
  where p.school_id=new.school_id and p.is_active
    and (new.target_role is null or p.role=new.target_role)
    and (new.target_class_id is null or sp.class_id=new.target_class_id)
    and (new.target_section_id is null or sp.section_id=new.target_section_id);
  return new;
end $$;

drop trigger if exists notice_notification_fanout on public.notices;
create trigger notice_notification_fanout after insert on public.notices for each row execute function public.notify_notice_targets();

-- Basic integrity for school-owned foreign keys that could otherwise be cross-tenant.
create or replace function public.validate_same_school() returns trigger language plpgsql as $$
declare parent_school uuid; begin
  if tg_table_name='sections' then select school_id into parent_school from public.classes where id=new.class_id;
  elsif tg_table_name='teacher_assignments' then select school_id into parent_school from public.classes where id=new.class_id;
  elsif tg_table_name='homework' then select school_id into parent_school from public.classes where id=new.class_id;
  elsif tg_table_name='exams' then select school_id into parent_school from public.classes where id=new.class_id;
  elsif tg_table_name='attendance' then select school_id into parent_school from public.classes where id=new.class_id;
  end if;
  if parent_school is not null and parent_school<>new.school_id then raise exception 'Cross-school relationship rejected'; end if;
  return new;
end $$;

drop trigger if exists sections_same_school on public.sections;
create trigger sections_same_school before insert or update on public.sections for each row execute function public.validate_same_school();
drop trigger if exists assignments_same_school on public.teacher_assignments;
create trigger assignments_same_school before insert or update on public.teacher_assignments for each row execute function public.validate_same_school();
drop trigger if exists homework_same_school on public.homework;
create trigger homework_same_school before insert or update on public.homework for each row execute function public.validate_same_school();
drop trigger if exists exams_same_school on public.exams;
create trigger exams_same_school before insert or update on public.exams for each row execute function public.validate_same_school();
drop trigger if exists attendance_same_school on public.attendance;
create trigger attendance_same_school before insert or update on public.attendance for each row execute function public.validate_same_school();

-- Minimize profile PII exposure: students can read only their own profile row.
drop policy if exists profiles_tenant_select on public.profiles;
create policy profiles_role_scoped_select on public.profiles for select using (
 school_id=public.current_school_id() and (public.current_role() in ('ADMIN','TEACHER') or id=auth.uid())
);

drop policy if exists teacher_assignments_tenant_select on public.teacher_assignments;
create policy teacher_assignments_scoped_select on public.teacher_assignments for select using (
 school_id=public.current_school_id() and (public.current_role()='ADMIN' or teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid()))
);

drop policy if exists admin_ptm_write on public.ptm;
create policy ptm_staff_write_scoped on public.ptm for all
using (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid()))))
with check (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid()))));

drop policy if exists leave_staff_update on public.leave_requests;
create policy leave_staff_update_scoped on public.leave_requests for update
using (school_id=public.current_school_id() and (public.current_role()='ADMIN' or (public.current_role()='TEACHER' and exists(select 1 from public.student_profiles sp join public.teacher_assignments ta on ta.class_id=sp.class_id and ta.section_id=sp.section_id where sp.id=student_id and ta.teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid())))))
with check (school_id=public.current_school_id());

-- Notifications are private to their recipient.
drop policy if exists notifications_tenant_select on public.notifications;
create policy notifications_self_select on public.notifications for select using (
 school_id=public.current_school_id() and user_id=auth.uid()
);

-- Teachers can only create/update homework under their own teacher profile and assignment.
drop policy if exists homework_teacher_write on public.homework;
create policy homework_teacher_write_scoped on public.homework for all
using (school_id=public.current_school_id() and (
 public.current_role()='ADMIN' or
 (public.current_role()='TEACHER' and teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid()) and public.teacher_has_assignment(class_id,section_id,subject_id))
))
with check (school_id=public.current_school_id() and (
 public.current_role()='ADMIN' or
 (public.current_role()='TEACHER' and teacher_id in (select id from public.teacher_profiles where profile_id=auth.uid()) and public.teacher_has_assignment(class_id,section_id,subject_id))
));

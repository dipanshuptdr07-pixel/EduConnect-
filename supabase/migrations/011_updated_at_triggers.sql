-- EduConnect
-- Migration 011
-- Automatic updated_at timestamps.

begin;

-- Classes
drop trigger if exists classes_updated on public.classes;

create trigger classes_updated
before update on public.classes
for each row
execute function public.set_updated_at();


-- Sections
drop trigger if exists sections_updated on public.sections;

create trigger sections_updated
before update on public.sections
for each row
execute function public.set_updated_at();


-- Subjects
drop trigger if exists subjects_updated on public.subjects;

create trigger subjects_updated
before update on public.subjects
for each row
execute function public.set_updated_at();


-- Streams
drop trigger if exists streams_updated on public.streams;

create trigger streams_updated
before update on public.streams
for each row
execute function public.set_updated_at();


-- Teacher permissions
drop trigger if exists teacher_permissions_updated
on public.teacher_permissions;

create trigger teacher_permissions_updated
before update on public.teacher_permissions
for each row
execute function public.set_updated_at();


-- Platform owners
drop trigger if exists platform_owners_updated
on public.platform_owners;

create trigger platform_owners_updated
before update on public.platform_owners
for each row
execute function public.set_updated_at();

commit;

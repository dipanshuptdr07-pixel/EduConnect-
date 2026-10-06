-- EduConnect
-- Migration 003
-- Allow the same phone/contact number to be linked
-- with multiple student accounts inside the same school.

begin;

-- The phone number is a contact/login identifier, not the
-- unique identity of a student account.
alter table public.profiles
  drop constraint if exists profiles_school_id_phone_key;

-- Keep phone searchable without forcing uniqueness.
create index if not exists profiles_school_phone_idx
  on public.profiles (school_id, phone);

-- Helpful index for student-account lookups.
create index if not exists student_profiles_school_profile_idx
  on public.student_profiles (school_id, profile_id);

commit;

-- Run after creating the first Supabase Auth user and obtaining its UUID.
-- Replace the sample values before running. No passwords are stored in this file.
insert into public.schools(code,name,address,academic_year) values
('EDU001','EduConnect Demo School','Indore, Madhya Pradesh','2026-27')
on conflict (code) do nothing;

-- Example admin profile. Replace AUTH_USER_UUID with the id from Supabase Auth.
-- insert into public.profiles(id,school_id,role,full_name,phone)
-- select 'AUTH_USER_UUID', id, 'ADMIN', 'School Administrator', '9876543210' from public.schools where code='EDU001';

-- EduConnect
-- Migration 018
-- Final security hardening for database phase.

begin;

-- =========================================================
-- STUDENT ACCOUNT LOOKUP
-- =========================================================

-- Account discovery is no longer exposed to anonymous users.
-- The frontend must be authenticated before requesting
-- student account information.

revoke execute
on function public.resolve_student_accounts(text, text)
from anon;

grant execute
on function public.resolve_student_accounts(text, text)
to authenticated;


-- =========================================================
-- LOGIN RESOLVER
-- =========================================================

-- Login resolution is intentionally kept available to anon
-- because the user is not authenticated at login time.
-- It returns only the internal auth email required for
-- the authentication bridge.

revoke execute
on function public.resolve_login_email(text, text)
from public;

grant execute
on function public.resolve_login_email(text, text)
to anon, authenticated;


-- =========================================================
-- OWNER SCHOOL CREATION
-- =========================================================

-- Only platform owners should be able to create schools.
revoke execute
on function public.owner_create_school(
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
from public;

grant execute
on function public.owner_create_school(
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
to authenticated;


-- =========================================================
-- SECTION PASSWORD
-- =========================================================

-- Section password management is an authenticated operation.
revoke execute
on function public.set_section_password(
  uuid,
  text
)
from public;

grant execute
on function public.set_section_password(
  uuid,
  text
)
to authenticated;


-- =========================================================
-- PLATFORM OWNER TABLE
-- =========================================================

alter table public.platform_owners enable row level security;

drop policy if exists platform_owner_self_select
on public.platform_owners;

create policy platform_owner_self_select
on public.platform_owners
for select
to authenticated
using (
  user_id = auth.uid()
);


-- =========================================================
-- SCHOOL STATUS INDEX
-- =========================================================

create index if not exists schools_code_status_idx
on public.schools(code, status);


-- =========================================================
-- FINAL NOTE
-- =========================================================
-- No frontend secret, service-role key, password,
-- or authentication credential is stored in the database
-- migration or exposed to the browser.

commit;

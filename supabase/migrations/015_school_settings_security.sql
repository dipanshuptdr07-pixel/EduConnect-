-- EduConnect
-- Migration 015
-- Secure school settings policies.

begin;

-- Remove older/duplicate policies if present.
drop policy if exists school_settings_select on public.school_settings;
drop policy if exists school_settings_admin_write on public.school_settings;
drop policy if exists school_settings_tenant_select on public.school_settings;
drop policy if exists school_settings_tenant_write on public.school_settings;

-- =========================
-- SELECT
-- =========================

create policy school_settings_tenant_select
on public.school_settings
for select
to authenticated
using (
  school_id = public.current_school_id()
);

-- =========================
-- INSERT
-- =========================

create policy school_settings_admin_insert
on public.school_settings
for insert
to authenticated
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

-- =========================
-- UPDATE
-- =========================

create policy school_settings_admin_update
on public.school_settings
for update
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
)
with check (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

-- =========================
-- DELETE
-- =========================

create policy school_settings_admin_delete
on public.school_settings
for delete
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_role() = 'ADMIN'
);

commit;

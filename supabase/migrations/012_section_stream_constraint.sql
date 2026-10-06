-- EduConnect
-- Migration 012
-- Stream-aware section uniqueness.

begin;

-- Old constraint prevented:
-- 11 Maths A
-- 11 Biology A
-- because both used section name "A" in the same class.

alter table public.sections
  drop constraint if exists sections_class_id_name_key;

-- NULL stream_id represents a normal/non-stream section.
-- A fixed UUID is used only for uniqueness comparison.
create unique index if not exists sections_class_stream_name_unique_idx
on public.sections (
  class_id,
  coalesce(
    stream_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  lower(trim(name))
);

commit;

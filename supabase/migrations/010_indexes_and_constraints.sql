-- EduConnect
-- Migration 010
-- Production indexes and integrity constraints.

begin;

-- =========================
-- SCHOOL / PROFILE LOOKUPS
-- =========================

create index if not exists profiles_school_role_idx
  on public.profiles(school_id, role);

create index if not exists profiles_school_active_idx
  on public.profiles(school_id, is_active);

create index if not exists profiles_phone_lookup_idx
  on public.profiles(phone);

-- =========================
-- STUDENTS
-- =========================

create index if not exists students_school_class_section_idx
  on public.student_profiles(school_id, class_id, section_id);

create index if not exists students_section_idx
  on public.student_profiles(section_id);

-- =========================
-- TEACHERS
-- =========================

create index if not exists teacher_profiles_school_idx
  on public.teacher_profiles(school_id);

create index if not exists teacher_assignments_scope_idx
  on public.teacher_assignments(
    school_id,
    teacher_id,
    class_id,
    section_id,
    subject_id
  );

-- =========================
-- HOMEWORK
-- =========================

create index if not exists homework_scope_idx
  on public.homework(
    school_id,
    class_id,
    section_id,
    subject_id
  );

create index if not exists homework_due_date_idx
  on public.homework(school_id, due_date);

create index if not exists homework_submissions_student_idx
  on public.homework_submissions(
    school_id,
    student_id,
    status
  );

-- =========================
-- ATTENDANCE
-- =========================

create index if not exists attendance_student_date_idx
  on public.attendance(
    school_id,
    student_id,
    date
  );

create index if not exists attendance_section_date_idx
  on public.attendance(
    school_id,
    section_id,
    date
  );

-- =========================
-- EXAMS / RESULTS
-- =========================

create index if not exists exams_scope_date_idx
  on public.exams(
    school_id,
    class_id,
    section_id,
    exam_date
  );

create index if not exists results_student_idx
  on public.results(
    school_id,
    student_id,
    exam_id
  );

create index if not exists results_exam_idx
  on public.results(
    school_id,
    exam_id,
    subject_id
  );

-- =========================
-- FEES
-- =========================

create index if not exists fees_student_due_idx
  on public.fees(
    school_id,
    student_id,
    due_date
  );

create index if not exists fees_status_idx
  on public.fees(
    school_id,
    status
  );

-- =========================
-- NOTICES / NOTIFICATIONS
-- =========================

create index if not exists notices_publish_idx
  on public.notices(
    school_id,
    publish_at
  );

create index if not exists notifications_user_read_idx
  on public.notifications(
    school_id,
    user_id,
    is_read
  );

create index if not exists notifications_created_idx
  on public.notifications(
    school_id,
    created_at desc
  );

-- =========================
-- LEAVE / EVENTS / PTM
-- =========================

create index if not exists leave_student_status_idx
  on public.leave_requests(
    school_id,
    student_id,
    status
  );

create index if not exists events_start_idx
  on public.events(
    school_id,
    starts_at
  );

create index if not exists ptm_scope_start_idx
  on public.ptm(
    school_id,
    class_id,
    section_id,
    starts_at
  );

-- =========================
-- FILES
-- =========================

create index if not exists files_school_owner_idx
  on public.files(
    school_id,
    owner_id
  );

-- =========================
-- DATA INTEGRITY
-- =========================

alter table public.results
  drop constraint if exists results_marks_max_check;

alter table public.results
  add constraint results_marks_max_check
  check (marks >= 0 and marks <= max_marks);

alter table public.fees
  drop constraint if exists fees_amount_nonnegative;

alter table public.fees
  add constraint fees_amount_nonnegative
  check (amount >= 0);

commit;

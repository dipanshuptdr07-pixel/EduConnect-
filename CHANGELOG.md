# EduConnect build changelog

## 1.1.0 — production hardening

- Added `SchoolManagement` admin center.
- Added student/teacher provisioning UI through the server-side admin Edge Function.
- Added class, section, subject and teacher-assignment CRUD.
- Added school profile editing.
- Added real create flows for exams, results, fees, events, notices and PTM.
- Added delete/refresh/read actions where the role is authorized.
- Added targeted notice-to-notification fan-out in PostgreSQL.
- Added teacher-assignment-aware RLS for homework, attendance, exams, results, PTM and leave review.
- Added daily attendance generated upsert key to avoid duplicate daily records.
- Tightened student profile PII visibility so students can read only their own `profiles` row.
- Added admin dashboard student/teacher counts.
- Added Notices navigation.
- Updated i18n labels for new navigation.
- Bumped application version to 1.1.0.

## Verification note

The source was statically reviewed and the production build command remains `npm run build`. Dependency installation could not complete in the current sandbox because the npm registry operation timed out, so no claim is made that a local bundle was successfully emitted here.

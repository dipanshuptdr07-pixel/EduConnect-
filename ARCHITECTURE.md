# EduConnect architecture

## Frontend
React + TypeScript + Vite, mobile-first CSS, React Router, Supabase JS.

## Backend
Supabase Auth + PostgreSQL + Row Level Security + private Storage + Edge Functions.

## Tenant boundary
`profiles.school_id` is the authoritative tenant boundary. Every school-owned table also carries `school_id`. RLS policies compare that value with `current_school_id()` derived from the authenticated user, so a client-supplied school id cannot cross tenants.

## Roles
Exactly three roles exist in the schema: `STUDENT`, `TEACHER`, `ADMIN`.

## AI
The browser invokes the `study-ai` Edge Function. Provider credentials live only in Edge Function secrets. The function uses an OpenAI-compatible interface so a provider can be swapped without changing the frontend.

## Files
The `files` table records ownership and metadata. Actual binary files should live in a private Supabase Storage bucket named `educonnect-files`. Signed URLs should be generated for downloads. The browser must never store production attachments in localStorage/base64 blobs.

## Mobile
The web app is the primary target. PWA manifest/service worker are included. Capacitor can later package the same web build for Android/iOS without changing the core application model.

-- 0010_create_estimate_versions.sql
-- Module 3 — Portion A: Versioned estimate revisions (draft | sent | approved | rejected)

create table if not exists public.estimate_versions (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  version_number int not null,
  status text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  constraint estimate_versions_status_check check (status in ('draft', 'sent', 'approved', 'rejected')),
  constraint estimate_versions_estimate_version_unique unique (estimate_id, version_number)
);

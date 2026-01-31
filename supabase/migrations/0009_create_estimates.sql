-- 0009_create_estimates.sql
-- Module 3 — Portion A: Estimate container per project (one per project)

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimates_project_id_unique unique (project_id)
);

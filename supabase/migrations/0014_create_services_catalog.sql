-- 0014_create_services_catalog.sql
-- Module 3 — Portion A: Outside services / outsourcing (each, hour, job)

create table if not exists public.services_catalog (
  id uuid primary key default gen_random_uuid(),
  name text,
  unit_type text,
  base_cost numeric,
  preferred_vendor_name text,
  lead_time_days int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

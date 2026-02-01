-- 0015_create_estimate_line_items.sql
-- Module 3 — Portion A: Estimator line items (quoted objects) with per-line upcharges

create table if not exists public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_version_id uuid not null references public.estimate_versions(id) on delete cascade,
  name text not null,
  description_internal text,
  description_client text,
  quantity numeric not null default 1,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rush_enabled boolean not null default false,
  rush_override_mode text,
  rush_override_value numeric,
  special_finish_enabled boolean not null default false,
  special_finish_override_pct numeric,
  manual_price_override numeric
);

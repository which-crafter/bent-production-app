-- 0013_create_materials_catalog.sql
-- Module 3 — Portion A: Materials catalog (sheet, ft, each, sqft, etc.)

create table if not exists public.materials_catalog (
  id uuid primary key default gen_random_uuid(),
  name text,
  unit_type text,
  unit_cost numeric,
  preferred_vendor_name text,
  vendor_sku text,
  default_waste_pct numeric,
  lead_time_days int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

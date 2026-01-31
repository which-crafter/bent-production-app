-- 0012_create_labor_categories.sql
-- Module 3 — Portion A: Labor categories reference (shop | assembly | finishing | install | packing)

create table if not exists public.labor_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  display_name text not null,
  default_rate numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labor_categories_key_unique unique (key)
);

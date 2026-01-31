-- 0011_create_estimate_settings_snapshots.sql
-- Module 3 — Portion A: Frozen settings per estimate version (auditability)

create table if not exists public.estimate_settings_snapshots (
  id uuid primary key default gen_random_uuid(),
  estimate_version_id uuid not null references public.estimate_versions(id) on delete cascade,
  shop_rate numeric,
  assembly_rate numeric,
  finishing_rate numeric,
  install_rate numeric,
  packing_rate numeric,
  overhead_pct numeric,
  margin_tiers_json jsonb,
  rush_fee_mode text,
  rush_fee_value numeric,
  special_finish_fee_pct numeric,
  tax_mode text,
  tax_pct numeric,
  install_pct_default numeric,
  delivery_base numeric,
  outside_services_markup_mode text,
  outside_services_markup_value numeric,
  created_at timestamptz not null default now(),
  constraint estimate_settings_snapshots_estimate_version_id_unique unique (estimate_version_id),
  constraint estimate_settings_snapshots_rush_fee_mode_check check (rush_fee_mode is null or rush_fee_mode in ('percent', 'fixed')),
  constraint estimate_settings_snapshots_outside_services_markup_mode_check check (outside_services_markup_mode is null or outside_services_markup_mode in ('percent', 'fixed'))
);

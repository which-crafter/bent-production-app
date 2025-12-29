-- 0001_init.sql
-- Bent Production App — v0 schema (Module 1)
-- Notes:
-- - Uses text + CHECK constraints (no enums) for flexibility.
-- - No RLS/auth wiring in this migration yet.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -----------------------
-- Leads (pre-project)
-- -----------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_or_client text,
  status text not null default 'new',
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_status_check check (status in ('new', 'contacted', 'qualified', 'lost'))
);

-- -----------------------
-- Projects (only after qualified leads)
-- -----------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete restrict,
  project_code text not null unique,
  name text not null,
  client_name text,
  status text not null default 'active',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_status_check check (status in ('active', 'on_hold', 'closed')),
  constraint projects_code_format_check check (project_code ~ '^[0-9]{4}-[0-9]{2}$')
);

-- -----------------------
-- Project phases (project can be in multiple at once)
-- -----------------------
create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase text not null,
  is_active boolean not null default true,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_phases_phase_check check (phase in ('estimating', 'engineering', 'purchasing', 'production', 'delivery', 'invoicing', 'closed')),
  constraint project_phases_unique_per_project unique (project_id, phase)
);

-- -----------------------
-- Flags (catalog)
-- -----------------------
create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  color text,
  scope text not null default 'project',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flags_scope_check check (scope in ('project', 'task', 'both'))
);

-- Apply flags to projects
create table if not exists public.project_flags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  flag_id uuid not null references public.flags(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  constraint project_flags_unique unique (project_id, flag_id)
);

-- -----------------------
-- Contacts
-- -----------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  company text,
  email citext unique,
  phone text,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Links between contacts and leads/projects (flexible)
create table if not exists public.contact_links (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  relationship text,
  created_at timestamptz not null default now(),
  constraint contact_links_exactly_one_parent check ((lead_id is not null) <> (project_id is not null))
);

-- Prevent duplicate links (contact ↔ lead) and (contact ↔ project)
create unique index if not exists contact_links_unique_contact_lead
  on public.contact_links (contact_id, lead_id)
  where lead_id is not null;

create unique index if not exists contact_links_unique_contact_project
  on public.contact_links (contact_id, project_id)
  where project_id is not null;

-- -----------------------
-- Tasks (project tasks + business/admin tasks)
-- -----------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  due_date date,
  assignee_user_id uuid,
  related_contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('todo', 'doing', 'blocked', 'done'))
);

-- Helpful indexes
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_project_phases_project on public.project_phases(project_id);
create index if not exists idx_project_flags_project on public.project_flags(project_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);

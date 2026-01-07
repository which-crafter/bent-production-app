-- 0008_projects_lifecycle_state.sql
-- Module 2 — Portion A: Add lifecycle state columns and constraints
-- Adds lifecycle_state, prev_lifecycle_state, hold_reason, hold_at, lifecycle_override_reason

begin;

-- Add lifecycle_state column with NOT NULL and DEFAULT 'quote'
alter table public.projects
  add column if not exists lifecycle_state text not null default 'quote';

-- Add prev_lifecycle_state column (nullable)
alter table public.projects
  add column if not exists prev_lifecycle_state text;

-- Add hold_reason column (nullable)
alter table public.projects
  add column if not exists hold_reason text;

-- Add hold_at column (nullable)
alter table public.projects
  add column if not exists hold_at timestamptz;

-- Add lifecycle_override_reason column (nullable)
alter table public.projects
  add column if not exists lifecycle_override_reason text;

-- Backfill existing projects: map legacy projects.status to lifecycle_state
-- Handle on_hold status: set lifecycle_state='hold' and prev_lifecycle_state='active'
update public.projects
set lifecycle_state = 'hold',
    prev_lifecycle_state = 'active'
where lifecycle_state is null
  and status = 'on_hold';

-- Map other status values to lifecycle_state
update public.projects
set lifecycle_state = case
  when status = 'active' then 'active'
  when status = 'closed' then 'closed'
  else 'quote'
end
where lifecycle_state is null;

-- Add CHECK constraint for lifecycle_state allowed values
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_lifecycle_state_check'
    and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_lifecycle_state_check
      check (
        lifecycle_state in (
          'quote',
          'awarded',
          'released',
          'active',
          'closed',
          'hold'
        )
      );
  end if;
end $$;

-- Add CHECK constraint for prev_lifecycle_state allowed values (excludes 'hold')
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_prev_lifecycle_state_check'
    and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_prev_lifecycle_state_check
      check (
        prev_lifecycle_state is null
        or prev_lifecycle_state in (
          'quote',
          'awarded',
          'released',
          'active',
          'closed'
        )
      );
  end if;
end $$;

commit;


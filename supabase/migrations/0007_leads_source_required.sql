-- 0007_leads_source_required.sql
-- Enforce leads.source as required (Module 1 locked decision)
-- Backfill existing NULLs first, then set NOT NULL.

begin;

update public.leads
set source = 'unknown'
where source is null;

alter table public.leads
alter column source set not null;

commit;

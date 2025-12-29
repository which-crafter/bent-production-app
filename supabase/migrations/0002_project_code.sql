-- 0002_project_code.sql
-- Project code generator + lead->project conversion (safe, per-year counter)

create table if not exists public.project_code_counters (
  year smallint primary key,
  next_seq integer not null
);

-- Returns the next project code in format NNNN-YY (e.g., 1000-25)
create or replace function public.next_project_code()
returns text
language plpgsql
as $$
declare
  yy smallint := (extract(year from now())::int % 100)::smallint;
  seq integer;
begin
  -- Ensure row exists for this year (start at 1000)
  insert into public.project_code_counters(year, next_seq)
  values (yy, 1000)
  on conflict (year) do nothing;

  -- Lock row and increment
  update public.project_code_counters
    set next_seq = next_seq + 1
  where year = yy
  returning next_seq - 1 into seq;

  return lpad(seq::text, 4, '0') || '-' || lpad(yy::text, 2, '0');
end;
$$;

-- Convert a QUALIFIED lead into a project and assign a project_code.
-- Enforces: one lead -> one project (already in schema via projects.lead_id unique)
create or replace function public.convert_lead_to_project(
  p_lead_id uuid,
  p_project_name text,
  p_client_name text default null
)
returns public.projects
language plpgsql
as $$
declare
  l_status text;
  code text;
  proj public.projects;
begin
  select status into l_status
  from public.leads
  where id = p_lead_id;

  if l_status is null then
    raise exception 'Lead not found: %', p_lead_id;
  end if;

  if l_status <> 'qualified' then
    raise exception 'Lead must be qualified to convert. Current status: %', l_status;
  end if;

  code := public.next_project_code();

  insert into public.projects (lead_id, project_code, name, client_name, status)
  values (p_lead_id, code, p_project_name, p_client_name, 'active')
  returning * into proj;

  return proj;
end;
$$;

-- 0005_convert_sets_qualified.sql
-- Ensure lead remains qualified when converted

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

  -- Keep lead explicitly qualified (defensive)
  update public.leads set status = 'qualified' where id = p_lead_id;

  return proj;
end;
$$;

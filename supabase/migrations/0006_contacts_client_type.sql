-- Add client_type column to contacts table (Module 1 — Portion A)

alter table public.contacts
  add column if not exists client_type text;

-- Add CHECK constraint for allowed client_type values
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contacts_client_type_check'
    and conrelid = 'public.contacts'::regclass
  ) then
    alter table public.contacts
      add constraint contacts_client_type_check
      check (
        client_type is null
        or client_type in (
          'homeowner',
          'designer',
          'contractor',
          'dealer',
          'architect',
          'retail',
          'other'
        )
      );
  end if;
end $$;

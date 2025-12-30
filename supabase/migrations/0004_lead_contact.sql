-- 0004_lead_last_contact.sql
alter table public.leads
  add column if not exists last_contacted_at timestamptz,
  add column if not exists last_contact_note text;

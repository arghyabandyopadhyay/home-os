-- Add Google Contacts fields to the contacts table

alter table public.contacts
  add column if not exists google_contact_id text,
  add column if not exists source text not null default 'manual';

create unique index if not exists contacts_google_id_unique_idx
  on public.contacts (user_id, google_contact_id)
  where google_contact_id is not null;

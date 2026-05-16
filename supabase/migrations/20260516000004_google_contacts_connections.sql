-- Create google_contacts_connections table for storing Google Contacts OAuth tokens

create table if not exists public.google_contacts_connections (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  access_token    text        not null,
  refresh_token   text,
  expires_at      timestamptz,
  scope           text,
  connected_email text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

alter table public.google_contacts_connections enable row level security;

create policy "Users manage own contacts connections"
  on public.google_contacts_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

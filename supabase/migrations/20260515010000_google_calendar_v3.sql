-- Path B v3: Google Calendar OAuth and idempotent event sync
-- Run in Supabase SQL editor or via CLI: supabase db push

alter table public.calendar_events
  add column if not exists source text not null default 'home_os',
  add column if not exists external_id text,
  add column if not exists external_calendar_id text,
  add column if not exists html_link text,
  add column if not exists location text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists calendar_events_external_unique_idx
  on public.calendar_events (user_id, source, external_calendar_id, external_id)
  where external_id is not null;

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null,
  calendar_id text not null default 'primary',
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  connected_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, calendar_id)
);

create index if not exists calendar_connections_user_provider_idx
  on public.calendar_connections (user_id, provider);

alter table public.calendar_connections enable row level security;

create policy "Users manage own calendar connections"
  on public.calendar_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

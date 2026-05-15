-- Path B v2: preferences, cross-links, calendar
-- Run in Supabase SQL editor or via CLI: supabase db push

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table public.notes
  add column if not exists linked_book_id uuid references public.books (id) on delete set null,
  add column if not exists linked_contact_id uuid references public.contacts (id) on delete set null;

alter table public.tasks
  add column if not exists linked_contact_id uuid references public.contacts (id) on delete set null;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_user_starts_idx
  on public.calendar_events (user_id, starts_at);

alter table public.calendar_events enable row level security;

create policy "Users manage own calendar events"
  on public.calendar_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

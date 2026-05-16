-- Add priority and updated_at columns to tasks

alter table public.tasks
  add column if not exists priority text check (priority in ('low', 'medium', 'high')),
  add column if not exists updated_at timestamptz not null default now();

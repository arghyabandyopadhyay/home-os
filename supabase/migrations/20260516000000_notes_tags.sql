-- Add tags array column to notes and a GIN index for efficient array queries

alter table public.notes
  add column if not exists tags text[] not null default '{}';

create index if not exists notes_tags_gin_idx
  on public.notes using gin (tags);

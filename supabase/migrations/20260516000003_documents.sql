-- Create documents table for the Library / Documents module

create table if not exists public.documents (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  title      text        not null,
  file_path  text        not null,
  file_size  bigint,
  tags       text[]      not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

create index if not exists documents_tags_gin_idx
  on public.documents using gin (tags);

alter table public.documents enable row level security;

create policy "Users manage own documents"
  on public.documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

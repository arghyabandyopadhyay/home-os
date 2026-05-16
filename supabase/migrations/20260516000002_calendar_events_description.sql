-- Add description column to calendar_events

alter table public.calendar_events
  add column if not exists description text;

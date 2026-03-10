-- Add 'telegram' to the allowed source values
alter table public.todos
  drop constraint if exists todos_source_check;

alter table public.todos
  add constraint todos_source_check
  check (source in ('manual','speckit','system','agent','telegram'));

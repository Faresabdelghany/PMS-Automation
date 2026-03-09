-- Child task workflow contract for PA -> Dev -> Tester -> Reviewer loop

alter table public.todos
  add column if not exists parent_task_id uuid null references public.todos(id) on delete cascade,
  add column if not exists order_index integer,
  add column if not exists source text not null default 'manual',
  add column if not exists acceptance_criteria text,
  add column if not exists lifecycle_status text not null default 'queued';

-- Source domain
alter table public.todos
  drop constraint if exists todos_source_check;

alter table public.todos
  add constraint todos_source_check
  check (source in ('manual','speckit','system','agent'));

-- Required lifecycle states for sequential execution loop
alter table public.todos
  drop constraint if exists todos_lifecycle_status_check;

alter table public.todos
  add constraint todos_lifecycle_status_check
  check (lifecycle_status in (
    'queued','ready','in_progress','dev_done','in_test','changes_requested','tested_passed','in_review','done','failed','cancelled'
  ));

create index if not exists idx_todos_parent_task_id on public.todos(parent_task_id);
create index if not exists idx_todos_parent_order on public.todos(parent_task_id, order_index);
create index if not exists idx_todos_lifecycle_status on public.todos(lifecycle_status);

-- Idempotent key for SpecKit-imported child decomposition rows
create unique index if not exists uq_todos_speckit_parent_order
  on public.todos(parent_task_id, order_index)
  where source = 'speckit' and parent_task_id is not null;

-- Exactly one active child task (ready or in_progress) per parent
create unique index if not exists uq_todos_one_active_child_per_parent
  on public.todos(parent_task_id)
  where lifecycle_status in ('ready','in_progress') and parent_task_id is not null;

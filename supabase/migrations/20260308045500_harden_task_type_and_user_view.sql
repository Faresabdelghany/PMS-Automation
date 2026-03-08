-- Harden task_type classification and add safe user-task query path

alter table public.todos
  add column if not exists task_type text;

-- Normalize bad/legacy values before constraints
update public.todos
set task_type = 'user_task'
where task_type is null
   or task_type not in ('user_task', 'agent_task', 'system_task');

alter table public.todos
  alter column task_type set default 'user_task';

alter table public.todos
  alter column task_type set not null;

alter table public.todos
  drop constraint if exists todos_task_type_check;

alter table public.todos
  add constraint todos_task_type_check
  check (task_type in ('user_task', 'agent_task', 'system_task'));

create index if not exists idx_todos_task_type on public.todos(task_type);

-- Shared user-facing projection to avoid repeating filters in app code
create or replace view public.v_user_tasks as
select *
from public.todos
where task_type = 'user_task';

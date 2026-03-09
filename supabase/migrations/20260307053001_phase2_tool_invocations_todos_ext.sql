-- Phase 2: tool_invocations + todos extensions
-- 2026-03-07 (idempotent)

-- ============================================================
-- 4. tool_invocations
-- ============================================================
create table if not exists public.tool_invocations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  todo_id uuid null references public.todos(id) on delete set null,
  tool_name text not null,
  tool_category text null,
  status text not null default 'started'
    check (status in ('started', 'completed', 'failed')),
  input_summary text null,
  output_summary text null,
  error_message text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists tool_invocations_run_id_idx on public.tool_invocations(run_id);
create index if not exists tool_invocations_todo_id_idx on public.tool_invocations(todo_id);
create index if not exists tool_invocations_tool_name_idx on public.tool_invocations(tool_name);

alter table public.tool_invocations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tool_invocations' and policyname='Allow all for anon') then
    create policy "Allow all for anon" on public.tool_invocations for all using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- 5. Extend todos
-- ============================================================
alter table public.todos
  add column if not exists current_run_id uuid null,
  add column if not exists last_event_at timestamptz null,
  add column if not exists failed_at timestamptz null,
  add column if not exists completed_at timestamptz null,
  add column if not exists archived_at timestamptz null;

-- Add FK only if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name='todos_current_run_id_fkey' and table_name='todos'
  ) then
    alter table public.todos add constraint todos_current_run_id_fkey
      foreign key (current_run_id) references public.agent_runs(id) on delete set null;
  end if;
end $$;

create index if not exists todos_status_idx on public.todos(status);
create index if not exists todos_assignee_idx on public.todos(assignee);
create index if not exists todos_claimed_by_idx on public.todos(claimed_by);
create index if not exists todos_updated_at_idx on public.todos(updated_at desc);
create index if not exists todos_last_event_at_idx on public.todos(last_event_at desc);

-- ============================================================
-- 6. Safer uniqueness for source messages
-- ============================================================
drop index if exists public.todos_source_message_id_uniq;

create unique index if not exists todos_source_ref_uniq
  on public.todos(source_channel, source_message_id)
  where source_message_id is not null and source_channel is not null;

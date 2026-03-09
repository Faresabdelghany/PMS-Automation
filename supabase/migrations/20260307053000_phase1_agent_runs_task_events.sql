-- Phase 1: agent_runs + task_events + agent_logs extension
-- 2026-03-07 (idempotent)

-- ============================================================
-- 1. agent_runs
-- ============================================================
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid null references public.todos(id) on delete set null,
  parent_run_id uuid null references public.agent_runs(id) on delete set null,
  agent_name text not null,
  model_used text null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  triggered_by text null,
  execution_mode text null,
  input_summary text null,
  output_summary text null,
  error_message text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_todo_id_idx on public.agent_runs(todo_id);
create index if not exists agent_runs_parent_run_id_idx on public.agent_runs(parent_run_id);
create index if not exists agent_runs_status_idx on public.agent_runs(status);

alter table public.agent_runs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='agent_runs' and policyname='Allow all for anon') then
    create policy "Allow all for anon" on public.agent_runs for all using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='agent_runs'
  ) then
    alter publication supabase_realtime add table public.agent_runs;
  end if;
end $$;

-- ============================================================
-- 2. task_events
-- ============================================================
create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos(id) on delete cascade,
  run_id uuid null references public.agent_runs(id) on delete set null,
  event_type text not null,
  actor_type text not null check (actor_type in ('user', 'agent', 'system')),
  actor_name text null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_events_todo_id_idx on public.task_events(todo_id);
create index if not exists task_events_run_id_idx on public.task_events(run_id);
create index if not exists task_events_created_at_idx on public.task_events(created_at desc);
create index if not exists task_events_event_type_idx on public.task_events(event_type);

alter table public.task_events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_events' and policyname='Allow all for anon') then
    create policy "Allow all for anon" on public.task_events for all using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- 3. Extend agent_logs
-- ============================================================
alter table public.agent_logs
  add column if not exists run_id uuid null references public.agent_runs(id) on delete set null,
  add column if not exists event_type text null,
  add column if not exists message text null,
  add column if not exists details_json jsonb not null default '{}'::jsonb,
  add column if not exists level text null,
  add column if not exists error_message text null,
  add column if not exists completed_at timestamptz null;

create index if not exists agent_logs_run_id_idx on public.agent_logs(run_id);
create index if not exists agent_logs_event_type_idx on public.agent_logs(event_type);
create index if not exists agent_logs_created_at_idx on public.agent_logs(created_at desc);

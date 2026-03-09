-- Phase 3: skill_invocations
-- 2026-03-07 (idempotent)

create table if not exists public.skill_invocations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  todo_id uuid null references public.todos(id) on delete set null,
  skill_name text not null,
  skill_version text null,
  status text not null default 'started'
    check (status in ('started', 'completed', 'failed')),
  input_summary text null,
  output_summary text null,
  error_message text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists skill_invocations_run_id_idx on public.skill_invocations(run_id);

alter table public.skill_invocations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='skill_invocations' and policyname='Allow all for anon') then
    create policy "Allow all for anon" on public.skill_invocations for all using (true) with check (true);
  end if;
end $$;

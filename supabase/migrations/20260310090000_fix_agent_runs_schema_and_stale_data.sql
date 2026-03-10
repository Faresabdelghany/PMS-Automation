-- Fix agent workflow issues:
--   1. Add updated_at column to agent_runs (code references it but missing)
--   2. Add stale_timeout to status constraint for expired runs
--   3. Mark stale queued runs (> 1 hour old) as stale_timeout
--   4. Sync lifecycle_status for tasks already marked done

-- ── 1. Add updated_at to agent_runs ──────────────────────────────────
alter table public.agent_runs
  add column if not exists updated_at timestamptz not null default now();

-- Auto-touch updated_at on updates
create or replace function public.touch_agent_runs_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_agent_runs_updated_at on public.agent_runs;
create trigger trg_touch_agent_runs_updated_at
before update on public.agent_runs
for each row execute function public.touch_agent_runs_updated_at();

-- ── 2. Expand status constraint to include stale_timeout ─────────────
alter table public.agent_runs drop constraint if exists agent_runs_status_check;
alter table public.agent_runs
  add constraint agent_runs_status_check
  check (status in ('queued','running','completed','failed','cancelled','stale_timeout'));

-- ── 3. Mark stale queued runs (older than 1 hour) ────────────────────
update public.agent_runs
set status = 'stale_timeout',
    completed_at = now()
where status = 'queued'
  and started_at < now() - interval '1 hour';

-- ── 4. Sync lifecycle_status for done tasks ──────────────────────────
update public.todos
set lifecycle_status = 'done'
where status = 'done'
  and (lifecycle_status is null or lifecycle_status = 'queued');

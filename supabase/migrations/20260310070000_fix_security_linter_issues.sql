-- Fix Supabase linter errors:
--   1. v_user_tasks SECURITY DEFINER → SECURITY INVOKER
--   2. projects: enable RLS + anon policies
--   3. inbox_notifications: enable RLS + anon policies

-- ── 1. Recreate v_user_tasks as SECURITY INVOKER ──────────────────────
-- Views default to SECURITY INVOKER but the linter flagged this one
-- as SECURITY DEFINER, so drop and recreate explicitly.
drop view if exists public.v_user_tasks;
create view public.v_user_tasks
  with (security_invoker = true)
as
  select *
  from public.todos
  where task_type = 'user_task';

-- ── 2. Enable RLS on projects ─────────────────────────────────────────
alter table public.projects enable row level security;

create policy "anon_projects_select" on public.projects
  for select to anon using (true);
create policy "anon_projects_insert" on public.projects
  for insert to anon with check (true);
create policy "anon_projects_update" on public.projects
  for update to anon using (true) with check (true);
create policy "anon_projects_delete" on public.projects
  for delete to anon using (true);

-- ── 3. Enable RLS on inbox_notifications ──────────────────────────────
alter table public.inbox_notifications enable row level security;

create policy "anon_inbox_notifications_select" on public.inbox_notifications
  for select to anon using (true);
create policy "anon_inbox_notifications_insert" on public.inbox_notifications
  for insert to anon with check (true);
create policy "anon_inbox_notifications_update" on public.inbox_notifications
  for update to anon using (true) with check (true);
create policy "anon_inbox_notifications_delete" on public.inbox_notifications
  for delete to anon using (true);

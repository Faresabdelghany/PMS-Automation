-- Fix Supabase linter warnings:
--   1. function_search_path_mutable — 4 functions need SET search_path = ''
--   2. rls_policy_always_true — tighten overly permissive policies
--
-- Strategy:
--   - Trigger functions → SECURITY DEFINER + SET search_path = ''
--     (they need to INSERT into inbox_notifications even when called by anon)
--   - Observability tables (agent_logs, agent_runs, task_events,
--     tool_invocations, skill_invocations) → anon SELECT only
--     (OpenClaw scripts migrated to service_role key which bypasses RLS)
--   - inbox_notifications → anon SELECT + UPDATE only
--     (trigger functions handle INSERTs as SECURITY DEFINER)
--   - Drop all broad PUBLIC/ALL policies

-- ═══════════════════════════════════════════════════════════════════════
-- 1. RECREATE FUNCTIONS WITH SECURE search_path
-- ═══════════════════════════════════════════════════════════════════════

-- 1a. touch_inbox_notifications_updated_at
create or replace function public.touch_inbox_notifications_updated_at()
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

-- 1b. notify_comment_added
create or replace function public.notify_comment_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_title text;
  plain_summary text;
begin
  select title into task_title from public.todos where id = new.todo_id;
  plain_summary := regexp_replace(coalesce(new.html, ''), '<[^>]+>', '', 'g');
  plain_summary := regexp_replace(plain_summary, '\s+', ' ', 'g');

  insert into public.inbox_notifications (
    recipient, type, title, summary, entity_type, entity_id, metadata
  ) values (
    'workspace',
    'comment_added',
    coalesce('New comment on ' || task_title, 'New comment added'),
    left(plain_summary, 500),
    'task',
    new.todo_id::text,
    jsonb_build_object('author', new.author, 'todo_id', new.todo_id)
  );

  return new;
end;
$$;

-- 1c. notify_todo_changes
create or replace function public.notify_todo_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.task_type, 'user_task') <> 'user_task' then
    return new;
  end if;

  if old.assignee is distinct from new.assignee and new.assignee is not null then
    insert into public.inbox_notifications (
      recipient, type, title, summary, entity_type, entity_id, metadata
    ) values (
      'workspace',
      'task_assigned',
      'Task assigned: ' || coalesce(new.title, 'Task'),
      coalesce(new.assignee, 'Someone') || ' was assigned to this task.',
      'task',
      new.id::text,
      jsonb_build_object('assignee', new.assignee, 'status', new.status)
    );
  end if;

  if old.status is distinct from new.status then
    insert into public.inbox_notifications (
      recipient, type, title, summary, entity_type, entity_id, metadata
    ) values (
      'workspace',
      'task_status_changed',
      'Task status changed: ' || coalesce(new.title, 'Task'),
      coalesce(old.status, 'unknown') || ' → ' || coalesce(new.status, 'unknown'),
      'task',
      new.id::text,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );

    if coalesce(new.status, '') = 'done' then
      insert into public.inbox_notifications (
        recipient, type, title, summary, entity_type, entity_id, metadata
      ) values (
        'workspace',
        'milestone_completed',
        'Milestone completed: ' || coalesce(new.title, 'Task'),
        'A tracked task milestone has been completed.',
        'task',
        new.id::text,
        jsonb_build_object('status', new.status)
      );
    end if;
  end if;

  if old.due_date is distinct from new.due_date and new.due_date is not null and new.status <> 'done' and new.due_date <= (current_date + interval '1 day')::date then
    insert into public.inbox_notifications (
      recipient, type, title, summary, entity_type, entity_id, metadata
    ) values (
      'workspace',
      'deadline_approaching',
      'Deadline approaching: ' || coalesce(new.title, 'Task'),
      'Due by ' || new.due_date::text,
      'task',
      new.id::text,
      jsonb_build_object('due_date', new.due_date)
    );
  end if;

  return new;
end;
$$;

-- 1d. notify_project_created
create or replace function public.notify_project_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inbox_notifications (
    recipient, type, title, summary, entity_type, entity_id, metadata
  ) values (
    'workspace',
    'project_created',
    'New project created: ' || coalesce(new.name, 'Project'),
    coalesce(new.description, ''),
    'project',
    new.id::text,
    jsonb_build_object('status', new.status, 'priority', new.priority)
  );

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. DROP BROAD PUBLIC/ALL POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- todos: drop "Allow all" (ALL for PUBLIC)
drop policy if exists "Allow all" on public.todos;

-- agent_logs: drop "Allow all operations" (ALL for PUBLIC)
drop policy if exists "Allow all operations" on public.agent_logs;

-- agent_runs: drop "Allow all for anon" (ALL for PUBLIC)
drop policy if exists "Allow all for anon" on public.agent_runs;

-- task_events: drop "Allow all for anon" (ALL for PUBLIC)
drop policy if exists "Allow all for anon" on public.task_events;

-- tool_invocations: drop "Allow all for anon" (ALL for PUBLIC)
drop policy if exists "Allow all for anon" on public.tool_invocations;

-- skill_invocations: drop "Allow all for anon" (ALL for PUBLIC)
drop policy if exists "Allow all for anon" on public.skill_invocations;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. RESTRICT OBSERVABILITY TABLES — anon SELECT only
--    (service_role bypasses RLS, so OpenClaw agents still have full access)
-- ═══════════════════════════════════════════════════════════════════════

-- agent_logs: drop anon write policies, keep select
drop policy if exists "anon_agent_logs_insert" on public.agent_logs;
drop policy if exists "anon_agent_logs_update" on public.agent_logs;
drop policy if exists "anon_agent_logs_delete" on public.agent_logs;
-- anon_agent_logs_select already exists from earlier migration

-- agent_runs: add select-only for anon
create policy "anon_agent_runs_select" on public.agent_runs
  for select to anon using (true);

-- task_events: add select-only for anon
create policy "anon_task_events_select" on public.task_events
  for select to anon using (true);

-- tool_invocations: add select-only for anon
create policy "anon_tool_invocations_select" on public.tool_invocations
  for select to anon using (true);

-- skill_invocations: add select-only for anon
create policy "anon_skill_invocations_select" on public.skill_invocations
  for select to anon using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. RESTRICT inbox_notifications — anon SELECT + UPDATE only
--    (trigger functions are SECURITY DEFINER and handle INSERTs)
-- ═══════════════════════════════════════════════════════════════════════

drop policy if exists "anon_inbox_notifications_insert" on public.inbox_notifications;
drop policy if exists "anon_inbox_notifications_delete" on public.inbox_notifications;
-- anon_inbox_notifications_select and anon_inbox_notifications_update remain

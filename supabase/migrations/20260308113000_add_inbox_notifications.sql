-- Inbox notifications: user-facing curated activity center

create extension if not exists pgcrypto;

create table if not exists public.inbox_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient text not null default 'workspace',
  type text not null check (type in (
    'comment_added',
    'task_assigned',
    'task_status_changed',
    'milestone_completed',
    'project_created',
    'weekly_summary_ready',
    'deadline_approaching'
  )),
  title text not null,
  summary text not null default '',
  entity_type text not null check (entity_type in ('task', 'project', 'client', 'comment', 'system')),
  entity_id text,
  source_event_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inbox_notifications_recipient_created_at
  on public.inbox_notifications(recipient, created_at desc);

create index if not exists idx_inbox_notifications_is_read
  on public.inbox_notifications(is_read);

create index if not exists idx_inbox_notifications_entity
  on public.inbox_notifications(entity_type, entity_id);

create or replace function public.touch_inbox_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_inbox_notifications_updated_at on public.inbox_notifications;
create trigger trg_touch_inbox_notifications_updated_at
before update on public.inbox_notifications
for each row execute function public.touch_inbox_notifications_updated_at();

-- Curated generators (exclude raw ops/debug streams)
create or replace function public.notify_comment_added()
returns trigger as $$
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
$$ language plpgsql;

drop trigger if exists trg_notify_comment_added on public.comments;
create trigger trg_notify_comment_added
after insert on public.comments
for each row execute function public.notify_comment_added();

create or replace function public.notify_todo_changes()
returns trigger as $$
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
$$ language plpgsql;

drop trigger if exists trg_notify_todo_changes on public.todos;
create trigger trg_notify_todo_changes
after update on public.todos
for each row execute function public.notify_todo_changes();

create or replace function public.notify_project_created()
returns trigger as $$
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
$$ language plpgsql;

drop trigger if exists trg_notify_project_created on public.projects;
create trigger trg_notify_project_created
after insert on public.projects
for each row execute function public.notify_project_created();

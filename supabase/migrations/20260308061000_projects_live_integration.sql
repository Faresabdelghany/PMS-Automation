-- Live projects integration

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'planned' check (status in ('backlog','planned','active','cancelled','completed')),
  priority text not null default 'medium' check (priority in ('urgent','high','medium','low')),
  start_date date not null default current_date,
  end_date date not null default (current_date + 14),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  tags text[] not null default '{}',
  members text[] not null default '{}',
  client text,
  type_label text,
  duration_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_priority on public.projects(priority);

alter table public.todos
  add column if not exists project_id uuid;

alter table public.todos
  drop constraint if exists todos_project_id_fkey;

alter table public.todos
  add constraint todos_project_id_fkey
  foreign key (project_id)
  references public.projects(id)
  on delete set null;

create index if not exists idx_todos_project_id on public.todos(project_id);

-- Seed one real project for live UI, only if empty
insert into public.projects (name, description, status, priority, start_date, end_date, progress, tags, members, client, type_label, duration_label)
select
  'PMS Live Integration',
  'Live project data wired from Supabase with linked tasks.',
  'active',
  'high',
  current_date,
  current_date + 21,
  35,
  array['backend','frontend'],
  array['Fares','Ziko'],
  'Internal',
  'SaaS',
  '3 weeks'
where not exists (select 1 from public.projects);

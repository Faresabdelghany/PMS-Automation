create table public.comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos(id) on delete cascade,
  author text not null,
  html text not null default '',
  created_at timestamptz not null default now()
);

create index comments_todo_id_idx on public.comments(todo_id);

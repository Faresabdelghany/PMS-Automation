-- Enable RLS on all public tables
alter table public.todos enable row level security;
alter table public.comments enable row level security;
alter table public.agent_logs enable row level security;

-- Permissive policies for anon role (single-user app, no auth)
-- todos
create policy "anon_todos_select" on public.todos for select to anon using (true);
create policy "anon_todos_insert" on public.todos for insert to anon with check (true);
create policy "anon_todos_update" on public.todos for update to anon using (true) with check (true);
create policy "anon_todos_delete" on public.todos for delete to anon using (true);

-- comments
create policy "anon_comments_select" on public.comments for select to anon using (true);
create policy "anon_comments_insert" on public.comments for insert to anon with check (true);
create policy "anon_comments_update" on public.comments for update to anon using (true) with check (true);
create policy "anon_comments_delete" on public.comments for delete to anon using (true);

-- agent_logs
create policy "anon_agent_logs_select" on public.agent_logs for select to anon using (true);
create policy "anon_agent_logs_insert" on public.agent_logs for insert to anon with check (true);
create policy "anon_agent_logs_update" on public.agent_logs for update to anon using (true) with check (true);
create policy "anon_agent_logs_delete" on public.agent_logs for delete to anon using (true);

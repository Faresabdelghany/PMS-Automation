-- Link agent_logs to todos so agent activity appears on task detail panels
ALTER TABLE public.agent_logs
  ADD COLUMN IF NOT EXISTS todo_id uuid REFERENCES public.todos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS agent_logs_todo_id_idx ON public.agent_logs(todo_id);

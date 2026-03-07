-- Add claim tracking to prevent double-pickup of tasks by agents
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS claimed_by text,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

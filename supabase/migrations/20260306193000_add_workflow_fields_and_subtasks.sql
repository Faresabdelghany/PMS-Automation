-- Add workflow tracking fields to todos
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS source_message_id text,
  ADD COLUMN IF NOT EXISTS source_channel text,
  ADD COLUMN IF NOT EXISTS source_ts timestamptz,
  ADD COLUMN IF NOT EXISTS workflow_stage text;

-- Deduplicate by message id when present
CREATE UNIQUE INDEX IF NOT EXISTS todos_source_message_id_uniq
  ON public.todos (source_message_id)
  WHERE source_message_id IS NOT NULL;

-- Subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subtasks_todo_id_idx ON public.subtasks(todo_id);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Permissive policies (single-user app)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subtasks' AND policyname='anon_subtasks_select') THEN
    CREATE POLICY "anon_subtasks_select" ON public.subtasks FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subtasks' AND policyname='anon_subtasks_insert') THEN
    CREATE POLICY "anon_subtasks_insert" ON public.subtasks FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subtasks' AND policyname='anon_subtasks_update') THEN
    CREATE POLICY "anon_subtasks_update" ON public.subtasks FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subtasks' AND policyname='anon_subtasks_delete') THEN
    CREATE POLICY "anon_subtasks_delete" ON public.subtasks FOR DELETE TO anon USING (true);
  END IF;
END $$;

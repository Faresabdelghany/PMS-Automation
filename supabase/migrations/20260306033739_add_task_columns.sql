ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS assignee text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.todos DROP COLUMN IF EXISTS completed;

ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_priority_check;
ALTER TABLE public.todos ADD CONSTRAINT todos_priority_check CHECK (
  priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])
);

-- Enable Supabase Realtime on the todos table for live task pickup
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;

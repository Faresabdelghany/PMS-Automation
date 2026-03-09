-- Fix: add only real tables to realtime publication (views not supported)
-- v_user_tasks is a VIEW and cannot be added to supabase_realtime

do $$ 
declare
  tbl text;
begin
  foreach tbl in array ARRAY['todos','projects','inbox_notifications','agent_logs','comments','subtasks','agent_runs'] loop
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

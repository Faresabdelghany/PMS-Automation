-- Add task_type column to classify tasks
-- Values: 'user_task' (default), 'agent_task', 'system_task'
ALTER TABLE todos ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'user_task';

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_todos_task_type ON todos (task_type);

-- Backfill: mark existing system/cron tasks
UPDATE todos SET task_type = 'system_task'
WHERE title ILIKE 'RUN_STATUS_SWEEP%'
   OR title ILIKE 'Heartbeat check%'
   OR title ILIKE 'Daily standup cron%'
   OR title ILIKE 'Daily self-improve%'
   OR title ILIKE 'Check memory status%';

-- Add activity tracking fields to todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_by_user text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_by_agent text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_by_user text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_by_agent text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS last_update_summary text;

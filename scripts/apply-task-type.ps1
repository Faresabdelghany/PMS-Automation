$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k"; "Content-Type" = "application/json"; Prefer = "return=representation" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

# We need the service role key for DDL. Use the Supabase Management API instead.
# Actually, let's use npx supabase db execute

Push-Location "C:\Users\Fares\PMS-Automation"

$sql = @"
ALTER TABLE todos ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'user_task';
CREATE INDEX IF NOT EXISTS idx_todos_task_type ON todos (task_type);
UPDATE todos SET task_type = 'system_task' WHERE title ILIKE 'RUN\_STATUS\_SWEEP%' OR title ILIKE 'Heartbeat check%' OR title ILIKE 'Daily standup cron%' OR title ILIKE 'Daily self-improve%' OR title ILIKE 'Check memory status%';
"@

# Write to temp file and execute
$tempFile = [System.IO.Path]::GetTempFileName()
$sql | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
Write-Host "Executing SQL..."
$result = & npx supabase db execute --file $tempFile --linked 2>&1
Write-Host $result
Remove-Item $tempFile -Force
Pop-Location

param([string]$TodoId)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

Write-Host "=== 1. TODOS ==="
$todo = Invoke-RestMethod -Uri "$base/todos?id=eq.$TodoId&select=*" -Headers $h
$todo | ConvertTo-Json -Depth 3

Write-Host "`n=== 2. AGENT_RUNS ==="
$runs = Invoke-RestMethod -Uri "$base/agent_runs?todo_id=eq.$TodoId&select=*" -Headers $h
if ($runs) { $runs | ConvertTo-Json -Depth 3 } else { Write-Host "(none)" }

Write-Host "`n=== 3. TASK_EVENTS ==="
$events = Invoke-RestMethod -Uri "$base/task_events?todo_id=eq.$TodoId&select=*" -Headers $h
if ($events) { $events | ConvertTo-Json -Depth 3 } else { Write-Host "(none)" }

Write-Host "`n=== 4. AGENT_LOGS (linked by todo_id) ==="
$logs = Invoke-RestMethod -Uri "$base/agent_logs?todo_id=eq.$TodoId&select=*" -Headers $h
if ($logs) { $logs | ConvertTo-Json -Depth 3 } else { Write-Host "(none)" }

param([Parameter(Mandatory=$true)][string]$TodoId)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

$todo = Invoke-RestMethod -Uri "$base/todos?id=eq.$TodoId&select=id,current_run_id,status,assignee,title" -Headers $h
$runs = Invoke-RestMethod -Uri "$base/agent_runs?todo_id=eq.$TodoId&select=id,parent_run_id,agent_name,status,created_at,completed_at&order=created_at.asc" -Headers $h
$events = Invoke-RestMethod -Uri "$base/task_events?todo_id=eq.$TodoId&select=id,run_id,event_type,actor_name,created_at&order=created_at.asc" -Headers $h
$logs = Invoke-RestMethod -Uri "$base/agent_logs?todo_id=eq.$TodoId&select=id,run_id,agent_name,status,event_type,created_at&order=created_at.asc" -Headers $h

$hasRun = ($runs | Measure-Object).Count -gt 0
$hasEvent = ($events | Measure-Object).Count -gt 0
$hasLog = ($logs | Measure-Object).Count -gt 0

[pscustomobject]@{
  todo = $todo
  run_count = ($runs | Measure-Object).Count
  event_count = ($events | Measure-Object).Count
  log_count = ($logs | Measure-Object).Count
  contract_ok = ($todo -and $hasRun -and $hasEvent -and $hasLog)
  runs = $runs
  events = $events
  logs = $logs
} | ConvertTo-Json -Depth 8

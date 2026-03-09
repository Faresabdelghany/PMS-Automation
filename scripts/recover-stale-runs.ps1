param(
  [int]$StaleMinutes = 20,
  [int]$Limit = 100
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

$threshold = (Get-Date).AddMinutes(-$StaleMinutes).ToString("yyyy-MM-ddTHH:mm:sszzz")
$uri = "$base/agent_runs?select=id,todo_id,agent_name,status,created_at,started_at,completed_at&status=eq.running&created_at=lt.$([uri]::EscapeDataString($threshold))&order=created_at.asc&limit=$Limit"
$runs = Invoke-RestMethod -Uri $uri -Headers $h

if (-not $runs -or $runs.Count -eq 0) {
  Write-Host "NO_STALE_RUNS"
  exit 0
}

foreach ($r in $runs) {
  $summary = "Stale run auto-failed after $StaleMinutes min without finalization"
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-agent-run.ps1" -RunId $r.id -Status failed -ErrorMessage "stale_timeout" -OutputSummary $summary | Out-Null
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" -TodoId $r.todo_id -RunId $r.id -EventType "task_failed" -ActorType "system" -ActorName "Ziko" -Summary ("$($r.agent_name) run marked stale/failed") | Out-Null
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" -AgentName $r.agent_name -TaskDescription $summary -ModelUsed "system" -Status failed -TodoId $r.todo_id -RunId $r.id -EventType "task_failed" -Level error -ErrorMessage "stale_timeout" | Out-Null
  Write-Host ("STALE_RECOVERED: " + $r.id + " | " + $r.agent_name + " | " + $r.todo_id)
}

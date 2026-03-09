param(
  [int]$LookbackMinutes = 120,
  [int]$Limit = 200
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

$runtimeDir = "C:\Users\Fares\.openclaw\workspace\scripts\runtime"
$baselinePath = Join-Path $runtimeDir "breach-baseline.txt"
$since = (Get-Date).AddMinutes(-$LookbackMinutes).ToString("yyyy-MM-ddTHH:mm:sszzz")
if (Test-Path $baselinePath) {
  $baseline = (Get-Content $baselinePath -Raw).Trim()
  if ($baseline) { $since = $baseline }
}

$runs = Invoke-RestMethod -Uri "$base/agent_runs?select=id,todo_id,parent_run_id,agent_name,status,triggered_by,created_at&created_at=gte.$([uri]::EscapeDataString($since))&order=created_at.desc&limit=$Limit" -Headers $h
if (-not $runs -or $runs.Count -eq 0) { Write-Host "NO_RUNS"; exit 0 }

$breaches = 0
foreach($r in $runs){
  if (-not $r.todo_id) { continue }
  # Suppress root/system orchestrator runs from breach noise
  if (-not $r.parent_run_id -and $r.triggered_by -eq 'system') { continue }
  $events = Invoke-RestMethod -Uri "$base/task_events?run_id=eq.$($r.id)&todo_id=eq.$($r.todo_id)&select=id&limit=1" -Headers $h
  $logs = Invoke-RestMethod -Uri "$base/agent_logs?run_id=eq.$($r.id)&todo_id=eq.$($r.todo_id)&select=id&limit=1" -Headers $h
  $hasEvent = ($events | Measure-Object).Count -gt 0
  $hasLog = ($logs | Measure-Object).Count -gt 0
  if (-not $hasEvent -or -not $hasLog) {
    $breaches++
    $summary = "Run contract breach: run=$($r.id) event=$hasEvent log=$hasLog"
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" -TodoId $r.todo_id -RunId $r.id -EventType "contract_breach" -ActorType "system" -ActorName "Ziko" -Summary $summary | Out-Null
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" -AgentName "Ziko" -TaskDescription $summary -ModelUsed "system" -Status failed -TodoId $r.todo_id -RunId $r.id -EventType "contract_breach" -Level error -ErrorMessage "missing_event_or_log" | Out-Null
    Write-Host ("BREACH: " + $summary)
  }
}

if ($breaches -eq 0) { Write-Host "NO_BREACHES" } else { Write-Host ("BREACH_COUNT:" + $breaches) }

# dispatch-subagent-run.ps1 — Enforced DB contract at dispatch start (wrapper-side)
# NOTE: OpenClaw sessions_spawn is executed by orchestrator/tool; this script enforces DB writes.

param(
  [Parameter(Mandatory=$true)][string]$TodoId,
  [Parameter(Mandatory=$true)][string]$AgentName,
  [Parameter(Mandatory=$true)][string]$Task,
  [Parameter(Mandatory=$false)][string]$ParentRunId,
  [Parameter(Mandatory=$false)][string]$ModelUsed = "anthropic/claude-opus-4-6"
)

$ErrorActionPreference = 'Stop'
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

# Resolve todo + parent run
$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"
$todo = Invoke-RestMethod -Uri "$base/todos?id=eq.$TodoId&select=id,title,current_run_id,status" -Headers $h
if (-not $todo) { throw "Todo not found: $TodoId" }

if (-not $ParentRunId) { $ParentRunId = $todo.current_run_id }
if (-not $ParentRunId) {
  $ParentRunId = powershell -ExecutionPolicy Bypass -File "$scriptsDir\create-agent-run.ps1" `
    -AgentName "Ziko" -TodoId $TodoId -TriggeredBy "system" -ExecutionMode "auto" `
    -InputSummary ("Parent orchestration for " + $todo.title) -Status "running"
  if ($ParentRunId -match '^[0-9a-f\-]{36}$') {
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-todo.ps1" -TodoId $TodoId -CurrentRunId $ParentRunId 2>$null | Out-Null
  }
}

# Ensure parent root reflects active orchestration
if ($ParentRunId -match '^[0-9a-f\-]{36}$') {
  try { powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-agent-run.ps1" -RunId $ParentRunId -Status running -OutputSummary "Orchestration running: dispatched child agent" 2>$null | Out-Null } catch {}
}

# Create child run (running)
$childRunId = powershell -ExecutionPolicy Bypass -File "$scriptsDir\create-agent-run.ps1" `
  -AgentName $AgentName -TodoId $TodoId -ParentRunId $ParentRunId `
  -TriggeredBy "agent" -ExecutionMode "auto" -ModelUsed $ModelUsed `
  -InputSummary ("Dispatch: " + $Task) -Status "running"
if (-not ($childRunId -match '^[0-9a-f\-]{36}$')) {
  throw "Failed to create child run id. Output: $childRunId"
}

# Mandatory start event + log
powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" `
  -TodoId $TodoId -RunId $childRunId -EventType "task_started" -ActorType "agent" -ActorName $AgentName `
  -Summary ("$AgentName started work") | Out-Null

powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" `
  -AgentName $AgentName -TaskDescription ("Started: " + $Task) -ModelUsed $ModelUsed `
  -Status "started" -TodoId $TodoId -RunId $childRunId -EventType "task_started" -Level "info" | Out-Null

[pscustomobject]@{
  todo_id = $TodoId
  parent_run_id = $ParentRunId
  child_run_id = $childRunId
  agent = $AgentName
  model_used = $ModelUsed
  task = $Task
  next_step = "Spawn subagent and then call attach-subagent-session.ps1"
} | ConvertTo-Json -Compress | Write-Host

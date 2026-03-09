# finalize-subagent-run.ps1 — Finalize DB run/event/log for a dispatched subagent (idempotent)

param(
  [Parameter(Mandatory=$false)][string]$ChildSessionKey,
  [Parameter(Mandatory=$false)][string]$TodoId,
  [Parameter(Mandatory=$false)][string]$RunId,
  [Parameter(Mandatory=$false)][string]$AgentName,
  [Parameter(Mandatory=$false)][ValidateSet("completed","failed","cancelled")][string]$Status = "completed",
  [Parameter(Mandatory=$false)][string]$Summary = "Subagent run finalized",
  [Parameter(Mandatory=$false)][string]$ErrorMessage,
  [Parameter(Mandatory=$false)][string]$ModelUsed = "openai-codex/gpt-5.3-codex"
)

$ErrorActionPreference = 'Stop'
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"
$mapPath = Join-Path $scriptsDir "runtime\subagent-dispatch-map.jsonl"
$record = $null

if ($ChildSessionKey) {
  $guardArgs = @{ ChildSessionKey = $ChildSessionKey }
  if ($TodoId) { $guardArgs.TodoId = $TodoId }
  if ($RunId) { $guardArgs.RunId = $RunId }
  if ($AgentName) { $guardArgs.AgentName = $AgentName }

  $guardOut = powershell -ExecutionPolicy Bypass -File "$scriptsDir\guard-subagent-session.ps1" @guardArgs
  $guardJson = $guardOut | ConvertFrom-Json
  if (-not $guardJson.mapped) {
    throw "Unmapped child session detected and breach logged: $ChildSessionKey"
  }

  if (!(Test-Path $mapPath)) { throw "Dispatch map not found: $mapPath" }
  $lines = Get-Content $mapPath | Where-Object { $_ -and $_.Trim() -ne "" }
  for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    $obj = $lines[$i] | ConvertFrom-Json
    if ($obj.childSessionKey -eq $ChildSessionKey) { $record = $obj; break }
  }
  if (-not $record) { throw "No dispatch mapping found for child session: $ChildSessionKey" }

  $TodoId = $record.todoId
  $RunId = $record.childRunId
  $AgentName = $record.agentName
}

if (-not $TodoId -or -not $RunId -or -not $AgentName) {
  throw "Provide either ChildSessionKey or (TodoId + RunId + AgentName)"
}

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

$runRow = Invoke-RestMethod -Uri "$base/agent_runs?id=eq.$RunId&select=id,status,parent_run_id" -Headers $h
if (-not $runRow -or $runRow.Count -eq 0) { throw "Run not found: $RunId" }
$existingStatus = $runRow[0].status
$parentRunId = $runRow[0].parent_run_id
$alreadyTerminal = $existingStatus -in @('completed','failed','cancelled')

if (-not $alreadyTerminal) {
  $updateArgs = @{ RunId = $RunId; Status = $Status; OutputSummary = $Summary; ModelUsed = $ModelUsed }
  if ($ErrorMessage) { $updateArgs.ErrorMessage = $ErrorMessage }
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-agent-run.ps1" @updateArgs | Out-Null

  $eventType = if ($Status -eq "completed") { "task_completed" } elseif ($Status -eq "failed") { "task_failed" } else { "task_cancelled" }
  $level = if ($Status -eq "failed") { "error" } else { "info" }

  powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" -TodoId $TodoId -RunId $RunId -EventType $eventType -ActorType "agent" -ActorName $AgentName -Summary ("$AgentName $Status") | Out-Null

  $logArgs = @{ AgentName = $AgentName; TaskDescription = $Summary; ModelUsed = $ModelUsed; Status = $Status; TodoId = $TodoId; RunId = $RunId; EventType = $eventType; Level = $level }
  if ($ErrorMessage) { $logArgs.ErrorMessage = $ErrorMessage }
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" @logArgs | Out-Null
} else {
  $Status = $existingStatus
}

if ($record -and (Test-Path $mapPath)) {
  $updated = [ordered]@{
    createdAt = $record.createdAt
    todoId = $TodoId
    parentRunId = $parentRunId
    childRunId = $RunId
    agentName = $AgentName
    agentId = $record.agentId
    modelUsed = $record.modelUsed
    childSessionKey = $ChildSessionKey
    spawnRunId = $record.spawnRunId
    status = $Status
    finalizedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
  ($updated | ConvertTo-Json -Compress) | Add-Content -Path $mapPath
}

# Parent/root lifecycle: complete parent when all children terminal
if ($parentRunId -and $parentRunId -match '^[0-9a-f\-]{36}$') {
  $siblings = Invoke-RestMethod -Uri "$base/agent_runs?parent_run_id=eq.$parentRunId&select=id,status" -Headers $h
  $hasOpen = $false
  foreach ($s in $siblings) {
    if ($s.status -notin @('completed','failed','cancelled')) { $hasOpen = $true; break }
  }
  if (-not $hasOpen) {
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-agent-run.ps1" -RunId $parentRunId -Status completed -OutputSummary "All child runs finalized" -ModelUsed $ModelUsed | Out-Null
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" -TodoId $TodoId -RunId $parentRunId -EventType "task_completed" -ActorType "system" -ActorName "Ziko" -Summary "Parent orchestration completed" | Out-Null
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" -AgentName "Ziko" -TaskDescription "Parent run completed after all child runs finalized" -ModelUsed $ModelUsed -Status completed -TodoId $TodoId -RunId $parentRunId -EventType task_completed -Level info | Out-Null
  }
}

[pscustomobject]@{ todo_id = $TodoId; run_id = $RunId; agent = $AgentName; status = $Status; parent_run_id = $parentRunId; skipped = $alreadyTerminal } | ConvertTo-Json -Compress | Write-Host

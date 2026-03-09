# guard-subagent-session.ps1 — Validate child session is mapped to enforced dispatch contract.

param(
  [Parameter(Mandatory=$true)][string]$ChildSessionKey,
  [Parameter(Mandatory=$false)][string]$TodoId,
  [Parameter(Mandatory=$false)][string]$RunId,
  [Parameter(Mandatory=$false)][string]$AgentName
)

$ErrorActionPreference = 'Stop'
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"
$runtimeDir = Join-Path $scriptsDir "runtime"
$mapPath = Join-Path $runtimeDir "subagent-dispatch-map.jsonl"
if (!(Test-Path $runtimeDir)) { New-Item -ItemType Directory -Path $runtimeDir | Out-Null }
if (!(Test-Path $mapPath)) { New-Item -ItemType File -Path $mapPath | Out-Null }

$lines = Get-Content $mapPath | Where-Object { $_ -and $_.Trim() -ne "" }
$record = $null
for ($i = $lines.Count - 1; $i -ge 0; $i--) {
  $obj = $lines[$i] | ConvertFrom-Json
  if ($obj.childSessionKey -eq $ChildSessionKey) { $record = $obj; break }
}

if ($record) {
  [pscustomobject]@{
    ok = $true
    mapped = $true
    child_session_key = $ChildSessionKey
    todo_id = $record.todoId
    run_id = $record.childRunId
    agent = $record.agentName
  } | ConvertTo-Json -Compress | Write-Host
  exit 0
}

# Immediate breach handling
if (-not $TodoId) {
  $TodoId = powershell -ExecutionPolicy Bypass -File "$scriptsDir\create-todo.ps1" -Title "DISPATCH_GUARD_BREACH" -Assignee "Ziko" -Status "in_progress" -Description ("Unmapped child session detected: " + $ChildSessionKey) -SourceMessageId ("guard-breach-" + [guid]::NewGuid().ToString()) -SourceChannel "system" -TaskType "system_task"
}
if (-not $AgentName) { $AgentName = "UnknownAgent" }

$summary = "Contract breach: unmapped child session $ChildSessionKey"
$emitArgs = @{
  TodoId = $TodoId
  EventType = "contract_breach"
  ActorType = "system"
  ActorName = "Ziko"
  Summary = $summary
}
if ($RunId) { $emitArgs.RunId = $RunId }
powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" @emitArgs | Out-Null

$logArgs = @{
  AgentName = "Ziko"
  TaskDescription = $summary
  ModelUsed = "system"
  Status = "failed"
  TodoId = $TodoId
  EventType = "contract_breach"
  Level = "error"
  ErrorMessage = "unmapped_child_session"
}
if ($RunId) { $logArgs.RunId = $RunId }
powershell -ExecutionPolicy Bypass -File "$scriptsDir\log-agent-task.ps1" @logArgs | Out-Null

[pscustomobject]@{
  ok = $false
  mapped = $false
  child_session_key = $ChildSessionKey
  todo_id = $TodoId
  run_id = $RunId
  agent = $AgentName
  action = "contract_breach_logged"
} | ConvertTo-Json -Compress | Write-Host
exit 2

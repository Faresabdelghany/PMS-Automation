param(
  [Parameter(Mandatory=$true)][string]$ParentTodoId,
  [Parameter(Mandatory=$true)][string]$SpecPath,
  [Parameter(Mandatory=$true)][string]$PlanPath,
  [Parameter(Mandatory=$true)][string]$TasksPath,
  [Parameter(Mandatory=$false)][string]$ExpectedAssignee = "Dev"
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

$specOk = Test-Path $SpecPath
$planOk = Test-Path $PlanPath
$tasksOk = Test-Path $TasksPath

$children = Invoke-RestMethod -Uri "$base/todos?parent_task_id=eq.$ParentTodoId&source=eq.speckit&select=id,assignee,order_index,lifecycle_status&order=order_index.asc" -Headers $h
$count = if ($children) { $children.Count } else { 0 }
$ready = @($children | Where-Object { $_.lifecycle_status -eq 'ready' -or $_.lifecycle_status -eq 'in_progress' }).Count
$queued = @($children | Where-Object { $_.lifecycle_status -eq 'queued' }).Count
$allAssignedDev = $true
if ($children) {
  foreach($c in $children){ if ($c.assignee -ne $ExpectedAssignee) { $allAssignedDev = $false; break } }
}

$validQueue = ($count -gt 0 -and $ready -eq 1 -and ($queued -eq ($count - 1)))
$artifactsOk = ($specOk -and $planOk -and $tasksOk)
$contractOk = ($artifactsOk -and $validQueue -and $allAssignedDev)

$result = [pscustomobject]@{
  parent_todo_id = $ParentTodoId
  artifacts = [pscustomobject]@{ spec = $specOk; plan = $planOk; tasks = $tasksOk }
  child_task_count = $count
  ready_or_in_progress_count = $ready
  queued_count = $queued
  all_assigned_dev = $allAssignedDev
  valid_queue = $validQueue
  contract_ok = $contractOk
}

if (-not $contractOk) {
  powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\emit-task-event.ps1" -TodoId $ParentTodoId -EventType "spec_incomplete" -ActorType "agent" -ActorName "Product Analyst" -Summary "PA gate failed: artifacts or child-task queue invalid" | Out-Null
  powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\log-agent-task.ps1" -AgentName "Product Analyst" -TaskDescription "PA gate failed: SpecKit artifacts or child-task queue invalid" -ModelUsed "anthropic/claude-opus-4-6" -Status failed -TodoId $ParentTodoId -EventType "spec_incomplete" -Level error -ErrorMessage "pa_gate_failed" | Out-Null
}

$result | ConvertTo-Json -Depth 6
if (-not $contractOk) { exit 2 }

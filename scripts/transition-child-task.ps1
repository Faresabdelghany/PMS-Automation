param(
  [Parameter(Mandatory=$true)][string]$TaskId,
  [Parameter(Mandatory=$true)][ValidateSet('queued','ready','in_progress','dev_done','in_test','changes_requested','tested_passed','in_review','done','failed','cancelled')][string]$ToStatus,
  [Parameter(Mandatory=$true)][ValidateSet('Product Analyst','Dev','Testing Agent','Code Reviewer','Reviewer','Ziko')][string]$Actor,
  [Parameter(Mandatory=$false)][string]$Summary = ''
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k"; 'Content-Type'='application/json'; Prefer='return=representation' }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

$rows = Invoke-RestMethod -Uri "$base/todos?id=eq.$TaskId&select=id,parent_task_id,lifecycle_status,order_index,source,title,assignee" -Headers @{apikey=$k;Authorization="Bearer $k"}
if (-not $rows -or $rows.Count -eq 0) { throw "Task not found: $TaskId" }
$t = $rows[0]
$from = $t.lifecycle_status

if ($t.source -ne 'speckit') { throw "Task is not a speckit child task" }

# role-based transitions
$allowed = @{
  'Dev' = @('ready:in_progress','changes_requested:in_progress','in_progress:dev_done')
  'Testing Agent' = @('dev_done:in_test','in_test:tested_passed','in_test:changes_requested')
  'Product Analyst' = @('tested_passed:done','tested_passed:in_review','changes_requested:ready','queued:ready')
  'Code Reviewer' = @('in_review:done','in_review:changes_requested')
  'Ziko' = @('queued:cancelled','ready:cancelled','in_progress:failed','in_test:failed','in_review:failed')
}

$edge = "$from`:$ToStatus"
if (-not ($allowed[$Actor] -contains $edge)) {
  throw "Transition not allowed: $Actor cannot do $edge"
}

# enforce single active task in parent queue
if ($ToStatus -in @('ready','in_progress')) {
  $active = Invoke-RestMethod -Uri "$base/todos?parent_task_id=eq.$($t.parent_task_id)&id=neq.$TaskId&source=eq.speckit&lifecycle_status=in.(ready,in_progress)&select=id" -Headers @{apikey=$k;Authorization="Bearer $k"}
  if ($active -and $active.Count -gt 0) {
    throw "Another child task is already active for this parent"
  }
}

$patch = @{ lifecycle_status = $ToStatus }
if ($ToStatus -eq 'in_progress') { $patch.status = 'in_progress' }
elseif ($ToStatus -in @('done','tested_passed','dev_done')) { $patch.status = 'done' }
elseif ($ToStatus -in @('failed','cancelled')) { $patch.status = 'failed' }
elseif ($ToStatus -eq 'changes_requested') { $patch.status = 'todo' }
else { $patch.status = 'todo' }

Invoke-RestMethod -Uri "$base/todos?id=eq.$TaskId" -Method Patch -Headers $h -Body ($patch | ConvertTo-Json) | Out-Null

# unlock next task only when PA marks current task done
if ($Actor -eq 'Product Analyst' -and $ToStatus -eq 'done') {
  $nextOrder = [int]$t.order_index + 1
  $next = Invoke-RestMethod -Uri "$base/todos?parent_task_id=eq.$($t.parent_task_id)&source=eq.speckit&order_index=eq.$nextOrder&select=id,lifecycle_status" -Headers @{apikey=$k;Authorization="Bearer $k"}
  if ($next -and $next.Count -gt 0 -and $next[0].lifecycle_status -eq 'queued') {
    Invoke-RestMethod -Uri "$base/todos?id=eq.$($next[0].id)" -Method Patch -Headers $h -Body '{"lifecycle_status":"ready","status":"todo"}' | Out-Null
  }
}

$evt = if ($ToStatus -eq 'changes_requested') { 'task_failed' } elseif ($ToStatus -in @('done','tested_passed','dev_done')) { 'task_completed' } else { 'task_started' }
$sum = if ($Summary) { $Summary } else { "$Actor transitioned '$($t.title)' ($from -> $ToStatus)" }

# MANDATORY: task_event row (parent task context)
$eventMetaObj = [pscustomobject]@{ 
  child_task_id = $TaskId
  transition = "$from -> $ToStatus"
  actor = $Actor
}
$eventMeta = $eventMetaObj | ConvertTo-Json -Compress
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\emit-task-event.ps1" `
  -TodoId $t.parent_task_id `
  -EventType $evt `
  -ActorType 'agent' `
  -ActorName $Actor `
  -Summary $sum `
  -MetadataJson $eventMeta | Out-Null

# MANDATORY: agent_log row (workflow event proof)
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\log-agent-task.ps1" `
  -AgentName $Actor `
  -TaskDescription $sum `
  -ModelUsed 'workflow' `
  -Status 'completed' `
  -TodoId $t.parent_task_id `
  -EventType $evt `
  -Level 'info' | Out-Null

[pscustomobject]@{ 
  task_id = $TaskId
  parent_task_id = $t.parent_task_id
  from = $from
  to = $ToStatus
  actor = $Actor
  event_written = $true
  log_written = $true
} | ConvertTo-Json -Compress

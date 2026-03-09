param(
  [Parameter(Mandatory=$true)][string]$ParentTodoId,
  [Parameter(Mandatory=$true)][string]$TasksJsonPath,
  [Parameter(Mandatory=$false)][string]$Assignee = "Dev",
  [Parameter(Mandatory=$false)][string]$CreatedByAgent = "Product Analyst"
)

$ErrorActionPreference = 'Stop'
if (!(Test-Path $TasksJsonPath)) { throw "TasksJsonPath not found: $TasksJsonPath" }

$tasks = Get-Content $TasksJsonPath -Raw | ConvertFrom-Json
if (-not $tasks -or $tasks.Count -eq 0) { throw "No tasks found in $TasksJsonPath" }

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k"; "Content-Type" = "application/json"; Prefer = "return=representation" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

# Ensure parent exists
$parent = Invoke-RestMethod -Uri "$base/todos?id=eq.$ParentTodoId&select=id,title" -Headers @{apikey=$k;Authorization="Bearer $k"}
if (-not $parent -or $parent.Count -eq 0) { throw "Parent todo not found: $ParentTodoId" }

$created = @()
for($i=0; $i -lt $tasks.Count; $i++) {
  $t = $tasks[$i]
  $title = [string]$t.title
  if ([string]::IsNullOrWhiteSpace($title)) { continue }
  $desc = [string]$t.description
  $acc = [string]$t.acceptance_criteria
  $order = $i + 1
  $lifecycle = if ($order -eq 1) { 'ready' } else { 'queued' }

  # idempotent upsert by parent_task_id + order_index (spec kit source)
  $payload = @{
    title = $title
    description = $desc
    acceptance_criteria = $acc
    assignee = $Assignee
    status = 'todo'
    category = 'Work'
    priority = 'Medium'
    parent_task_id = $ParentTodoId
    source = 'speckit'
    order_index = $order
    lifecycle_status = $lifecycle
    task_type = 'agent_task'
    workflow_stage = 'DEV'
    created_by_user = 'Fares'
    created_by_agent = $CreatedByAgent
  } | ConvertTo-Json

  $uri = "$base/todos?parent_task_id=eq.$ParentTodoId&order_index=eq.$order&source=eq.speckit"
  $existing = Invoke-RestMethod -Uri "$uri&select=id" -Headers @{apikey=$k;Authorization="Bearer $k"}
  if ($existing -and $existing.Count -gt 0) {
    $id = $existing[0].id
    $patch = Invoke-RestMethod -Uri "$base/todos?id=eq.$id" -Method Patch -Headers $h -Body $payload
    $created += [pscustomobject]@{ id=$id; mode='updated'; order_index=$order; title=$title; lifecycle_status=$lifecycle }
  } else {
    $ins = Invoke-RestMethod -Uri "$base/todos" -Method Post -Headers $h -Body $payload
    $created += [pscustomobject]@{ id=$ins.id; mode='created'; order_index=$order; title=$title; lifecycle_status=$lifecycle }
  }
}

# runtime event/log for ingestion step
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\emit-task-event.ps1" -TodoId $ParentTodoId -EventType "speckit_tasks_imported" -ActorType "agent" -ActorName "Product Analyst" -Summary ("Imported/updated " + $created.Count + " SpecKit child tasks") | Out-Null
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\log-agent-task.ps1" -AgentName "Product Analyst" -TaskDescription ("Imported " + $created.Count + " SpecKit child tasks via approved ingestion path") -ModelUsed "anthropic/claude-opus-4-6" -Status "completed" -TodoId $ParentTodoId -EventType "speckit_tasks_imported" -Level "info" | Out-Null

$created | ConvertTo-Json -Depth 5

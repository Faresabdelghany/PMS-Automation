param(
  [Parameter(Mandatory=$true)][string]$ParentTodoId,
  [Parameter(Mandatory=$true)][ValidateSet('PA','Dev','Tester','Reviewer','Complete')][string]$Stage,
  [Parameter(Mandatory=$false)][string]$Input,
  [Parameter(Mandatory=$false)][string]$Output,
  [Parameter(Mandatory=$false)][string]$Summary
)

$ErrorActionPreference = 'Stop'

# Routing table
switch ($Stage) {
  'PA' {
    # input: parent todo id
    # PA decomposes -> produces spec.md, plan.md, tasks.md
    # caller imports via ingest-speckit-decomposition.ps1
    Write-Host "PA stage: decomposition and artifact generation expected"
    Write-Host "PA must output: spec.md, plan.md, tasks.md"
    Write-Host "Next: run with -Stage Dev after importing"
  }
  'Dev' {
    # Verify PA gate
    if (-not (Test-Path "$Input/spec.md")) { throw "spec.md missing" }
    if (-not (Test-Path "$Input/plan.md")) { throw "plan.md missing" }
    if (-not (Test-Path "$Input/tasks.md")) { throw "tasks.md missing" }
    
    $gate = powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\verify-pa-spec-gate.ps1" `
      -ParentTodoId $ParentTodoId `
      -SpecPath "$Input/spec.md" `
      -PlanPath "$Input/plan.md" `
      -TasksPath "$Input/tasks.md" | ConvertFrom-Json
    
    if (-not $gate.contract_ok) {
      throw "PA gate failed: $($gate | ConvertTo-Json -Compress)"
    }
    
    Write-Host "PA gate passed. Dev may now start."
    Write-Host "Dev works on ready child tasks sequentially."
    Write-Host "Dev transitions via transition-child-task.ps1"
  }
  'Tester' {
    # After Dev marks task dev_done, Tester validates
    Write-Host "Tester validates completed Dev task."
    Write-Host "Tester transitions: dev_done -> in_test -> tested_passed or changes_requested"
  }
  'Reviewer' {
    # After final tested_passed
    Write-Host "Reviewer final quality gate."
    Write-Host "Reviewer transitions: in_review -> done or changes_requested"
  }
  'Complete' {
    # Full workflow trace from parent
    $k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
    $h = @{ apikey = $k; Authorization = "Bearer $k" }
    
    $parent = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?id=eq.$ParentTodoId&select=*" -Headers $h
    $children = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?parent_task_id=eq.$ParentTodoId&source=eq.speckit&select=*&order=order_index.asc" -Headers $h
    $allDone = $children | Where-Object { $_.lifecycle_status -ne 'done' }
    
    $result = [pscustomobject]@{
      parent_todo_id = $ParentTodoId
      parent_status = $parent[0].status
      parent_lifecycle = $parent[0].lifecycle_status
      total_child_tasks = ($children | Measure-Object).Count
      completed_tasks = ($children | Where-Object { $_.lifecycle_status -eq 'done' } | Measure-Object).Count
      all_done = ($allDone | Measure-Object).Count -eq 0
    }
    
    $result | ConvertTo-Json -Depth 3
  }
  default { throw "Unknown stage: $Stage" }
}

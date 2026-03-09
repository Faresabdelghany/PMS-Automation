param(
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$false)][string]$Category = "Work",
  [Parameter(Mandatory=$false)][string]$Priority = "High",
  [Parameter(Mandatory=$false)][string]$Assignee = "Ziko",
  [Parameter(Mandatory=$false)][string]$SourceMessageId,
  [Parameter(Mandatory=$false)][string]$SourceChannel,
  [Parameter(Mandatory=$false)][string]$SourceTs,
  [Parameter(Mandatory=$false)][string]$CreatedByUser = "Fares",
  [Parameter(Mandatory=$false)][string]$CreatedByAgent = "Ziko",
  [Parameter(Mandatory=$false)][ValidateSet("user_task","agent_task","system_task")][string]$TaskType = "user_task"
)

$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

# Deduplicate by source_message_id
if ($SourceMessageId) {
  try {
    $k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
    $h = @{apikey=$k; Authorization="Bearer $k"}
    $existing = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?source_message_id=eq.$SourceMessageId&select=id" -Headers $h
    if ($existing -and $existing.id) {
      Write-Host $existing.id
      exit 0
    }
  } catch {}
}

# Auto-assign based on intent
$lower = $Title.ToLowerInvariant()
$finalAssignee = $Assignee
$finalStage = "PA"
$finalCategory = $Category
if ($lower -match "design|ui|ux|figma|layout|mockup") { $finalAssignee = "Designer"; $finalStage = "SPECIALIST"; $finalCategory = "Work" }
elseif ($lower -match "test|qa|bug|regression|unit test|integration test") { $finalAssignee = "Testing Agent"; $finalStage = "TEST"; $finalCategory = "Development" }
elseif ($lower -match "review|audit|security|code review") { $finalAssignee = "Code Reviewer"; $finalStage = "REVIEW"; $finalCategory = "Development" }
elseif ($lower -match "marketing|seo|copy|launch|campaign|newsletter") { $finalAssignee = "Marketing Agent"; $finalStage = "SPECIALIST"; $finalCategory = "Marketing" }
elseif ($lower -match "job|apply|resume|cv|interview") { $finalAssignee = "Job Search Agent"; $finalStage = "SPECIALIST"; $finalCategory = "Work" }
elseif ($lower -match "research|spec|requirements|analysis|plan") { $finalAssignee = "Product Analyst"; $finalStage = "PA"; $finalCategory = "Work" }
elseif ($lower -match "build|implement|feature|refactor|api|backend|frontend|fix|bugfix|ship") { $finalAssignee = "Dev"; $finalStage = "DEV"; $finalCategory = "Development" }

# Create todo
$todoId = powershell -ExecutionPolicy Bypass -File "$scriptsDir\create-todo.ps1" -Title $Title -Category $finalCategory -Priority $Priority -Assignee $finalAssignee -Status "todo" -SourceMessageId $SourceMessageId -SourceChannel $SourceChannel -SourceTs $SourceTs -WorkflowStage $finalStage -CreatedByUser $CreatedByUser -CreatedByAgent $CreatedByAgent -TaskType $TaskType

# Emit task_created event
if ($todoId -and $todoId -match '^[0-9a-f\-]{36}$') {
  try {
    powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" `
      -TodoId $todoId -EventType "task_created" -ActorType "user" -ActorName $CreatedByUser `
      -Summary "Task created: $Title (assigned to $finalAssignee)"
  } catch {
    Write-Warning "Failed to emit task_created event: $_"
  }
}

Write-Host $todoId

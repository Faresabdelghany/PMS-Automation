param(
  [Parameter(Mandatory=$false)][string]$Limit = "50"
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$hRead = @{apikey=$k; Authorization="Bearer $k"}
$hWrite = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}

function Classify-Intent($title) {
  $t = $title.ToLowerInvariant()
  if ($t -match "design|ui|ux|figma|layout|mockup") { return @{assignee="Designer"; stage="SPECIALIST"; category="Work"} }
  if ($t -match "test|qa|bug|regression|unit test|integration test") { return @{assignee="Testing Agent"; stage="TEST"; category="Development"} }
  if ($t -match "review|audit|security|code review") { return @{assignee="Code Reviewer"; stage="REVIEW"; category="Development"} }
  if ($t -match "marketing|seo|copy|launch|campaign|newsletter") { return @{assignee="Marketing Agent"; stage="SPECIALIST"; category="Marketing"} }
  if ($t -match "job|apply|resume|cv|interview") { return @{assignee="Job Search Agent"; stage="SPECIALIST"; category="Work"} }
  if ($t -match "research|spec|requirements|analysis|plan") { return @{assignee="Product Analyst"; stage="PA"; category="Work"} }
  if ($t -match "build|implement|feature|refactor|api|backend|frontend|fix|bugfix|ship") { return @{assignee="Dev"; stage="DEV"; category="Development"} }
  return @{assignee="Ziko"; stage="SPECIALIST"; category="Work"}
}

# Pull todo tasks
$rows = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?status=eq.todo&select=id,title,assignee,category&limit=$Limit" -Headers $hRead

foreach ($r in $rows) {
  $intent = Classify-Intent $r.title
  $newAssignee = $intent.assignee
  $newStage = $intent.stage
  $newCategory = $intent.category

  # Auto-assign always wins (even if assignee set)
  if ($r.assignee -ne $newAssignee -or $r.category -ne $newCategory) {
    $payload = @{ assignee = $newAssignee; workflow_stage = $newStage; category = $newCategory } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?id=eq.$($r.id)" -Method Patch -Headers $hWrite -Body $payload | Out-Null
    Write-Host "AUTO-ASSIGNED: $($r.title) -> $newAssignee ($newStage)"
  }
}

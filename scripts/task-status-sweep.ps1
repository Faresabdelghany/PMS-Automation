param(
  [int]$Limit = 50
)

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$baseUrl = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$headers = @{ apikey=$anonKey; Authorization="Bearer $anonKey" }

function Strip-Html([string]$html) {
  if (-not $html) { return "" }
  return ($html -replace '<[^>]+>', '')
}

# Pull open tasks
$todoUrl = "$baseUrl/rest/v1/todos?select=id,title,status,assignee,priority,category,workflow_stage,updated_at&status=in.(todo,in_progress)&order=updated_at.desc&limit=$Limit"
$todos = Invoke-RestMethod -Uri $todoUrl -Headers $headers

if (-not $todos -or $todos.Count -eq 0) {
  Write-Host "NO_OPEN_TASKS"
  exit 0
}

$lines = @()
$now = Get-Date
foreach ($t in $todos) {
  $commentUrl = "$baseUrl/rest/v1/comments?todo_id=eq.$($t.id)&select=author,html,created_at&order=created_at.desc&limit=1"
  $logUrl = "$baseUrl/rest/v1/agent_logs?todo_id=eq.$($t.id)&select=agent_name,task_description,created_at,status&order=created_at.desc&limit=1"

  $lastComment = Invoke-RestMethod -Uri $commentUrl -Headers $headers
  $lastLog = Invoke-RestMethod -Uri $logUrl -Headers $headers

  $commentTime = $null
  $commentText = ""
  if ($lastComment -and $lastComment.Count -gt 0) {
    $commentTime = [datetime]$lastComment[0].created_at
    $commentText = (Strip-Html $lastComment[0].html)
  }

  $logTime = $null
  $logText = ""
  if ($lastLog -and $lastLog.Count -gt 0) {
    $logTime = [datetime]$lastLog[0].created_at
    $logText = $lastLog[0].task_description
  }

  $lastActivity = $commentTime
  $activityText = $commentText
  if ($logTime -and (($lastActivity -eq $null) -or ($logTime -gt $lastActivity))) {
    $lastActivity = $logTime
    $activityText = $logText
  }

  $activityText = ($activityText -replace "\s+"," ")
  $activityText = ($activityText -replace "[^\x20-\x7E]", "")
  if ($activityText.Length -gt 80) { $activityText = $activityText.Substring(0,80) + "..." }

  $lastStr = if ($lastActivity) { $lastActivity.ToString("yyyy-MM-dd HH:mm") } else { "no activity" }
  $line = "- [$($t.status)] $($t.title) - $($t.assignee) ($($t.workflow_stage)) | last: $lastStr | $activityText"
  $lines += $line
}

$report = "Task status check @ $(Get-Date -Format 'HH:mm')`n" + ($lines -join "`n")
Write-Host $report

# Runtime observability hardening checks
try {
  powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\recover-stale-runs.ps1" -StaleMinutes 20 -Limit 100 | Out-Host
} catch {
  Write-Host ("WARN recover-stale-runs failed: " + $_.Exception.Message)
}

try {
  powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\detect-contract-breaches.ps1" -LookbackMinutes 180 -Limit 300 | Out-Host
} catch {
  Write-Host ("WARN detect-contract-breaches failed: " + $_.Exception.Message)
}

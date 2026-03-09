param(
  [Parameter(Mandatory=$true)][string]$TodoId,
  [Parameter(Mandatory=$false)][string]$Status,
  [Parameter(Mandatory=$false)][string]$Assignee,
  [Parameter(Mandatory=$false)][string]$Category,
  [Parameter(Mandatory=$false)][string]$Priority,
  [Parameter(Mandatory=$false)][string]$Description,
  [Parameter(Mandatory=$false)][string]$Tag,
  [Parameter(Mandatory=$false)][string]$ClaimedBy,
  [Parameter(Mandatory=$false)][string]$ClaimedAt,
  [Parameter(Mandatory=$false)][string]$WorkflowStage,
  [Parameter(Mandatory=$false)][string]$UpdatedByUser,
  [Parameter(Mandatory=$false)][string]$UpdatedByAgent,
  [Parameter(Mandatory=$false)][string]$LastUpdateSummary,
  [Parameter(Mandatory=$false)][string]$CurrentRunId,
  [Parameter(Mandatory=$false)][switch]$SetLastEventAt,
  [Parameter(Mandatory=$false)][switch]$SetCompletedAt,
  [Parameter(Mandatory=$false)][switch]$SetFailedAt,
  [Parameter(Mandatory=$false)][switch]$SetArchivedAt
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}

$nowUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$payload = @{}
if ($Status)            { $payload.status = $Status }
if ($Assignee)          { $payload.assignee = $Assignee }
if ($Category)          { $payload.category = $Category }
if ($Priority)          { $payload.priority = $Priority }
if ($Description)       { $payload.description = $Description }
if ($Tag)               { $payload.tag = $Tag }
if ($ClaimedBy)         { $payload.claimed_by = $ClaimedBy }
if ($ClaimedAt)         { $payload.claimed_at = $ClaimedAt }
if ($WorkflowStage)     { $payload.workflow_stage = $WorkflowStage }
if ($UpdatedByUser)     { $payload.updated_by_user = $UpdatedByUser }
if ($UpdatedByAgent)    { $payload.updated_by_agent = $UpdatedByAgent }
if ($LastUpdateSummary) { $payload.last_update_summary = $LastUpdateSummary }
if ($CurrentRunId)      { $payload.current_run_id = $CurrentRunId }
if ($SetLastEventAt)    { $payload.last_event_at = $nowUtc }
if ($SetCompletedAt)    { $payload.completed_at = $nowUtc }
if ($SetFailedAt)       { $payload.failed_at = $nowUtc }
if ($SetArchivedAt)     { $payload.archived_at = $nowUtc }

$body = $payload | ConvertTo-Json
$res = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos?id=eq.$TodoId" -Method Patch -Headers $h -Body $body
Write-Host ($res | ConvertTo-Json -Compress)

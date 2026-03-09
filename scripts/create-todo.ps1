param(
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$false)][string]$Category = "Work",
  [Parameter(Mandatory=$false)][string]$Priority = "Medium",
  [Parameter(Mandatory=$false)][string]$Assignee = "Ziko",
  [Parameter(Mandatory=$false)][string]$Status = "todo",
  [Parameter(Mandatory=$false)][string]$Description = "",
  [Parameter(Mandatory=$false)][string]$Tag = "",
  [Parameter(Mandatory=$false)][string]$SourceMessageId,
  [Parameter(Mandatory=$false)][string]$SourceChannel,
  [Parameter(Mandatory=$false)][string]$SourceTs,
  [Parameter(Mandatory=$false)][string]$WorkflowStage = "PA",
  [Parameter(Mandatory=$false)][string]$CreatedByUser = "",
  [Parameter(Mandatory=$false)][string]$CreatedByAgent = "",
  [Parameter(Mandatory=$false)][ValidateSet("user_task","agent_task","system_task")][string]$TaskType = "user_task"
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}
$payload = @{
  title = $Title
  category = $Category
  priority = $Priority
  status = $Status
  assignee = $Assignee
  description = $Description
  tag = $Tag
  workflow_stage = $WorkflowStage
  task_type = $TaskType
}
if ($SourceMessageId) { $payload.source_message_id = $SourceMessageId }
if ($SourceChannel) { $payload.source_channel = $SourceChannel }
if ($SourceTs) { $payload.source_ts = $SourceTs }
if ($CreatedByUser) { $payload.created_by_user = $CreatedByUser }
if ($CreatedByAgent) { $payload.created_by_agent = $CreatedByAgent }

$body = $payload | ConvertTo-Json

$res = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/todos" -Method Post -Headers $h -Body $body
# Return the new id
if ($res -and $res.id) { Write-Host $res.id } else { Write-Host ($res | ConvertTo-Json -Compress) }

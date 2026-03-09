# emit-task-event.ps1 — Insert a task_events row
# Usage: powershell -ExecutionPolicy Bypass -File "emit-task-event.ps1" -TodoId "uuid" -EventType "task_created" -ActorType "agent" -ActorName "Ziko" -Summary "Task created from user message"

param(
  [Parameter(Mandatory=$true)][string]$TodoId,
  [Parameter(Mandatory=$true)][string]$EventType,
  [Parameter(Mandatory=$true)][ValidateSet("user","agent","system")][string]$ActorType,
  [Parameter(Mandatory=$false)][string]$ActorName,
  [Parameter(Mandatory=$true)][string]$Summary,
  [Parameter(Mandatory=$false)][string]$RunId,
  [Parameter(Mandatory=$false)][string]$MetadataJson = "{}"
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=minimal"}

try {
  $metaObj = ConvertFrom-Json -InputObject $MetadataJson
} catch {
  $metaObj = @{}
}

$payload = @{
  todo_id    = $TodoId
  event_type = $EventType
  actor_type = $ActorType
  summary    = $Summary
  metadata   = $metaObj
}
if ($ActorName) { $payload['actor_name'] = $ActorName }
if ($RunId)     { $payload['run_id'] = $RunId }

$body = $payload | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/task_events" -Method Post -Headers $h -Body $body
  Write-Host "Event: $EventType for $TodoId"
} catch {
  Write-Error "Failed to emit task event: $_"
  exit 1
}

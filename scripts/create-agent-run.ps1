# create-agent-run.ps1 — Create an agent_runs row, return the run id
# Usage: powershell -ExecutionPolicy Bypass -File "create-agent-run.ps1" -AgentName "Dev" -TodoId "uuid" [-ParentRunId "uuid"] [-ModelUsed "codex"] [-TriggeredBy "system"] [-ExecutionMode "auto"] [-InputSummary "Build contact form"]

param(
  [Parameter(Mandatory=$true)][string]$AgentName,
  [Parameter(Mandatory=$false)][string]$TodoId,
  [Parameter(Mandatory=$false)][string]$ParentRunId,
  [Parameter(Mandatory=$false)][string]$ModelUsed,
  [Parameter(Mandatory=$false)][string]$TriggeredBy = "system",
  [Parameter(Mandatory=$false)][string]$ExecutionMode = "auto",
  [Parameter(Mandatory=$false)][string]$InputSummary,
  [Parameter(Mandatory=$false)][ValidateSet("queued","running")][string]$Status = "running"
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}

$nowUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$payload = @{
  agent_name     = $AgentName
  status         = $Status
  triggered_by   = $TriggeredBy
  execution_mode = $ExecutionMode
  started_at     = $nowUtc
}
if ($TodoId)       { $payload.todo_id = $TodoId }
if ($ParentRunId)  { $payload.parent_run_id = $ParentRunId }
if ($ModelUsed)    { $payload.model_used = $ModelUsed }
if ($InputSummary) { $payload.input_summary = $InputSummary }

$body = $payload | ConvertTo-Json
try {
  $res = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/agent_runs" -Method Post -Headers $h -Body $body
  if ($res -and $res.id) {
    Write-Host $res.id
  } else {
    Write-Host ($res | ConvertTo-Json -Compress)
  }
} catch {
  Write-Error "Failed to create agent run: $_"
  exit 1
}

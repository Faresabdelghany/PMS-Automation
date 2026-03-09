# update-agent-run.ps1 — Update an agent_runs row
# Usage: powershell -ExecutionPolicy Bypass -File "update-agent-run.ps1" -RunId "uuid" -Status "completed" [-OutputSummary "Built form"] [-ErrorMessage "..."]

param(
  [Parameter(Mandatory=$true)][string]$RunId,
  [Parameter(Mandatory=$false)][ValidateSet("queued","running","completed","failed","cancelled")][string]$Status,
  [Parameter(Mandatory=$false)][string]$OutputSummary,
  [Parameter(Mandatory=$false)][string]$ErrorMessage,
  [Parameter(Mandatory=$false)][string]$ModelUsed
)

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}

$payload = @{}
if ($Status) {
  $payload.status = $Status
  if ($Status -in @("completed","failed","cancelled")) {
    $payload.completed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  }
}
if ($OutputSummary) { $payload.output_summary = $OutputSummary }
if ($ErrorMessage)  { $payload.error_message = $ErrorMessage }
if ($ModelUsed)     { $payload.model_used = $ModelUsed }

if ($payload.Count -eq 0) {
  Write-Host "Nothing to update"
  exit 0
}

$body = $payload | ConvertTo-Json
try {
  $res = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/agent_runs?id=eq.$RunId" -Method Patch -Headers $h -Body $body
  Write-Host "Updated run $RunId -> $Status"
} catch {
  Write-Error "Failed to update agent run: $_"
  exit 1
}

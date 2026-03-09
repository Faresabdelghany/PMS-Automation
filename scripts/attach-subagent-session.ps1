# attach-subagent-session.ps1 — Persist child session mapping for dispatched run

param(
  [Parameter(Mandatory=$true)][string]$TodoId,
  [Parameter(Mandatory=$true)][string]$RunId,
  [Parameter(Mandatory=$true)][string]$AgentName,
  [Parameter(Mandatory=$true)][string]$ChildSessionKey,
  [Parameter(Mandatory=$false)][string]$SpawnRunId
)

$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"
$runtimeDir = Join-Path $scriptsDir "runtime"
$mapPath = Join-Path $runtimeDir "subagent-dispatch-map.jsonl"
if (!(Test-Path $runtimeDir)) { New-Item -ItemType Directory -Path $runtimeDir | Out-Null }
if (!(Test-Path $mapPath)) { New-Item -ItemType File -Path $mapPath | Out-Null }

# Resolve parent run id from DB for stronger attribution
$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"
$run = Invoke-RestMethod -Uri "$base/agent_runs?id=eq.$RunId&select=id,parent_run_id" -Headers $h
$parentRunId = $null
if ($run -and $run.Count -gt 0) { $parentRunId = $run[0].parent_run_id }

$record = [ordered]@{
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  todoId = $TodoId
  parentRunId = $parentRunId
  childRunId = $RunId
  agentName = $AgentName
  childSessionKey = $ChildSessionKey
  spawnRunId = $SpawnRunId
  status = "running"
}
($record | ConvertTo-Json -Compress) | Add-Content -Path $mapPath
Write-Host ($record | ConvertTo-Json -Compress)

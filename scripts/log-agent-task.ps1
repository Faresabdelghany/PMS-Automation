# log-agent-task.ps1 — Log agent task completion to Supabase agent_logs table
# Usage: powershell -ExecutionPolicy Bypass -File "log-agent-task.ps1" -AgentName "Dev" -TaskDescription "Implemented contact form" -ModelUsed "codex" -Status "completed" -TodoId "uuid" [-RunId "uuid"]

param(
    [Parameter(Mandatory=$true)][string]$AgentName,
    [Parameter(Mandatory=$true)][string]$TaskDescription,
    [Parameter(Mandatory=$true)][string]$ModelUsed,
    [Parameter(Mandatory=$true)][ValidateSet("started","in_progress","handoff","completed","failed","cancelled")][string]$Status,
    [Parameter(Mandatory=$true)][string]$TodoId,
    [Parameter(Mandatory=$false)][string]$RunId,
    [Parameter(Mandatory=$false)][string]$EventType,
    [Parameter(Mandatory=$false)][string]$Level = "info",
    [Parameter(Mandatory=$false)][string]$ErrorMessage
)

$supabaseUrl = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"

if (-not $TodoId) { throw "TodoId is required for logging. No log allowed without a linked task." }

$payload = @{
    agent_name       = $AgentName
    task_description = $TaskDescription
    model_used       = $ModelUsed
    status           = $Status
    todo_id          = $TodoId
    level            = $Level
}
if ($RunId)        { $payload.run_id = $RunId }
if ($EventType)    { $payload.event_type = $EventType }
if ($ErrorMessage) { $payload.error_message = $ErrorMessage }
if ($Status -in @("completed","failed","cancelled")) {
    $payload.completed_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$body = $payload | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/agent_logs" -Method Post `
        -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $anonKey"
            "Content-Type" = "application/json"
            "Prefer" = "return=minimal"
        } `
        -Body $body
    Write-Host "Logged: $AgentName | $Status | $TaskDescription"
} catch {
    Write-Error "Failed to log agent task: $_"
    exit 1
}

param(
    [string]$EventType = "agent_message",
    [string]$Message = "",
    [string]$AgentId = "",
    [string]$TaskId = ""
)

$url = "https://pms-dashboard-tau.vercel.app/api/agent-events"
function Get-UserEnvVar([string]$name) {
    try {
        $val = (Get-ItemProperty -Path "HKCU:\Environment" -Name $name -ErrorAction Stop).$name
        return $val
    } catch { return $null }
}

$key = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $key) { $key = Get-UserEnvVar "SUPABASE_SERVICE_ROLE_KEY" }
if (-not $key) { throw "SUPABASE_SERVICE_ROLE_KEY env var is missing (process + HKCU)" }
$orgId = "9c52b861-abb7-4774-9b5b-3fa55c8392cb"

$body = @{ org_id = $orgId; event_type = $EventType; message = $Message }
if ($AgentId) { $body.agent_id = $AgentId }
if ($TaskId)  { $body.task_id  = $TaskId  }

$response = Invoke-RestMethod -Uri $url -Method Post -Headers @{
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
} -Body ($body | ConvertTo-Json)

Write-Host "Event pushed OK: $EventType"
$response | ConvertTo-Json

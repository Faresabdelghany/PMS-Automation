# sync-config.ps1
# Fetches agent model settings from PMS and syncs to openclaw.json.
# Reads ai_provider + ai_model columns and composes full model ID (e.g. anthropic/claude-sonnet-4-6).
# If any model changed, restarts the gateway automatically.

$supabaseUrl = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$serviceKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$orgId       = "9c52b861-abb7-4774-9b5b-3fa55c8392cb"
$configPath  = "C:\Users\Fares\.openclaw\openclaw.json"

# Maps PMS agent name → openclaw agent id
$nameToId = @{
    "Ziko"            = "main"
    "Product Analyst" = "product-analyst"
    "Marketing Agent" = "marketing"
    "Designer"        = "designer"
    "Dev"             = "dev"
    "Code Reviewer"   = "reviewer"
    "Testing Agent"   = "tester"
    "Job Search Agent" = "job-search"
}

# Provider short-name → openclaw provider prefix
$providerMap = @{
    "anthropic"  = "anthropic"
    "google"     = "google"
    "openai"     = "openai"
    "groq"       = "groq"
    "mistral"    = "mistral"
    "xai"        = "xai"
    "deepseek"   = "deepseek"
    "openrouter" = "openrouter"
    "openai-codex" = "openai-codex"
}

$headers = @{ "apikey" = $serviceKey; "Authorization" = "Bearer $serviceKey" }

try {
    # Read ai_provider + ai_model (the real columns in the agents table)
    $agents = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/agents?organization_id=eq.$orgId&select=name,ai_provider,ai_model" -Headers $headers
} catch {
    Write-Host "sync-config: Failed to fetch agents -- $_"
    exit 1
}

$config  = Get-Content $configPath -Raw | ConvertFrom-Json
$changed = $false

foreach ($agent in $agents) {
    $ocId = $nameToId[$agent.name]
    if (-not $ocId) { continue }
    if (-not $agent.ai_model) { continue }

    # Compose full model ID: provider/model (e.g. anthropic/claude-sonnet-4-6)
    $rawProvider = if ($agent.ai_provider) { $agent.ai_provider } else { "anthropic" }
    $mappedProvider = $providerMap[$rawProvider]
    $provider = if ($mappedProvider) { $mappedProvider } else { $rawProvider }
    $fullModel = "$provider/$($agent.ai_model)"

    $entry = $config.agents.list | Where-Object { $_.id -eq $ocId }

    if ($entry) {
        if ($entry.model -ne $fullModel) {
            Write-Host "sync-config: [$($agent.name)] $($entry.model) -> $fullModel"
            $entry.model = $fullModel
            $changed = $true
        }
    }
}

if ($changed) {
    $config | ConvertTo-Json -Depth 20 | Set-Content $configPath -Encoding UTF8
    Write-Host "sync-config: openclaw.json updated -- restarting gateway..."

    powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\push-event.ps1" `
        -EventType "status_change" `
        -Message "Ziko: PMS sync applied -- gateway restarting with updated model config" `
        -AgentId "a2776ed4-b6a6-4465-b060-664d3a99be55"

    Start-Process -FilePath "cmd.exe" -ArgumentList "/c openclaw gateway restart" -NoNewWindow
    Write-Host "sync-config: Gateway restart triggered."
} else {
    Write-Host "sync-config: No changes detected."
}


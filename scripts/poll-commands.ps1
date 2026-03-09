$supabaseUrl = "https://lazhmdyajdqbnxxwyxun.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
$orgId = "9c52b861-abb7-4774-9b5b-3fa55c8392cb"

$headers = @{
    "Authorization" = "Bearer $key"
    "apikey"        = $key
    "Content-Type"  = "application/json"
}

# Fetch pending commands
$commands = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/agent_commands?status=eq.pending&organization_id=eq.$orgId&order=created_at.asc" `
    -Headers $headers

if ($commands.Count -eq 0) {
    Write-Host "No pending commands."
    return @()
}

Write-Host "Found $($commands.Count) pending command(s)."

foreach ($cmd in $commands) {
    Write-Host "Processing: [$($cmd.id)] type=$($cmd.command_type) agent=$($cmd.agent_id)"

    # Look up the agent's session_key
    $agent = $null
    if ($cmd.agent_id) {
        $agent = Invoke-RestMethod `
            -Uri "$supabaseUrl/rest/v1/agents?id=eq.$($cmd.agent_id)&select=id,name,session_key" `
            -Headers $headers | Select-Object -First 1
    }

    $agentName = if ($agent -and $agent.name) { $agent.name } else { "Ziko" }

    # Map Supabase agent name to openclaw agent id
    $nameToOcId = @{
        "Ziko" = "main"; "Product Analyst" = "product-analyst"; "Karim" = "marketing"
        "Design Lead" = "designer"; "Dev" = "dev"; "Nabil" = "main"
        "Omar" = "dev"; "Mostafa" = "dev"; "Sara" = "dev"
    }
    $ocAgentId = if ($nameToOcId.ContainsKey($agentName)) { $nameToOcId[$agentName] } else { "main" }

    Write-Host "Routing to agent: $ocAgentId ($agentName)"

    # Mark as picked up
    Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/agent_commands?id=eq.$($cmd.id)" `
        -Method Patch `
        -Headers $headers `
        -Body '{"status":"picked_up"}' | Out-Null

    # Route to the correct session via openclaw sessions send
    $message = ""
    if ($cmd.command_type -eq "ping") {
        $message = "You have a ping from PMS Mission Control. Reply with your current status."
    } elseif ($cmd.command_type -eq "run_task") {
        $payload = $cmd.payload | ConvertTo-Json -Compress
        $message = "You have a new task dispatched from PMS Mission Control. Task ID: $($cmd.task_id). Payload: $payload. Read your prompt and WORKING.md, then execute this task."
    } elseif ($cmd.command_type -eq "pause") {
        $message = "PMS Mission Control: pause your current work. Update your WORKING.md with current state."
    } elseif ($cmd.command_type -eq "resume") {
        $message = "PMS Mission Control: resume your work. Read your WORKING.md for context."
    } elseif ($cmd.command_type -eq "cancel") {
        $message = "PMS Mission Control: cancel your current task. Update your WORKING.md."
    } elseif ($cmd.command_type -eq "model_update") {
        # Apply model change immediately: update openclaw.json via sync-config, then notify session
        $newModel = $cmd.payload.model
        Write-Host "Model update command: $agentName → $newModel"

        # Run sync-config to update openclaw.json
        powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\sync-config.ps1"

        # Notify the live session to switch model immediately
        $message = "PMS model update: your model has been changed to '$newModel'. Please apply this now by calling session_status with model='$newModel', then confirm the switch."
    } else {
        $message = "PMS command: $($cmd.command_type). Payload: $($cmd.payload | ConvertTo-Json -Compress)"
    }

    # Send to the agent via openclaw agent command
    & openclaw.cmd agent --agent $ocAgentId --message $message 2>&1
    Write-Host "Sent to $ocAgentId ($agentName)"

    # Mark as completed
    Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/agent_commands?id=eq.$($cmd.id)" `
        -Method Patch `
        -Headers $headers `
        -Body '{"status":"completed"}' | Out-Null

    Write-Host "Command $($cmd.id) completed."
}

return $commands

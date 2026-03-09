param(
    [switch]$ClaimOnly
)

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$baseUrl = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

$validAgents = @(
    "Ziko", "Product Analyst", "Dev", "Testing Agent",
    "Code Reviewer", "Designer", "Marketing Agent", "Job Search Agent"
)

# Fetch unclaimed todo tasks
try {
    $readHeaders = @{
        apikey        = $anonKey
        Authorization = "Bearer $anonKey"
    }
    $query = "$baseUrl/rest/v1/todos?status=eq.todo&claimed_by=is.null&select=id,title,category,priority,assignee,description,tag"
    $tasks = Invoke-RestMethod -Uri $query -Headers $readHeaders
} catch {
    Write-Host ("ERROR: Failed to fetch tasks: " + $_.Exception.Message)
    exit 1
}

if (-not $tasks -or $tasks.Count -eq 0) {
    Write-Host "NO_NEW_TASKS"
    exit 0
}

# Filter to tasks assigned to valid agents
$agentTasks = @()
foreach ($task in $tasks) {
    if ($task.assignee -and ($validAgents -contains $task.assignee)) {
        $agentTasks += $task
    }
}

if ($agentTasks.Count -eq 0) {
    Write-Host "NO_NEW_TASKS"
    exit 0
}

# Claim each task
$writeHeaders = @{
    apikey         = $anonKey
    Authorization  = "Bearer $anonKey"
    "Content-Type" = "application/json"
    Prefer         = "return=representation"
}

$claimed = @()
foreach ($task in $agentTasks) {
    try {
        $nowUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $stage = "OTHER"
        switch ($task.assignee) {
          "Product Analyst" { $stage = "PA" }
          "Dev" { $stage = "DEV" }
          "Testing Agent" { $stage = "TEST" }
          "Code Reviewer" { $stage = "REVIEW" }
          default { $stage = "SPECIALIST" }
        }
        $body = '{"claimed_by":"Ziko","claimed_at":"' + $nowUtc + '","status":"in_progress","workflow_stage":"' + $stage + '","last_event_at":"' + $nowUtc + '"}'
        $patchUrl = "$baseUrl/rest/v1/todos?id=eq." + $task.id + "&claimed_by=is.null"
        $updated = Invoke-RestMethod -Uri $patchUrl -Method Patch -Headers $writeHeaders -Body $body
        if ($updated) {
            $claimed += $task

            # Create agent_run for this claim
            try {
                $runId = powershell -ExecutionPolicy Bypass -File "$scriptsDir\create-agent-run.ps1" `
                    -AgentName $task.assignee -TodoId $task.id `
                    -TriggeredBy "system" -ExecutionMode "auto" `
                    -InputSummary $task.title -Status "queued"

                # Link run to todo
                if ($runId -and $runId -match '^[0-9a-f\-]{36}$') {
                    powershell -ExecutionPolicy Bypass -File "$scriptsDir\update-todo.ps1" `
                        -TodoId $task.id -CurrentRunId $runId 2>$null
                }
            } catch {
                Write-Warning ("Failed to create agent_run for: " + $task.title)
            }

            # Emit task_claimed event
            try {
                powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" `
                    -TodoId $task.id -EventType "task_claimed" -ActorType "system" -ActorName "Ziko" `
                    -Summary ("Task claimed for " + $task.assignee + ": " + $task.title)
            } catch {
                Write-Warning ("Failed to emit task_claimed event for: " + $task.title)
            }

            Write-Host ("CLAIMED: " + $task.title + " [assigned to " + $task.assignee + "]")
        }
    } catch {
        Write-Host ("CLAIM_FAILED: " + $task.title + " - " + $_.Exception.Message)
    }
}

if ($claimed.Count -eq 0) {
    Write-Host "NO_NEW_TASKS"
    exit 0
}

$count = $claimed.Count
Write-Host ("TASKS_FOUND:" + $count)
$claimed | ConvertTo-Json -Compress | Write-Host

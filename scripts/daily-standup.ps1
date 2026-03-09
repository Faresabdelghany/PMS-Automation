$supabaseUrl = "https://lazhmdyajdqbnxxwyxun.supabase.co"
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
$today = (Get-Date).ToString("yyyy-MM-dd")
$stuckThresholdMinutes = 30

$headers = @{
    "Authorization" = "Bearer $key"
    "apikey" = $key
}

# Fetch all today's events (max 500)
$events = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/agent_events?organization_id=eq.$orgId&created_at=gte.$($today)T00:00:00Z&order=created_at.asc&limit=500" `
    -Headers $headers

# Separate by type
$completed  = $events | Where-Object { $_.event_type -eq "task_completed" }
$failed     = $events | Where-Object { $_.event_type -eq "task_failed" }
$started    = $events | Where-Object { $_.event_type -eq "task_started" }
$messages   = $events | Where-Object { $_.event_type -eq "agent_message" }

# Build set of task IDs that are done (completed or failed)
$doneIds = @{}
foreach ($e in ($completed + $failed)) {
    if ($e.task_id) { $doneIds[$e.task_id] = $true }
}

# "Stuck" = task_started more than $stuckThresholdMinutes ago with no completion/failure
# Also skip generic session-start noise: "run started" messages
$now = Get-Date
$stuck = $started | Where-Object {
    $msg = $_.message
    $isNoise = ($msg -match "run started" -or $msg -match "via telegram" -or $msg -match "heartbeat")
    $taskId = $_.task_id
    $isOrphaned = (-not $taskId) -or (-not $doneIds.ContainsKey($taskId))
    $startedAt = [DateTime]::Parse($_.created_at)
    $ageMinutes = ($now - $startedAt).TotalMinutes
    (-not $isNoise) -and $isOrphaned -and ($ageMinutes -gt $stuckThresholdMinutes)
}

$date = (Get-Date).ToString("dddd, MMM d, yyyy")
$output = @"
DAILY STANDUP - $date

COMPLETED TODAY ($($completed.Count))
$(if ($completed.Count -gt 0) { ($completed | Select-Object -Last 10 | ForEach-Object { "- $($_.message)" }) -join "`n" } else { "- Nothing completed today" })

STUCK / NEEDS ATTENTION ($($stuck.Count))
$(if ($stuck.Count -gt 0) { ($stuck | ForEach-Object { "- [$([DateTime]::Parse($_.created_at).ToString('HH:mm'))] $($_.message)" }) -join "`n" } else { "- No stuck tasks" })

FAILED ($($failed.Count))
$(if ($failed.Count -gt 0) { ($failed | ForEach-Object { "- $($_.message)" }) -join "`n" } else { "- No failures" })

AGENT MESSAGES ($($messages.Count))
$(if ($messages.Count -gt 5) { (($messages | Select-Object -Last 5 | ForEach-Object { "- $($_.message)" }) -join "`n") + "`n... and $($messages.Count - 5) more" } elseif ($messages.Count -gt 0) { ($messages | ForEach-Object { "- $($_.message)" }) -join "`n" } else { "- No messages" })

Total events today: $($events.Count)
"@

Write-Host $output
return $output

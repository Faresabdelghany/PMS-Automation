$ErrorActionPreference = 'Stop'

$workspace = 'C:\Users\Fares\.openclaw\workspace'
$script = Join-Path $workspace 'scripts\activity-mirror-daemon.js'
$log = Join-Path $workspace 'scripts\activity-mirror.log'
$err = Join-Path $workspace 'scripts\activity-mirror-err.log'

Write-Host "Starting activity mirror daemon..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c node \"$script\" >> \"$log\" 2>> \"$err\"" -WindowStyle Hidden
Write-Host "Started. Logs: $log"

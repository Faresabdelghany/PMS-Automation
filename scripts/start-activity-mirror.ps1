$ErrorActionPreference = 'Stop'

$workspace = 'C:\Users\Fares\.openclaw\workspace'
$script = Join-Path $workspace 'scripts\activity-mirror-daemon.js'
$log = Join-Path $workspace 'scripts\activity-mirror.log'

Write-Host "Starting activity mirror daemon..."
# Do not shell-redirect logs here; daemon writes its own log files.
Start-Process -FilePath "node.exe" -ArgumentList @($script) -WindowStyle Hidden
Write-Host "Started. Logs: $log"

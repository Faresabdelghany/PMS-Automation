$ErrorActionPreference = 'Stop'

$workspaceBat = 'C:\Users\Fares\.openclaw\workspace\scripts\openclaw-daemons.bat'
$startupDir = [Environment]::GetFolderPath('Startup')
$startupBat = Join-Path $startupDir 'openclaw-daemons.bat'

if (!(Test-Path $workspaceBat)) {
  throw "Missing $workspaceBat"
}

Copy-Item -Path $workspaceBat -Destination $startupBat -Force
Write-Host "Updated startup daemon launcher: $startupBat"
Write-Host "On next login it will auto-start notification + sync + activity mirror daemons."

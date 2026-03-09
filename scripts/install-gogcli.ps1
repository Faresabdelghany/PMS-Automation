$ErrorActionPreference = 'Stop'

$installDir = 'C:\Tools\gog'
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

$rel = Invoke-RestMethod -Headers @{ 'User-Agent' = 'openclaw' } -Uri 'https://api.github.com/repos/steipete/gogcli/releases/latest'

$asset = $rel.assets | Where-Object { $_.name -match 'windows' -and $_.name -match '(amd64|x86_64)' -and $_.name -match '\.zip$' } | Select-Object -First 1
if (-not $asset) {
  $asset = $rel.assets | Where-Object { $_.name -match 'windows' -and $_.name -match '\.zip$' } | Select-Object -First 1
}
if (-not $asset) {
  throw 'No Windows zip asset found in latest release.'
}

$zip = Join-Path $env:TEMP $asset.name
Invoke-WebRequest -Headers @{ 'User-Agent' = 'openclaw' } -Uri $asset.browser_download_url -OutFile $zip

Expand-Archive -Force -Path $zip -DestinationPath $installDir

$exe = Get-ChildItem -Path $installDir -Recurse -Filter 'gog.exe' | Select-Object -First 1
if (-not $exe) {
  throw 'gog.exe not found after extraction.'
}

$targetExe = Join-Path $installDir 'gog.exe'
if ($exe.FullName -ne $targetExe) {
  Copy-Item -Force $exe.FullName $targetExe
}

Write-Host 'gog version:'
& (Join-Path $installDir 'gog.exe') --version

$current = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($current -notlike '*C:\Tools\gog*') {
  [Environment]::SetEnvironmentVariable('Path', ($current.TrimEnd(';') + ';C:\Tools\gog'), 'User')
  Write-Host 'Added C:\Tools\gog to USER PATH (new shells only).'
}

Write-Host ('Installed to ' + $installDir)

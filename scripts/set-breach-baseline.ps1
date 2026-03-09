$runtimeDir = "C:\Users\Fares\.openclaw\workspace\scripts\runtime"
$baselinePath = Join-Path $runtimeDir "breach-baseline.txt"
if (!(Test-Path $runtimeDir)) { New-Item -ItemType Directory -Path $runtimeDir | Out-Null }
$now = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
Set-Content -Path $baselinePath -Value $now
Write-Host ("Breach baseline set: " + $now)

$signoff = 'C:\Users\Fares\Downloads\PMS\docs\reports\omar-regression-fix-signoff.md'
$maxWaitSeconds = 3600
$intervalSeconds = 30
$elapsed = 0

Write-Host "Watching for Omar sign-off at: $signoff"

while ($elapsed -lt $maxWaitSeconds) {
    if (Test-Path $signoff) {
        Write-Host "SIGNOFF_FOUND after ${elapsed}s"
        Get-Content $signoff
        exit 0
    }
    Start-Sleep -Seconds $intervalSeconds
    $elapsed += $intervalSeconds
    $mins = [math]::Floor($elapsed / 60)
    Write-Host "Still waiting... ${mins}m elapsed"
}

Write-Host "TIMEOUT after ${maxWaitSeconds}s"
exit 1

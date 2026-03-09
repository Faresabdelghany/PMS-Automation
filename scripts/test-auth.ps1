$url = "https://pms-dashboard-tau.vercel.app/api/agent-events"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"

$body = '{"org_id":"9c52b861-abb7-4774-9b5b-3fa55c8392cb","event_type":"agent_message","message":"test"}'

try {
    $r = Invoke-WebRequest -Uri $url -Method Post `
        -Headers @{ "Authorization" = "Bearer $key"; "Content-Type" = "application/json" } `
        -Body $body -UseBasicParsing
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Body: $($r.Content)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "Status: $status"
    Write-Host "Body: $responseBody"
}

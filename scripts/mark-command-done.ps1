param([string]$CommandId)
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
$headers = @{ Authorization = "Bearer $token"; apikey = $token; "Content-Type" = "application/json"; Prefer = "return=minimal" }
$body = '{"status":"completed"}'
Invoke-RestMethod -Uri "https://lazhmdyajdqbnxxwyxun.supabase.co/rest/v1/agent_commands?id=eq.$CommandId" -Method Patch -Headers $headers -Body $body
Write-Host "Marked $CommandId as completed"

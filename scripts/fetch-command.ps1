$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
$headers = @{
    Authorization = "Bearer $key"
    apikey = $key
}
$r = Invoke-RestMethod -Uri "https://lazhmdyajdqbnxxwyxun.supabase.co/rest/v1/agent_commands?id=eq.3786b754-5ce8-469e-9ba2-b80112ed0746&select=*" -Headers $headers
$r | ConvertTo-Json -Depth 10

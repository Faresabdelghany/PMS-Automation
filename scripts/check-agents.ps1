$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }
$result = Invoke-RestMethod -Uri "https://lazhmdyajdqbnxxwyxun.supabase.co/rest/v1/agents?organization_id=eq.9c52b861-abb7-4774-9b5b-3fa55c8392cb&select=id,name,model,status,role,session_key&limit=3" -Headers $h
$result | ConvertTo-Json

param([Parameter(Mandatory=$true)][string]$TodoId)
$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"}
$log = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/agent_logs?todo_id=eq.$TodoId&order=created_at.desc&limit=1" -Headers $h
$log | ConvertTo-Json -Depth 3

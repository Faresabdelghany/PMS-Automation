param(
  [Parameter(Mandatory=$true)][string]$TodoId,
  [Parameter(Mandatory=$true)][string]$Name
)
$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{apikey=$k; Authorization="Bearer $k"; "Content-Type"="application/json"; Prefer="return=representation"}
$body = @{ todo_id = $TodoId; name = $Name } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1/subtasks" -Method Post -Headers $h -Body $body
$res | ConvertTo-Json -Depth 3

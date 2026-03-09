$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$headers = @{apikey=$anonKey; Authorization="Bearer $anonKey"}
$rows = Invoke-RestMethod -Uri "$base/rest/v1/todos?select=id,title,assignee,status&order=updated_at.desc&limit=10" -Headers $headers
$rows | ConvertTo-Json -Depth 3

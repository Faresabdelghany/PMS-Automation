$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

# Check if task_type column exists
try {
  $test = Invoke-RestMethod -Uri "$base/todos?select=task_type&limit=1" -Headers $h
  Write-Host "Column task_type already exists. Current values:"
  $counts = Invoke-RestMethod -Uri "$base/rpc/exec_sql" -Headers $h -Method Post -ContentType "application/json" -Body '{"query":"SELECT task_type, count(*) FROM todos GROUP BY task_type"}'
  Write-Host ($counts | ConvertTo-Json)
} catch {
  Write-Host "Column does not exist yet or error: $_"
}

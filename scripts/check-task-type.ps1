$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

try {
  $test = Invoke-RestMethod -Uri "$base/todos?select=task_type&limit=3" -Headers $h
  Write-Host "Column EXISTS. Sample values:"
  $test | ForEach-Object { Write-Host "  task_type = $($_.task_type)" }
} catch {
  Write-Host "Column NOT FOUND or error: $($_.Exception.Message)"
}

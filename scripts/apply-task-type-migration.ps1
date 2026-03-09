$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$h = @{ apikey = $k; Authorization = "Bearer $k"; "Content-Type" = "application/json"; Prefer = "return=minimal" }
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co/rest/v1"

# Step 1: Add column via rpc if available, otherwise we need the service role key or dashboard
# Since we only have anon key, let's try using the Supabase SQL editor approach via npx

Write-Host "Attempting migration via npx supabase db push..."
$env:SUPABASE_DB_PASSWORD = $env:SUPABASE_DB_PASSWORD  # should be set already

Push-Location "C:\Users\Fares\PMS-Automation"
$result = & npx supabase db push 2>&1
Write-Host $result
Pop-Location

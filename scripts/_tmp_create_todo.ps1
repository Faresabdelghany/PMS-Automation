$supabaseUrl = "https://uvqnrysmjpyupkhtnyfd.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$body = @{title="Self-improve routine 2026-03-09";task_type="system_task";status="completed";assignee="Ziko"} | ConvertTo-Json
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}
try {
    $r = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/todos" -Method Post -Headers $headers -Body $body
    Write-Host "Created todo:" $r.id
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Error body:" $reader.ReadToEnd()
}

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo"
$base = "https://uvqnrysmjpyupkhtnyfd.supabase.co"

$headers = @{
    apikey = $anonKey
    Authorization = "Bearer $anonKey"
    "Content-Type" = "application/json"
    Prefer = "return=representation"
}

function UpdateAssignee($from, $to) {
    try {
        $body = @{ assignee = $to } | ConvertTo-Json
        $url = "$base/rest/v1/todos?assignee=eq.$from"
        $res = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $body
        Write-Host "Updated $from -> $to (rows: $($res.Count))"
    } catch {
        Write-Host ("ERROR updating ${from} -> ${to}: " + $_.Exception.Message)
        if ($_.Exception.Response) {
            $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $sr.ReadToEnd()
        }
    }
}

UpdateAssignee "PM" "Product Analyst"
UpdateAssignee "QA" "Testing Agent"
UpdateAssignee "HP" "Marketing Agent"
UpdateAssignee "Jason Duong" "Ziko"

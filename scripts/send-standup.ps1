$text = "DAILY STANDUP - Monday Mar 9, 2026 - 12:12 AM Cairo`n`nCompleted Today: 0 - Nothing completed yet`nStuck / Needs Attention: 0 - All clear`nFailed: 0 - No failures`nAgent Messages: 0 - No messages`n`nTotal Events Today: 0`n`nClean slate. New week. Let's make it count!"

$body = @{
    chat_id = "-1003815755547"
    message_thread_id = 2
    text = $text
} | ConvertTo-Json -Depth 3

$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

try {
    $r = Invoke-RestMethod -Uri "https://api.telegram.org/bot7960456391:AAHV4iPrBc_H9x-f3hBBc4a8yt5tX2MMGiY/sendMessage" -Method Post -Body $bytes -ContentType "application/json; charset=utf-8"
    Write-Host "Sent OK: message_id=$($r.result.message_id)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host $_.ErrorDetails.Message
}

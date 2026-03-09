$ErrorActionPreference = 'Stop'

$k = [Environment]::GetEnvironmentVariable('MATON_API_KEY','User')
if (-not $k) { $k = [Environment]::GetEnvironmentVariable('MATON_API_KEY','Machine') }
if (-not $k) { throw 'MATON_API_KEY not found in User or Machine env. Run: setx MATON_API_KEY "..."' }

$headers = @{ 
  Authorization = "Bearer $k"
  'LinkedIn-Version' = '202506'
}

Write-Host 'Testing LinkedIn /rest/me via Maton gateway...'
$me = Invoke-RestMethod -Uri 'https://gateway.maton.ai/linkedin/rest/me' -Headers $headers -Method Get
$me | ConvertTo-Json -Depth 10

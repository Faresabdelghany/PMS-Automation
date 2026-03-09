$ErrorActionPreference = 'Stop'

$envFile = 'C:\Users\Fares\.openclaw\.env'
if (!(Test-Path $envFile)) { throw "Missing .env file at $envFile" }

# Load KEY=VALUE pairs into process env without printing values
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  if ($_ -match '^\s*([^=\s]+)\s*=\s*(.*)\s*$') {
    $k = $matches[1]
    $v = $matches[2]
    $v = $v.Trim().Trim('"')
    Set-Item -Path "Env:$k" -Value $v
  }
}

if (-not $env:MATON_API_KEY) { throw 'MATON_API_KEY not set after loading .env' }
Write-Output ("Loaded MATON_API_KEY (length={0})" -f $env:MATON_API_KEY.Length)

$headers = @{ Authorization = ('Bearer ' + $env:MATON_API_KEY) }

# 1) Maton connections
try {
  $r1 = Invoke-WebRequest -Uri 'https://ctrl.maton.ai/connections?app=linkedin&status=ACTIVE' -Headers $headers -Method GET
  Write-Output ("Maton connections endpoint OK (HTTP {0})" -f $r1.StatusCode)
} catch {
  Write-Output 'Maton connections endpoint FAILED'
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $sr.ReadToEnd()
  }
  exit 1
}

# 2) LinkedIn /me
try {
  $headers2 = $headers.Clone()
  $headers2['LinkedIn-Version'] = '202506'
  $r2 = Invoke-WebRequest -Uri 'https://gateway.maton.ai/linkedin/rest/me' -Headers $headers2 -Method GET
  Write-Output ("LinkedIn /me OK (HTTP {0})" -f $r2.StatusCode)

  # Print only safe fields
  $json = $r2.Content | ConvertFrom-Json
  if ($json.id) { Write-Output ("LinkedIn person id: {0}" -f $json.id) }
  if ($json.localizedFirstName -or $json.localizedLastName) {
    Write-Output ("Name: {0} {1}" -f $json.localizedFirstName, $json.localizedLastName)
  }
} catch {
  Write-Output 'LinkedIn /me FAILED'
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $sr.ReadToEnd()
  }
  exit 1
}

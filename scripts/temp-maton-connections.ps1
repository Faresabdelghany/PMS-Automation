$ErrorActionPreference='Stop'
$envFile='C:\Users\Fares\.openclaw\.env'
Get-Content $envFile | % { if($_ -match '^\s*#' -or $_ -match '^\s*$'){ return }; if($_ -match '^\s*([^=\s]+)\s*=\s*(.*)\s*$'){ $k=$matches[1]; $v=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$k" -Value $v } }
$h=@{ Authorization=('Bearer ' + $env:MATON_API_KEY) }
$r=Invoke-WebRequest -Uri 'https://ctrl.maton.ai/connections?status=ACTIVE' -Headers $h -Method GET
Write-Output $r.Content

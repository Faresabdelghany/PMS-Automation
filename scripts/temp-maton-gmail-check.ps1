$ErrorActionPreference='Stop'
$envFile='C:\Users\Fares\.openclaw\.env'
Get-Content $envFile | ForEach-Object {
  if($_ -match '^\s*#' -or $_ -match '^\s*$'){ return }
  if($_ -match '^\s*([^=\s]+)\s*=\s*(.*)\s*$'){
    $k=$matches[1]; $v=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$k" -Value $v
  }
}
if(-not $env:MATON_API_KEY){ throw 'MATON_API_KEY missing' }
$h=@{ Authorization=('Bearer ' + $env:MATON_API_KEY) }
try{
  $r=Invoke-WebRequest -Uri 'https://ctrl.maton.ai/connections?app=gmail&status=ACTIVE' -Headers $h -Method GET
  Write-Output ('Gmail connections OK (HTTP ' + $r.StatusCode + ')')
  Write-Output $r.Content
}catch{
  Write-Output 'Gmail connections FAILED'
  Write-Output $_.Exception.Message
  if($_.Exception.Response){ $sr=New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Output $sr.ReadToEnd() }
  exit 1
}

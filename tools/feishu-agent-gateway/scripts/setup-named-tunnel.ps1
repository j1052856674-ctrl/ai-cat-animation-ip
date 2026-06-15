param(
  [Parameter(Mandatory = $true)]
  [string]$Hostname,

  [string]$TunnelName = 'ai-cat-feishu-gateway',
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $scriptDir '..\..\..')).Path
}

$gatewayDir = Join-Path $ProjectRoot 'tools\feishu-agent-gateway'
$cloudflaredDir = Join-Path $gatewayDir 'cloudflared'
$cloudflared = Join-Path $gatewayDir 'bin\cloudflared.exe'
$configPath = Join-Path $cloudflaredDir 'config.yml'
New-Item -ItemType Directory -Force -Path $cloudflaredDir | Out-Null

if (-not (Test-Path -LiteralPath $cloudflared)) {
  throw "cloudflared.exe not found: $cloudflared"
}

$certPath = Join-Path $env:USERPROFILE '.cloudflared\cert.pem'
if (-not (Test-Path -LiteralPath $certPath)) {
  Write-Host 'Cloudflare login is required. A browser window will open; choose the domain that owns the hostname.'
  & $cloudflared tunnel login
}

if (-not (Test-Path -LiteralPath $certPath)) {
  throw "Cloudflare origin certificate still not found: $certPath"
}

$list = & $cloudflared tunnel list 2>&1 | Out-String
if ($list -notmatch [regex]::Escape($TunnelName)) {
  & $cloudflared tunnel create $TunnelName
}

$list = & $cloudflared tunnel list 2>&1 | Out-String
$tunnelLine = ($list -split "`r?`n") | Where-Object { $_ -match [regex]::Escape($TunnelName) } | Select-Object -First 1
if (-not $tunnelLine) {
  throw "Unable to find tunnel after create/list: $TunnelName"
}

$tunnelId = ([regex]::Match($tunnelLine, '[0-9a-fA-F-]{36}')).Value
if (-not $tunnelId) {
  throw "Unable to parse tunnel id from: $tunnelLine"
}

$credentialsPath = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"
$config = @"
tunnel: $tunnelId
credentials-file: $credentialsPath

ingress:
  - hostname: $Hostname
    service: http://127.0.0.1:8787
  - service: http_status:404
"@
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($configPath, $config, $utf8NoBom)

& $cloudflared tunnel route dns $TunnelName $Hostname

Write-Host "Named tunnel ready: $TunnelName ($tunnelId)"
Write-Host "Config: $configPath"
Write-Host "Feishu callback URL: https://$Hostname/feishu/events"
Write-Host "Health URL: https://$Hostname/health"
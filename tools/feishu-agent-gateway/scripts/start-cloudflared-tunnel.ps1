param(
  [string]$ProjectRoot = '',
  [string]$ConfigPath = ''
)

$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $scriptDir '..\..\..')).Path
}

$gatewayDir = Join-Path $ProjectRoot 'tools\feishu-agent-gateway'
$runtimeDir = Join-Path $gatewayDir 'runtime'
$cloudflared = Join-Path $gatewayDir 'bin\cloudflared.exe'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (-not $ConfigPath) {
  $ConfigPath = Join-Path $gatewayDir 'cloudflared\config.yml'
}

if (-not (Test-Path -LiteralPath $cloudflared)) {
  throw "cloudflared.exe not found: $cloudflared"
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Cloudflare named tunnel config not found: $ConfigPath. Run scripts\setup-named-tunnel.ps1 first."
}

& $cloudflared tunnel --config $ConfigPath run *> (Join-Path $runtimeDir 'cloudflared.task.log')
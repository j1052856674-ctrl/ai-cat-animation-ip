param(
  [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $scriptDir '..\..\..')).Path
}

$gatewayDir = Join-Path $ProjectRoot 'tools\feishu-agent-gateway'
$runtimeDir = Join-Path $gatewayDir 'runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

Set-Location -LiteralPath $gatewayDir
$env:FEISHU_AGENT_GATEWAY_CONFIG = Join-Path $gatewayDir 'config.json'

node (Join-Path $gatewayDir 'long-connection-client.js') *> (Join-Path $runtimeDir 'gateway-ws.task.log')

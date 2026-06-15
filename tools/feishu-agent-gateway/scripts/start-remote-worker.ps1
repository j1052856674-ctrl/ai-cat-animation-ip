param(
  [string]$ProjectRoot = '',
  [switch]$NoReply,
  [int]$IntervalSeconds = 10
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

$args = @('remote-worker.js', 'watch', '--interval', [string]$IntervalSeconds)
if ($NoReply) { $args += '--no-reply' }

node @args *> (Join-Path $runtimeDir 'remote-worker.task.log')
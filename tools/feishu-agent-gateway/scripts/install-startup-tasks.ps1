param(
  [string]$ProjectRoot = '',
  [string]$LongConnectionTaskName = 'AiCatFeishuLongConnection',
  [string]$GatewayTaskName = 'AiCatFeishuGateway',
  [string]$TunnelTaskName = 'AiCatFeishuCloudflaredTunnel',
  [string]$RemoteWorkerTaskName = 'AiCatFeishuRemoteWorker',
  [switch]$InstallRemoteWorker,
  [switch]$RemoteWorkerNoReply,
  [int]$RemoteWorkerIntervalSeconds = 10,
  [switch]$InstallHttpFallback,
  [switch]$InstallCloudflareFallback
)

$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $scriptDir '..\..\..')).Path
}

$longConnectionScript = Join-Path $ProjectRoot 'tools\feishu-agent-gateway\scripts\start-long-connection.ps1'
$gatewayScript = Join-Path $ProjectRoot 'tools\feishu-agent-gateway\scripts\start-gateway.ps1'
$tunnelScript = Join-Path $ProjectRoot 'tools\feishu-agent-gateway\scripts\start-cloudflared-tunnel.ps1'
$remoteWorkerScript = Join-Path $ProjectRoot 'tools\feishu-agent-gateway\scripts\start-remote-worker.ps1'
$tunnelConfig = Join-Path $ProjectRoot 'tools\feishu-agent-gateway\cloudflared\config.yml'

if (-not (Test-Path -LiteralPath $longConnectionScript)) {
  throw "Missing long-connection script: $longConnectionScript"
}

if ($InstallHttpFallback -and -not (Test-Path -LiteralPath $gatewayScript)) {
  throw "Missing HTTP gateway script: $gatewayScript"
}

if ($InstallRemoteWorker -and -not (Test-Path -LiteralPath $remoteWorkerScript)) {
  throw "Missing remote worker script: $remoteWorkerScript"
}

if ($InstallCloudflareFallback -and -not (Test-Path -LiteralPath $tunnelConfig)) {
  throw "Missing named tunnel config: $tunnelConfig. Run setup-named-tunnel.ps1 before installing the Cloudflare fallback task."
}

$powerShell = (Get-Command powershell.exe).Source
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

$longConnectionAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$longConnectionScript`" -ProjectRoot `"$ProjectRoot`""
Register-ScheduledTask -TaskName $LongConnectionTaskName -Action $longConnectionAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start Feishu Agent Gateway long-connection client at user logon.' -Force | Out-Null
Write-Host "Startup task installed: $LongConnectionTaskName"

if ($InstallRemoteWorker) {
  $workerArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$remoteWorkerScript`" -ProjectRoot `"$ProjectRoot`" -IntervalSeconds $RemoteWorkerIntervalSeconds"
  if ($RemoteWorkerNoReply) { $workerArgs += ' -NoReply' }
  $remoteWorkerAction = New-ScheduledTaskAction -Execute $powerShell -Argument $workerArgs
  Register-ScheduledTask -TaskName $RemoteWorkerTaskName -Action $remoteWorkerAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start Feishu remote-control approved-task worker at user logon.' -Force | Out-Null
  Write-Host "Startup task installed: $RemoteWorkerTaskName"
}

if ($InstallHttpFallback) {
  $gatewayAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$gatewayScript`" -ProjectRoot `"$ProjectRoot`""
  Register-ScheduledTask -TaskName $GatewayTaskName -Action $gatewayAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start local Feishu Agent Gateway HTTP callback fallback at user logon.' -Force | Out-Null
  Write-Host "Startup task installed: $GatewayTaskName"
}

if ($InstallCloudflareFallback) {
  $tunnelAction = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$tunnelScript`" -ProjectRoot `"$ProjectRoot`""
  Register-ScheduledTask -TaskName $TunnelTaskName -Action $tunnelAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start Cloudflare named tunnel fallback for Feishu Agent Gateway at user logon.' -Force | Out-Null
  Write-Host "Startup task installed: $TunnelTaskName"
}

Write-Host 'Startup tasks run under Task Scheduler at user logon; no persistent cmd window is required.'
Write-Host 'Default path is Feishu long connection. Use -InstallHttpFallback and -InstallCloudflareFallback only when callback fallback is needed.'

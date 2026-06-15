---
id: mem-20260615-feishu-gateway-windows-cli-shim-timeout
title: Feishu gateway Windows CLI shim timeout
type: lesson
scope: project
status: active
source: codex
agents: [codex]
created: 2026-06-15
updated: 2026-06-15
bridge: true
supersedes: []
conflicts_with: []
completeness: high
confidence: high
needs_review: false
token_policy: selective-read
---

# Feishu Gateway Windows CLI Shim Timeout

## Symptom

Feishu long-connection mode successfully received `im.message.receive_v1` events, but the gateway did not reply. `runtime/events.ndjson` showed `ws_event_received`, followed by `replyTimedOut: true` after 15 seconds.

## Root Cause

`tools/feishu-agent-gateway/config.json` pointed `larkCliBin` to `C:\Users\Administrator\AppData\Roaming\npm\lark-cli.ps1`. When Node spawned this PowerShell shim from the gateway, the process hung. Direct manual `lark-cli ...` worked because the interactive shell resolved a different runnable path.

Windows-specific details:

- Spawning the `.ps1` shim through PowerShell can hang in this workflow.
- Spawning the `.cmd` shim directly with Node `shell:false` on Node 24 can fail with `spawn EINVAL`.
- Spawning the native `lark-cli.exe` under `@larksuite/cli/bin/` works reliably.

## Fix

Use the native executable for gateway replies:

```text
C:\Users\Administrator\AppData\Roaming\npm\node_modules\@larksuite\cli\bin\lark-cli.exe
```

`server.js` now defaults to this native executable when present, and the local ignored `config.json` was updated to the same path.

## Prevention

For Windows services or Node-spawned automation, prefer native `.exe` binaries over package-manager `.ps1` or `.cmd` shims. If a CLI must be called from Node, validate it with a direct `child_process.spawn(..., { shell: false })` smoke test, not only by typing the command in an interactive shell.
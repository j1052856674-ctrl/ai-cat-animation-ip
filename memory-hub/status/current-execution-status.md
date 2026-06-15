---
id: mem-20260614-current-execution-status
title: Current execution status after toolchain cleanup
type: status
scope: project
status: active
source: codex
agents: [claude, codex]
created: 2026-06-14
updated: 2026-06-15
bridge: false
supersedes: []
conflicts_with: []
completeness: partial
confidence: high
needs_review: false
token_policy: selective-read
---

# Current Execution Status

## Completed

- Removed the old local Feishu webhook wrapper and root Node SDK dependency files.
- Replaced the old multi-Skill entry structure with the `skills/content-ops/` single-entry suite.
- Verified official `lark-cli` installation, bot identity, Sheets writes, and Base writes.
- Added `tools/feishu-agent-gateway/` as the local Feishu event gateway.
- Verified real Feishu group message callbacks and bot replies earlier in the session.
- Switched the gateway to `replyMode: send` and `larkIdentity: bot` for real Feishu replies.
- Added natural-language inbox fallback at `tools/feishu-agent-gateway/runtime/inbox.ndjson`.
- Added `inbox.js` commands: `list`, `reply <messageId> <text>`, and `mark <messageId>`.
- Upgraded gateway routing to a safe allowlist aligned with `skills/content-ops/config/routes.yaml`.
- Added `/命令` and `/help` full command list output.
- Added precise routes for `/采集`, `/选题`, `/脚本`, `/封面`, `/复盘`, `/策略`, `/一条龙`, and `/新手启动`.
- Fixed Windows `.ps1` CLI spawning by routing `lark-cli.ps1` through `powershell.exe -File`.
- Added named tunnel and startup scripts under `tools/feishu-agent-gateway/scripts/`.
- Verified local dry-run routing with UTF-8 payloads: `/命令` -> `help`, `/选题` -> `topic`, ordinary text -> `inbox`.
- Restored the live local gateway on `127.0.0.1:8787` with the real `config.json` after validation.

- Re-verified `server.js` syntax with `node --check tools/feishu-agent-gateway/server.js`.
- Re-verified local live gateway health at `http://127.0.0.1:8787/health`.
- Confirmed project-bundled `tools/feishu-agent-gateway/bin/cloudflared.exe` is available (`cloudflared version 2026.6.0`), even though `cloudflared` is not on PATH.
- Re-verified dry-run event handling on temporary port `8788`: `/status` -> `status`, ordinary Chinese text -> `inbox`, both with `dryRun=true`.
- Started `cloudflared tunnel login` with the project-bundled `cloudflared.exe`; the command opened a Cloudflare browser authorization flow and is waiting for user authorization.
- Rechecked for `~/.cloudflared/cert.pem` for 3 minutes after starting login; the certificate was still missing, so named tunnel creation cannot continue yet.
- Confirmed official Feishu Node SDK `@larksuiteoapi/node-sdk@1.66.1` supports WebSocket long-connection event subscriptions via `WSClient` + `EventDispatcher`.
- Added `tools/feishu-agent-gateway/long-connection-client.js` as a parallel WebSocket client that reuses the existing allowlist routing and inbox fallback.
- Added `tools/feishu-agent-gateway/package.json` and lockfile for the SDK dependency; HTTP callback server remains available as a fallback.
- Verified Feishu long-connection end-to-end: WebSocket client received `/status`, routed it to `status`, and the bot replied successfully in Feishu.
- Fixed Windows reply timeout by switching gateway `larkCliBin` from the npm PowerShell shim (`lark-cli.ps1`) to native `@larksuite/cli/bin/lark-cli.exe`.
- Added WebSocket diagnostics: `ws_event_received`, async reply processing, reply timeout fields, and reply stderr/code logging.
- Added supervised inbox bridge commands: `claim`, `context`, `reply`, and `mark`; `context` prints a compact Context Card for Codex/Claude handoff.
- Added `scripts/start-long-connection.ps1` and changed `scripts/install-startup-tasks.ps1` so Windows startup defaults to the Feishu long-connection client.
- Kept HTTP callback and Cloudflare named tunnel startup as explicit fallback switches: `-InstallHttpFallback` and `-InstallCloudflareFallback`.
- Verified gateway syntax with `npm run check`, inbox bridge list/claim/context/mark on a temporary sample inbox, and PowerShell parser checks for startup scripts.
- Switched the default reply provider from the `lark-cli` subprocess to direct Feishu Node SDK `im.v1.message.reply`; retained `lark-cli` as an opt-in/automatic fallback.
- Updated manual inbox replies to reuse the shared SDK-first reply path.
- Repaired gateway command and reply strings to clean UTF-8 Chinese while preserving the user-validated `/命令` output.
- Verified SDK-first behavior with syntax checks, dry-run `/命令` and `/状态` routing, natural-language inbox routing, and missing-credential diagnostics with CLI fallback disabled.
## Open

- Cloudflare named tunnel remains paused and is now a fallback path because long-connection mode is end-to-end validated.
- Windows startup task registration completed for `AiCatFeishuLongConnection`; it is Ready and will run at user logon.
- The currently running long-connection process has not been restarted in this run, so live Feishu Node SDK reply behavior remains pending until a later restart/re-login test.
- Feishu Open Platform long-connection mode has been enabled and validated for `im.message.receive_v1`; keep it as the preferred path.
- A stable Cloudflare hostname is still needed, for example `feishu-agent.<owned-domain>`.
- After Cloudflare login and hostname selection, run `tools/feishu-agent-gateway/scripts/setup-named-tunnel.ps1 -Hostname <hostname>`.
- After `cloudflared/config.yml` exists, run `tools/feishu-agent-gateway/scripts/install-startup-tasks.ps1` to register Windows startup tasks.
- Update the Feishu event callback URL to `https://<hostname>/feishu/events` after named tunnel health succeeds.
- The Codex/Claude conversation bridge is now a supervised inbox workflow; no automatic responder has been enabled.

## Operating Notes

- Prefer long-connection mode for this internal bot; keep HTTP callback + tunnel as fallback only.
- Current temporary tunnel is a Cloudflare Quick Tunnel and should not be treated as stable or startup-safe.
- Windows startup should use Task Scheduler. Default task is the long-connection client; HTTP callback and Cloudflare tunnel are fallback-only tasks.
- `/命令` is the recommended first Feishu interaction so the user can see the available command list.
- Exact commands should route deterministically; non-exact messages fall back to Codex/Claude inbox judgment.
- Gateway callback code intentionally does not run scraping, publishing, deleting, or arbitrary shell commands inline.
- Use UTF-8 without BOM for CLI JSON payloads and gateway config writes.
- On Windows PowerShell 5, Set-Content -Encoding utf8 writes a BOM; use [System.Text.UTF8Encoding]::new($false) plus [System.IO.File]::WriteAllText(...) for JSON configs consumed by Node.

## Feishu Remote Control Bridge Update (2026-06-15)

- Added a supervised remote-control bridge for natural-language Feishu messages.
- Natural-language fallback now creates a remote task draft with target module, risk level, safety boundary, and confirmation token instead of executing automatically.
- Added approval commands: `确认 <token>` / `approve <token>` moves low/medium-risk tasks to `approved`; `取消 <token>` / `reject <token>` rejects the draft.
- Added `tools/feishu-agent-gateway/remote-control.js` as the local task state and confirmation-token module.
- Added `tools/feishu-agent-gateway/remote-worker.js` as a worker handoff stub that only claims approved tasks and emits a Context Card; it does not run arbitrary shell, publish, delete, or batch collect.
- Extended `inbox.js` with `tasks`, `task-context`, `approve`, and `reject` helpers.
- Verified with `npm run check` and a dry-run simulated draft -> approval flow.

## Remote Control Bridge Open Items

- Live Feishu validation is next: send a natural-language task, confirm with the returned token, and verify it appears in `node tools/feishu-agent-gateway/remote-worker.js list`.
- The worker currently stops at handoff-ready Context Card generation; actual Codex/Claude execution remains manual/controlled by design.

## Remote Worker Hardening (2026-06-15)

- Extended `remote-worker.js` from a single `next` stub to a controlled queue helper: `list [status]`, `all`, `context <taskId>`, `next`, `watch`, `complete`, and `fail`.
- Added `scripts/start-remote-worker.ps1` for optional background/watch mode; it is intentionally not installed by default.
- Extended `scripts/install-startup-tasks.ps1` with optional `-InstallRemoteWorker`, `-RemoteWorkerNoReply`, and `-RemoteWorkerIntervalSeconds` flags.
- Added `scripts/verify-remote-control.js` and `npm run verify:remote` for local dry-run draft -> approval verification without calling Feishu APIs.
- Re-ran `npm run check` and `npm run verify:remote`; both passed.
- Cleared generated test remote task state after verification.

## Needs User Validation / Decision

- Live Feishu validation: send a natural-language task, confirm the token, and verify `node remote-worker.js list` shows the approved task.
- Decide whether to install optional remote worker startup. Recommended first install mode is `-InstallRemoteWorker -RemoteWorkerNoReply` so it produces local handoff context without sending extra Feishu replies.
- Decide the next automation depth: keep worker as handoff-only, or implement a narrow allowlisted content-ops executor for low-risk modules.

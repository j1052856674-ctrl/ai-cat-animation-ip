# Feishu Agent Gateway

> Minimal Feishu event gateway for calling project agents from Feishu. It receives events, verifies requests, routes safe commands, and replies through Feishu Node SDK by default, with `lark-cli` kept as a fallback.

## What It Does

- Receives Feishu event callbacks on `POST /feishu/events`.
- Handles Feishu `url_verification` challenge.
- Verifies `verificationToken` and request signature when configured.
- Routes a safe command set aligned with `skills/content-ops/config/routes.yaml`.
- Sends non-command natural-language messages into a Codex/Claude handoff inbox.
- Replies through `@larksuiteoapi/node-sdk` `im.v1.message.reply` when `replyMode` is `send` and `replyProvider` is `sdk`.

## Command Model

Start with `/鍛戒护` or `/help` to print the full allowlist.

- `/鍛戒护` or `/help` - show the full command list
- `/鐘舵€乣 or `/status` - show gateway status
- `/閲囬泦` or `/绔炲搧璋冪爺` - route to `00-competitor-data`
- `/閫夐` or `/鎺ㄨ崘閫夐` - route to `02-topic`
- `/鑴氭湰` or `/鍐欒剼鏈琡 - route to `03-script`
- `/灏侀潰` or `/鍋氬皝闈 - route to `04-cover`
- `/澶嶇洏` or `/鍒嗘瀽鏁版嵁` - route to `05-review`
- `/绛栫暐` or `/鏇存柊绛栫暐` - route to `01-strategy`
- `/涓€鏉￠緳` or `/浠庨€夐寮€濮媊 - chain `02-topic -> 03-script -> 04-cover`
- `/鏂版墜鍚姩` or `/绗竴娆′娇鐢╜ - route to `06-onboarding`

Exact commands hit the corresponding route first. Natural-language trigger matches can still route to a module summary, while messages that do not match the allowlist go into inbox fallback.

## Safety Boundaries

This gateway does not execute arbitrary shell commands, publish content, delete data, or trigger batch scraping. High-risk actions must remain behind explicit confirmation:

- Publishing content
- Deleting records or files
- Batch collection
- External writes beyond known Feishu project tables
- Platform state changes such as like/comment/follow/post

## Run Locally

```powershell
node tools/feishu-agent-gateway/server.js
Invoke-RestMethod http://127.0.0.1:8787/health
```

## Windows Startup

Use Task Scheduler, not a persistent `cmd` window. Long connection is the default startup path; HTTP callback plus Cloudflare named tunnel is only a fallback.

- `scripts/start-long-connection.ps1` starts the Feishu WebSocket long-connection client.
- `scripts/install-startup-tasks.ps1` registers the long-connection task at user logon.
- `scripts/start-gateway.ps1` starts the local HTTP callback gateway when fallback is needed.
- `scripts/setup-named-tunnel.ps1 -Hostname <host>` creates the named Cloudflare tunnel and writes `cloudflared/config.yml`.
- `scripts/start-cloudflared-tunnel.ps1` runs the named tunnel fallback.

Install the preferred long-connection startup task:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/feishu-agent-gateway/scripts/install-startup-tasks.ps1
```

Install HTTP callback fallback tasks only after the named tunnel is configured:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/feishu-agent-gateway/scripts/setup-named-tunnel.ps1 -Hostname your-hostname.example.com
powershell -NoProfile -ExecutionPolicy Bypass -File tools/feishu-agent-gateway/scripts/install-startup-tasks.ps1 -InstallHttpFallback -InstallCloudflareFallback
```

If callback fallback is enabled, set the Feishu event callback URL to:

```text
https://your-hostname.example.com/feishu/events
```


## Long Connection Mode

Feishu's official Node SDK supports event subscription over WebSocket long connection. This mode lets the local process connect outward to Feishu, so it does not require a public IP, domain, Cloudflare Tunnel, or callback URL for event subscriptions.

Install dependencies and start the WebSocket client:

```powershell
cd tools/feishu-agent-gateway
npm install
npm run start:ws
```

Configuration:

- Set `appId` and `appSecret` in `config.json`, or set `FEISHU_APP_ID` and `FEISHU_APP_SECRET`. The same credentials are used by long connection and Node SDK replies.
- Keep `replyMode: "dry-run"` for local validation; use `replyMode: "send"` only after confirming the target Feishu app and bot permissions. Use `replyProvider: "sdk"` for direct Node SDK replies; set `replyProvider: "lark-cli"` only as a troubleshooting fallback.
- In Feishu Open Platform, enable event subscription long-connection mode for `im.message.receive_v1`.

Limits from the official SDK documentation:

- Long connection currently supports event subscriptions, not callback subscriptions.
- Event handling should complete within 3 seconds, otherwise Feishu may retry.
- If multiple clients are connected for the same app, events are delivered in cluster mode; only one random client receives each event.
## Reply Provider

Default reply path:

- `replyMode: "dry-run"` records routing without sending replies.
- `replyMode: "send"` + `replyProvider: "sdk"` sends text replies with `client.im.v1.message.reply`.
- `sdkFallbackToCli: true` keeps the previous `lark-cli im +messages-reply` path as fallback when SDK credentials or requests fail.
- `FEISHU_AGENT_SDK_FALLBACK_TO_CLI=false` disables CLI fallback for stricter diagnostics.

## Natural Language Inbox

Non-command messages are appended to:

```text
tools/feishu-agent-gateway/runtime/inbox.ndjson
```

Manage pending inbox items:

```powershell
node tools/feishu-agent-gateway/inbox.js list
node tools/feishu-agent-gateway/inbox.js claim <messageId> codex
node tools/feishu-agent-gateway/inbox.js context <messageId>
node tools/feishu-agent-gateway/inbox.js reply <messageId> "reply text"
node tools/feishu-agent-gateway/inbox.js mark <messageId>
```

Recommended supervised bridge flow:

1. `list` shows pending natural-language requests.
2. `claim` prevents duplicate handling by another local agent session.
3. `context` prints a compact Context Card that can be pasted into Codex/Claude before doing work.
4. `reply` sends the human-reviewed response and marks the item handled; `mark` closes items that need no reply.

## Notes

- `replyMode: send` uses Feishu Node SDK by default. If SDK reply fails and `sdkFallbackToCli` is not `false`, the gateway falls back to official `lark-cli`.
- On Windows, `.ps1` CLI bins are invoked through `powershell.exe -File`.
- Use UTF-8 without BOM for JSON passed to `lark-cli @file`.
- The temporary `trycloudflare.com` tunnel is useful for testing but is not startup-safe.
## Remote Control Bridge

Natural-language messages now create a supervised remote task draft instead of executing immediately.

Flow:

1. Feishu natural-language message enters inbox and creates a remote task draft.
2. The bot replies with target module, risk level, safety boundary, and a confirmation token.
3. Reply `确认 <token>` / `approve <token>` to move low/medium-risk tasks to `approved`.
4. Reply `取消 <token>` / `reject <token>` to reject the draft.
5. Local worker commands can inspect or hand off approved tasks; the worker does not run arbitrary shell, publish, delete, or batch collect.

CLI helpers:

```powershell
node tools/feishu-agent-gateway/inbox.js tasks
node tools/feishu-agent-gateway/inbox.js tasks approved
node tools/feishu-agent-gateway/inbox.js approve <token>
node tools/feishu-agent-gateway/inbox.js reject <token>
node tools/feishu-agent-gateway/inbox.js task-context <taskId>
node tools/feishu-agent-gateway/remote-worker.js list
node tools/feishu-agent-gateway/remote-worker.js next --no-reply
```

Runtime state is local-only under `tools/feishu-agent-gateway/runtime/remote-task-state.json` and `remote-tasks.ndjson`.

### Optional Remote Worker Startup

The remote worker is not installed by default. Install it only after you want approved tasks to be picked up automatically at Windows logon:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/feishu-agent-gateway/scripts/install-startup-tasks.ps1 -InstallRemoteWorker -RemoteWorkerNoReply
```

Use `-RemoteWorkerNoReply` for the safest startup mode: the worker writes local handoff context but does not send an additional Feishu reply. Remove that flag only after live validation.

Local verification:

```powershell
cd tools/feishu-agent-gateway
npm run verify:remote
npm run remote-worker:list
```

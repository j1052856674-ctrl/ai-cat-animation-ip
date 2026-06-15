---
id: mem-20260614-feishu-gateway-public-callback-vs-long-connection
title: Feishu gateway public callback vs long connection decision
type: decision
scope: project
status: active
source: codex
agents: [codex]
created: 2026-06-14
updated: 2026-06-14
bridge: true
supersedes: []
conflicts_with: []
completeness: partial
confidence: high
needs_review: false
token_policy: selective-read
---

# Feishu Gateway Public Callback vs Long Connection

## Context

The local Feishu event gateway currently uses HTTP event callbacks, which require Feishu servers to reach the user's machine through a stable public HTTPS URL. A Cloudflare Quick Tunnel works for temporary tests, but a stable Cloudflare named tunnel requires an owned domain/hostname.

The user has not connected or purchased a domain yet and asked why OpenClaw-style tools do not need one.

## Decision

Do not force domain purchase as the only path yet. Before buying a domain, evaluate whether Feishu's long-connection/WebSocket event subscription mode can replace HTTP callbacks for this internal operations bot.

## Rationale

- HTTP callback mode is standard and stable, but requires a public HTTPS endpoint and therefore a stable hostname.
- Long-connection mode is closer to OpenClaw-like UX: the local process actively connects outward, so no public domain is required.
- This project is an internal operations bot, so avoiding domain purchase and callback reconfiguration may be more valuable than sticking to the existing callback architecture.

## Next Check

Confirm official Feishu Node/SDK support for long-connection event subscriptions and whether the current Feishu app can enable that mode. If supported, refactor `tools/feishu-agent-gateway` from HTTP server mode to a supervised long-connection client while preserving the allowlist routing and inbox fallback boundaries.
## Verification Result

Official Feishu/Lark Node SDK support is confirmed in `@larksuiteoapi/node-sdk@1.66.1`:

- Long-connection event subscription uses `Lark.WSClient` with `Lark.EventDispatcher`.
- The SDK documentation states local development can receive events without intranet penetration tools, public IP, or domain.
- The feature has been supported since SDK `1.24.0`; the current package version is `1.66.1`.
- Constraints: event handlers still need to finish within 3 seconds; long connection currently supports event subscriptions, not callback subscriptions; multiple clients use cluster delivery, not broadcast.

## Implementation Decision

Keep the existing HTTP callback server as a fallback, but add a parallel long-connection client first. This avoids losing the already verified callback path while allowing the project to validate domain-free local operation.

Implemented path:

- `tools/feishu-agent-gateway/server.js` now exports shared routing/event helpers without auto-listening when imported.
- `tools/feishu-agent-gateway/long-connection-client.js` starts `WSClient` and forwards `im.message.receive_v1` events into the same gateway handler.
- `tools/feishu-agent-gateway/package.json` pins the official SDK dependency for this gateway.

## Next Check

Manually enable long-connection event subscription in Feishu Open Platform for the app and subscribe to `im.message.receive_v1`, then run `npm run start:ws` under `tools/feishu-agent-gateway` for real message validation.
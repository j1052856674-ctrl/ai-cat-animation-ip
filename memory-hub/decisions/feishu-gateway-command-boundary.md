---
id: mem-20260614-feishu-gateway-command-boundary
title: Feishu gateway command boundary for agent workflows
type: decision
scope: project
status: active
source: codex
agents: [claude, codex]
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

# Feishu Gateway Command Boundary

## Decision

The Feishu gateway should expose a precise allowlisted command surface while leaving deeper execution to Codex/Claude in the CLI.

## Rationale

- Feishu event callbacks must stay fast, deterministic, and safe.
- Exact commands such as `/选题` should route to known `skills/content-ops` modules.
- Natural-language messages should be queued for agent judgment instead of silently triggering workflows.
- High-risk actions such as publish, delete, batch collection, or arbitrary shell execution remain outside the callback path.

## Current Implementation

- Command authority: `skills/content-ops/config/routes.yaml`.
- Gateway route table: `tools/feishu-agent-gateway/server.js`.
- User entrypoint: `/命令` or `/help` shows all available commands.
- Fallback: unmatched messages are appended to `tools/feishu-agent-gateway/runtime/inbox.ndjson`.

## Reuse Insight

Remote chat gateways should separate “intent routing” from “work execution”: the gateway acknowledges and routes, while a supervised agent loop performs the actual work with full context and confirmation gates.
---
id: mem-20260614-toolchain-feishu-ingestion
title: Toolchain converged to OpenCLI plus official lark-cli
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
completeness: complete
confidence: high
needs_review: false
token_policy: selective-read
---

# Toolchain Feishu Ingestion Decision

## Decision

The project toolchain is converged to:

1. OpenCLI for structured Xiaohongshu/Douyin collection.
2. Official `lark-cli` from `@larksuite/cli` for Feishu Base or Sheets ingestion.
3. Chrome only as a single-item fallback for login state checks, visual verification, and missing-field confirmation.

## Retired Approach

The local webhook/Node SDK wrapper under `tools/feishu-cli/` was removed. Root `package.json`, `package-lock.json`, and root `node_modules` were also removed because they only supported the retired `@larksuiteoapi/node-sdk` wrapper path.

Do not reintroduce npm package `lark-cli`; it is not the official Feishu CLI. The official package is `@larksuite/cli`, which exposes the `lark-cli` command.

## Current Project Artifacts

- `skills/00-竞品数据采集/SKILL.md` defines collection, field mapping, dedupe, scoring, compliance, and Feishu ingestion rules.
- `skills/orchestrator.md` routes competitor collection before IP direction validation and topic recommendation.
- `PLAN.md` Q5 now requires official `lark-cli` authorization and a structured Base or Sheets write test.

## Safety Boundaries

- Do not bypass login, captcha, rate limits, or platform controls.
- Do not read, export, or store cookies, tokens, localStorage, app secrets, or private keys.
- Do not claim Feishu write success until an actual Base or Sheets test record is written.

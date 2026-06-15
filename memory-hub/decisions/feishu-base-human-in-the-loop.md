---
id: mem-20260614-feishu-base-human-in-the-loop
name: feishu-base-human-in-the-loop
title: Feishu Base as human-in-the-loop handoff medium
type: decision
scope: project
status: active
source: claude
agents: [claude]
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

# Decision: Feishu Base as Human-in-the-Loop Handoff Medium

## Decision

For workflows where Claude writes structured data that a human must augment (e.g., competitor samples where Claude fills search-level fields and human fills video-level fields), use Feishu Base (多维表格) via lark-cli as the handoff medium.

## Why

Alternatives considered: local CSV (no real-time sync, human must download/re-upload), local Markdown table (not editable), Feishu Sheets (less structured than Base). Feishu Base provides: structured fields with dropdown enums, real-time sync between author and Claude, lark-cli read/write capability verified in this project (Q5 complete), and no file transfer overhead.

## How to apply

Claude writes via `lark-cli base +record-batch-create`. Human opens Feishu client to fill human-verify columns. Claude reads back via `lark-cli base +record-list`. Status flow: OpenCLI → 待核验 → 人类已确认.

Related: [[single-entry-modular-skill-suite]], [[two-phase-annotation-capability-boundary]].

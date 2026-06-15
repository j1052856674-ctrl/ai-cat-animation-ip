---
id: mem-20260614-subagent-provider-no-auto-downgrade
name: subagent-provider-no-auto-downgrade
title: Subagent provider failures may not auto-downgrade to the main model
type: lesson
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

# Lesson: Subagent Provider Failures May Not Auto-Downgrade

## Symptom

Explore/Plan/Claude Code guide subagents failed with provider quota/cooldown errors such as `429` / `kimi-k2.6 cooling down`, even when the main conversation model was still usable.

## Root Cause

The subagent scheduling layer did not automatically fall back to the main conversation model/provider for those agent calls.

## Fix

When subagents fail due to provider availability, ask the user whether to continue with the main model, retry later, or restrict work to direct Read/Grep/Glob tools. For implementation requested explicitly via subagents, keep the subagent requirement and pause if all workers are unavailable instead of silently switching execution mode.

## How to Avoid Next Time

Treat subagent availability as a runtime dependency, not guaranteed capacity. For plans involving parallel subagents, include a fallback policy before execution.

Related: [[single-entry-modular-skill-suite]].

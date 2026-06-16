---
id: mem-20260614-two-phase-annotation-capability-boundary
name: two-phase-annotation-capability-boundary
title: Two-phase annotation with explicit AI capability boundary
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

# Decision: Two-Phase Annotation with Explicit AI Capability Boundary

## Decision

For competitor data collection where Claude cannot watch videos, use a two-phase annotation workflow: (1) Claude infers what it can from search metadata (tags, desc, title) and fills search-level fields; (2) human opens video links and fills video-level fields (visual style, rhythm, hook strategy, character consistency). Every dimension is explicitly marked as ✅ inferable, 🟡 partially inferable, or 🔴 requires-human.

## Why

Claude has no video understanding capability. Claiming to know visual style, rhythm, or hook strategy from search metadata alone would produce unreliable data that breaks downstream strategy decisions. Splitting into search-level and human-verify phases with a capability boundary table makes the constraint explicit and the workflow auditable.

## How to apply

When designing AI-assisted data collection workflows, start by listing every field and classifying it by AI capability. Fields AI cannot fill go into a separate human-verify group. The handoff contract (Feishu Base in our case) tracks which fields are filled by whom.

Related: [[single-entry-modular-skill-suite]], [[toolchain-three-layer-architecture]].

---
id: mem-20260617-video-analysis-skill-design
title: Zero-runtime video analysis Skill design
type: decision
scope: project
status: active
source: codex
agents: [codex]
created: 2026-06-17
updated: 2026-06-17
bridge: true
supersedes: []
conflicts_with: []
completeness: partial
confidence: high
needs_review: false
token_policy: selective-read
---

# Decision: Zero-runtime Video Analysis Skill

## Decision

Create `skills/video-analysis/` as a zero-runtime design-layer Skill for short-video analysis. The Skill defines workflow, model strategy, provider config contract, output schema, report template, and execution-stage environment checks, but does not install Python dependencies or call external APIs by default.

## Rationale

The project needs video-level understanding for hook, conflict, emotion curve, pacing, and reusable content formulas. Existing competitor collection explicitly treats video-level fields as human-verified because the current collection pipeline cannot see video. A separate video-analysis Skill creates a clean upgrade path without breaking the existing OpenCLI-first collection workflow.

## Reference Patterns

- ALBEDO `video-copy-analyzer`: useful for video acquisition, embedded subtitle/OCR/ASR fallback, and transcript-first processing.
- Rico3cats `wow-video-analyzer`: useful for combining compressed video + transcript in a visual model and returning structured dimensions.

## Boundaries

- Default mode is `design-only`.
- Do not install Python/Node dependencies or download ASR/OCR models unless the user explicitly asks to execute.
- Do not call paid or external model APIs without explicit user instruction and cost/data-boundary awareness.
- Do not treat long-context text models as video readers unless their API supports video file, `video_url`, or frame/image input.

## Current Artifacts

- `skills/video-analysis/SKILL.md`
- `skills/video-analysis/schemas/video-analysis.schema.json`
- `skills/video-analysis/references/model-selection.md`
- `skills/video-analysis/references/report-template.md`

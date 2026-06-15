---
id: mem-20260614-single-entry-modular-skill-suite
name: single-entry-modular-skill-suite
title: Single-entry modular Skill suite pattern
type: decision
scope: project
status: active
source: claude
agents: [claude, worker-code]
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

# Decision: Single-Entry Modular Skill Suite

## Decision

For the project content-operations skills, use a **single external Skill entry** at `skills/content-ops/SKILL.md` while keeping internal methods modular under `modules/`, `config/`, `schemas/`, and `VC.md`.

## Why

A giant single-file Skill would inflate context, couple unrelated operations, and make handoff/verification hard. Multiple independently exposed Skills would make routing and direct-trigger behavior ambiguous. A single entry with modular internals gives one user-facing surface while preserving maintainable boundaries.

## How to apply

When building project-specific Skill suites, expose one stable entrypoint for users and keep reusable or stage-specific logic in module/config/schema files. Treat `VC.md` and result schemas as the contract boundary between natural-language guidance and automation.

Related: [[avoid-giant-skill-and-hidden-orchestrator-assumptions]], [[review-20260614-skills-architecture]].

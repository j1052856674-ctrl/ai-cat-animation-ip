---
id: mem-20260614-avoid-giant-skill-and-hidden-orchestrator-assumptions
name: avoid-giant-skill-and-hidden-orchestrator-assumptions
title: Avoid giant Skill files and hidden orchestrator assumptions
type: lesson
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

# Lesson: Avoid Giant Skill Files and Hidden Orchestrator Assumptions

## Symptom

The original `skills/` design had a root `orchestrator.md` plus independently triggerable child Skills. It claimed to be the unique entry, but direct child triggers could bypass its prerequisite checks. The alternative of merging everything into one giant Skill would also create a large, hard-to-maintain prompt.

## Root Cause

The architecture mixed user-facing routing, module methods, and runtime discoverability without a clear contract boundary. It assumed the orchestrator would always intercept requests even though runtime routing behavior had not been verified.

## Fix

Refactor to a standard single-entry suite: `skills/content-ops/SKILL.md` is the user-facing entry, while modules remain internal documentation with shared route/config/schema contracts. Direct-trigger failure modes are handled through `Missing Input Handling` in every module.

## How to Avoid Next Time

Do not rely on an informal router file as a unique runtime entry unless discovery/routing is verified. Avoid giant Skill files; use one entry plus modular internals and machine-readable contracts.

Related: [[single-entry-modular-skill-suite]], [[review-20260614-skills-architecture]].

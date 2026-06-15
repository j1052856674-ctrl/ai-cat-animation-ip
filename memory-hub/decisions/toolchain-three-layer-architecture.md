---
id: mem-20260614-toolchain-three-layer-architecture
name: toolchain-three-layer-architecture
title: Three-layer toolchain architecture with single source of truth
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

# Decision: Three-Layer Toolchain Architecture

## Decision

Content operations toolchain is organized in three layers with `config/toolchain.yaml` as the single source of truth:
- **Layer 0**: System tools (npm global: OpenCLI, lark-cli) — browser automation and API clients
- **Layer 1**: Project tools (`tools/`) — custom runtime servers (feishu-agent-gateway)
- **Layer 2**: Skill instructions (`skills/content-ops/`) — Claude prompt-level methodology

`tools/` is NOT a Skill because it contains executable runtime code, not prompt instructions. The SKILL.md `depends_on` points to `config/toolchain.yaml` for command-level detail.

## Why

The user asked whether feishu-agent-gateway should be a Skill. It should not — Skills are "what Claude should think," tools are "what machines execute." Confusing them would put executable code under `skills/` or prompt instructions under `tools/`, creating architectural ambiguity.

## How to apply

New project infrastructure: system tools → Layer 0 (reference only, not project-managed). Custom servers/scripts → `tools/` (Layer 1). Prompt-level methodology → `skills/` (Layer 2). Single `toolchain.yaml` documents all tools, their commands, known issues, and fallback paths.

Related: [[single-entry-modular-skill-suite]].

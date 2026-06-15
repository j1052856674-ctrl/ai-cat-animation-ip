---
id: mem-20260614-worktree-base-head-for-local-repos
name: worktree-base-head-for-local-repos
title: Use worktree.baseRef=head for newly initialized local repositories
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

# Decision: Claude Worktrees Use Local HEAD

## Decision

For this project, Claude Code worktree creation should branch from the current local `HEAD` via:

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

Stored in `.claude/settings.json`.

## Why

The repository was initialized locally and has no `origin` remote. Claude Code's default `fresh` mode may try to branch from `origin/<default-branch>`, which is unavailable in a local-only repository.

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Keep default `fresh` | Requires an `origin` remote/default branch; not currently true. |
| Configure custom WorktreeCreate/WorktreeRemove hooks | More complex and unnecessary now that Git is initialized. |
| Avoid worktree isolation | Acceptable for read-only review, but risky for multi-agent edits. |

## How to Apply

Use `worktree.baseRef=head` for local-only projects until a remote default branch exists. If the project later adds a canonical remote, revisit whether `fresh` is preferable for clean-base worktrees.

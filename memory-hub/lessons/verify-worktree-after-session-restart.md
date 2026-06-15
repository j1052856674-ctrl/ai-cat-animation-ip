---
id: mem-20260614-verify-worktree-after-session-restart
name: verify-worktree-after-session-restart
title: Verify Claude Code worktree state after repository changes with a fresh session
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

# Lesson: Claude Code Session Metadata Can Lag Behind Git Initialization

## Symptom

After running `git init` and committing the project, the `EnterWorktree` tool still reported that the current directory was not a Git repository.

## Root Cause

The Claude Code session appears to cache repository/worktree capability metadata at startup. Because the session began before `git init`, the tool still used the old non-Git state even though Git commands already worked.

## Fix

Verify the lower-level Git capability directly:

- `git rev-parse --is-inside-work-tree`
- `git worktree add ... HEAD`
- `git worktree list`

Then restart Claude Code or open a new session before relying on Claude's Agent/worktree isolation.

## How to Avoid Next Time

For projects that need multi-agent/worktree isolation, initialize Git and create the baseline commit before starting the Claude Code session, or restart immediately after Git initialization.

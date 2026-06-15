---
id: mem-20260614-opencli-stderr-module-loading-noise
name: opencli-stderr-module-loading-noise
title: OpenCLI loads ~79 global modules producing stderr warnings on every command
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

# Lesson: OpenCLI Global Module Loading Noise

## Symptom

Every `opencli` command produces 60+ lines of `⚠ Failed to load module ... must declare access: 'read' | 'write'` warnings in stderr, burying actual search results in noise.

## Root Cause

OpenCLI loads ALL ~79 installed modules on startup regardless of which command is being run. Modules that haven't been updated to the newer access-control API (`access: 'read'`) produce a warning per module. The actual command (e.g., `xiaohongshu search`) runs correctly — the warnings are cosmetic.

## Fix

Append `2>/dev/null` to all OpenCLI commands to suppress stderr. Data goes to stdout unaffected:
```bash
opencli xiaohongshu search "<keyword>" --limit 10 -f yaml 2>/dev/null
opencli douyin search "<keyword>" --limit 10 -f yaml 2>/dev/null
```

## How to Avoid Next Time

Check command output separation: if warnings go to stderr while data goes to stdout, `2>/dev/null` is the standard fix. Do not attempt to fix OpenCLI module source code directly.

Related: [[opencli-xiaohongshu-note-api-v183-breaking-change]], [[opencli-douyin-interaction-data-zeros]].

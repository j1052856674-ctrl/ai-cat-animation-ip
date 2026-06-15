---
id: mem-20260614-windows-powershell-cli-spawn-and-encoding
title: Windows PowerShell CLI spawn and UTF-8 payload pitfalls
type: lesson
scope: project
status: active
source: codex
agents: [claude, codex]
created: 2026-06-14
updated: 2026-06-14
bridge: true
supersedes: []
conflicts_with: []
completeness: partial
confidence: high
needs_review: false
token_policy: selective-read
---

# Windows PowerShell CLI Spawn And Encoding

## Problem

Node `spawn()` failed with `spawn EFTYPE` when pointed directly at `lark-cli.ps1`, and PowerShell-generated UTF-8 test payloads converted Chinese command text into question marks in some contexts.

## Root Cause

- Windows `.ps1` shims are scripts, not native executables; Node should invoke them through `powershell.exe -File`.
- Older Windows PowerShell command construction and here-strings can corrupt non-ASCII test payloads depending on console/codepage behavior.
- UTF-8 with BOM can also break JSON consumed by `lark-cli @file`.

## Fix

- Gateway detects `.ps1` CLI bins and runs `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <bin> ...args`.
- Local route validation used Node-generated payloads with Unicode escapes to avoid shell transcoding.
- JSON/config writes use UTF-8 without BOM where practical.

## Prevention

When validating chat/webhook routes on Windows, generate non-ASCII payloads from Node or a known UTF-8 no-BOM file; do not trust terminal-rendered Chinese as proof that the HTTP body is correct.
---
id: mem-20260614-omit-optional-tool-params
name: omit-optional-tool-params
title: Omit optional tool parameters instead of passing empty strings
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

# Lesson: Omit Optional Tool Parameters

## Symptom

Multiple `Read` tool calls failed because the optional `pages` parameter was passed as an empty string (`""`) for non-PDF markdown files.

## Root Cause

Optional tool parameters are not equivalent to empty values. For `Read`, `pages` must either be omitted or contain a valid PDF page range such as `"1-5"`. An empty string is invalid.

## Fix

When a tool field is optional and not semantically needed, omit the field entirely. If the harness or caller accidentally injects an empty value, switch to a valid value only when it matches the file type and tool semantics.

## How to Avoid Next Time

Before retrying a failed tool call, inspect the exact error and remove invalid optional parameters instead of repeating the same call shape with path variations.

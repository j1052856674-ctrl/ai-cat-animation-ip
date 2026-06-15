---
id: mem-20260614-opencli-xiaohongshu-note-api-v183-breaking-change
name: opencli-xiaohongshu-note-api-v183-breaking-change
title: xiaohongshu note/comments v1.8.3 requires full signed URL not note-id
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

# Lesson: xiaohongshu note API v1.8.3 Breaking Change

## Symptom

`opencli xiaohongshu note "<note-id>" -f yaml` returned `ok: false, error: ARGUMENT, message: xiaohongshu note now requires a full signed URL`. Same error for `comments` subcommand.

## Root Cause

OpenCLI v1.8.3 changed the `note` and `comments` subcommands: they now require a complete signed URL with `xsec_token` query parameter, not a bare note-id. The `xsec_token` is available in the `url` field returned by `xiaohongshu search`.

## Fix

Extract the full URL from search results (including `?xsec_token=...`) and pass it directly:
```bash
opencli xiaohongshu note "<full-url-with-xsec-token>" -f yaml 2>/dev/null
opencli xiaohongshu comments "<full-url-with-xsec-token>" --limit 5 -f yaml 2>/dev/null
```

If search result URL has no xsec_token, fall back to search-level data only — do not attempt to construct the URL manually.

## How to Avoid Next Time

Document API-breaking changes in toolchain.yaml immediately when discovered. Check `--help` output when a previously-working command fails.

Related: [[opencli-stderr-module-loading-noise]].

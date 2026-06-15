---
id: mem-20260614-opencli-douyin-interaction-data-zeros
name: opencli-douyin-interaction-data-zeros
title: 抖音 search API returns 0 for plays/comments/shares
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

# Lesson: 抖音 Search API Returns Zero for Interaction Fields

## Symptom

`opencli douyin search` consistently returns `plays: 0, comments: 0, shares: 0` for all results, even when `likes` shows thousands. This makes engagement rate calculation impossible from search-level data alone.

## Root Cause

Douyin's search results page does not expose plays/comments/shares in its DOM. OpenCLI can only extract `likes` from the search listing. Full interaction data requires opening the video detail page.

## Fix

- Accept that `plays`/`comments`/`shares` will be 0 from search results
- Mark `data_confidence` as `待核验` for Douyin samples
- Use Chrome to manually open top-20 detail pages for verification
- Do NOT claim to have complete Douyin interaction data from OpenCLI alone

## How to Avoid Next Time

Set expectations before 抖音 searches: state in methodology docs that only `likes` is reliable from search, all other metrics need Chrome verification. This prevents downstream analysis from being built on incomplete data.

Related: [[opencli-stderr-module-loading-noise]], [[two-phase-annotation-capability-boundary]].

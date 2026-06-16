# Project Memory Index: ai-cat-animation-ip

Project-local UAM index. Read this before legacy `.claude/memory` for durable project context.

- architecture-map: content-ops Skill 全架构地图（19 文件+7 模块+4 层契约+修复记录）；details in `architecture-map.md`。**新 session 必读。**
- toolchain-feishu-ingestion: Toolchain is OpenCLI collection, official `lark-cli` Feishu ingestion, Chrome single-item fallback; details in `decisions/toolchain-feishu-ingestion.md`.
- current-execution-status: Current Phase 0 progress and blocking items; details in `status/current-execution-status.md`.
- review-20260614-skills: Deep review of the project `skills/` system; details in `reviews/review-20260614-skills.md`.
- review-20260614-skills-architecture: Deep review of whether `skills/` should be a big Skill, orchestrator role, and refactor scope; details in `reviews/review-20260614-skills-architecture.md`.
- single-entry-modular-skill-suite: Decision to expose one content-ops Skill entry while keeping internals modular; details in `decisions/single-entry-modular-skill-suite.md`.
- avoid-giant-skill-and-hidden-orchestrator-assumptions: Lesson on avoiding giant Skill files and unverifiable router assumptions; details in `lessons/avoid-giant-skill-and-hidden-orchestrator-assumptions.md`.
- subagent-provider-no-auto-downgrade: Lesson that subagent provider failures may not auto-fallback to the main model; details in `lessons/subagent-provider-no-auto-downgrade.md`.
- git-worktree-enablement: Git repository and Claude worktree setup status; details in `status/git-worktree-enablement.md`.
- worktree-base-head-for-local-repos: Decision to use local HEAD for Claude worktrees in local-only repos; details in `decisions/worktree-base-head-for-local-repos.md`.
- subagent-context-starvation: Lesson on giving subagents full project context (architecture-map + decisions + lessons) to avoid blind-executor pattern; details in `lessons/subagent-context-starvation.md`。
- omit-optional-tool-params: Lesson on omitting optional tool parameters instead of passing empty strings; details in `lessons/omit-optional-tool-params.md`.
- two-phase-annotation-capability-boundary: Decision to split competitor data collection into Claude-inferred metadata + human-verified video dimensions; details in `decisions/two-phase-annotation-capability-boundary.md`.
- toolchain-three-layer-architecture: Decision to organize tools as system→project→skill layers with toolchain.yaml as single source of truth; details in `decisions/toolchain-three-layer-architecture.md`.
- feishu-base-human-in-the-loop: Decision to use Feishu Base as the handoff medium for human-verification workflows; details in `decisions/feishu-base-human-in-the-loop.md`.
- opencli-stderr-module-loading-noise: Lesson on OpenCLI loading ~79 modules producing stderr noise, fixed with 2>/dev/null; details in `lessons/opencli-stderr-module-loading-noise.md`.
- opencli-xiaohongshu-note-api-v183-breaking-change: Lesson on xiaohongshu note v1.8.3 requiring full signed URL instead of note-id; details in `lessons/opencli-xiaohongshu-note-api-v183-breaking-change.md`.
- opencli-douyin-interaction-data-zeros: Lesson on 抖音 search returning 0 for plays/comments/shares, requiring Chrome verification; details in `lessons/opencli-douyin-interaction-data-zeros.md`.
- collection-round-1-complete: 首轮竞品采集完成——74 条入飞书 Base，top-20 人类核验清单已就绪；details in `status/collection-round-1-complete.md`。
- lark-cli-batch-create-datetime-epoch: Lesson on lark-cli datetime 字段必须用 epoch 毫秒，字符串格式均失败；details in `lessons/lark-cli-batch-create-datetime-epoch.md`。

Legacy `.claude/memory/` exists as an import source only; new durable project facts should be written here.
- feishu-gateway-command-boundary: Decision to keep Feishu gateway as a precise allowlisted command router with inbox fallback; details in `decisions/feishu-gateway-command-boundary.md`.
- windows-powershell-cli-spawn-and-encoding: Lesson on invoking `.ps1` CLIs and preserving UTF-8 Chinese payloads on Windows; details in `lessons/windows-powershell-cli-spawn-and-encoding.md`.
- feishu-gateway-public-callback-vs-long-connection: Decision to evaluate Feishu long-connection mode before buying a domain for stable HTTP callback; details in `decisions/feishu-gateway-public-callback-vs-long-connection.md`.
- feishu-gateway-windows-cli-shim-timeout: Lesson that Windows npm `.ps1`/`.cmd` shims can hang/fail under Node spawn; use native `lark-cli.exe` for gateway replies; details in `lessons/feishu-gateway-windows-cli-shim-timeout.md`.
- crawl-strategy-decision: 采集方案选型——基于OpenCLI + Browser模式；details in `decisions/crawl-strategy-decision.md`（已废弃Evil0ctal/Docker方案）.
- python-314-pydantic-fail: Python 3.14无法构建pydantic_core，本地部署失败；details in `lessons/python-314-pydantic-fail.md`.
- playwright-social-crawl-patterns: Playwright采集两层策略+反模式（硬编码RAW_DATA不是采集）；details in `decisions/playwright-social-crawl-patterns.md`.
- keyword-strategy-optimization: 关键词四维组合法+方向可行性判断框架+质量评估指标；details in `decisions/keyword-strategy-optimization.md`.
- skill-split-content-ops: 从单体 content-ops 拆分为 6 个独立 Skill + 总控；details in `decisions/skill-split-content-ops.md`.

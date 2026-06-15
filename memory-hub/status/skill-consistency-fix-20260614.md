---
name: skill-consistency-fix-20260614
description: content-ops Skill 12 项一致性问题修复——status 枚举/skill_run_id/字段名对齐/VC修正
type: status
scope: project
status: active
source: claude
agents: [claude]
created: 2026-06-14
updated: 2026-06-14
bridge: true
completeness: high
confidence: high
needs_review: false
token_policy: selective-read
---

# Skill 一致性问题修复记录

## 背景

采集竞品数据前，对 content-ops Skill 做了全量 deep review（3 个 Explore Agent 并行扫描 19 个文件），发现 12 项一致性/完整性问题。

## 修复清单

| # | 问题 | 影响 | 状态 |
|---|------|------|:--:|
| I1 | status 枚举三方冲突（schema: success/partial/error, SKILL.md: completed/needs_human, modules: 各不同） | Module 间无法统一消费 result block | ✅ |
| I2 | skill_run_id 格式冲突（schema: content-ops-*, modules: 各用各的） | 跨模块追踪断链 | ✅ |
| I3 | VC-HANDOFF-01 引用 topic-card 不存在的字段 | 验收测试假阴性 | ✅ |
| I4 | Module 00-03 缺 frontmatter | 无元数据标注依赖和输入 | ✅ |
| I5 | 三对 module 文档与 schema 字段名漂移 (02/topic-card, 03/script-outline, 04/cover-package) | Agent 产出不合 schema | ✅ |
| I6 | direction_type 在 data-fields 有但 schema 无 | 字段无定义源 | ✅ |
| I7 | Module 01 自定义 6 值 status 不合标准 | 策略模块无法接入统一 pipeline | ✅ |
| I8 | human_verify 枚举 module 与 schema 不一致 | 飞书数据枚举值冲突 | ✅ |
| I9 | data-fields 缺 职场配音 | 枚举不完整 | ✅ |
| I10 | data-fields 和 module 缺 无法判断 | 边界情况无合法值 | ✅ |
| I11 | toolchain-feishu-ingestion.md 引用旧路径 | 误导 | ⏸️ P2 |
| I12 | worktree 新旧结构并存 | 混淆 | ⏸️ P2 |

## 裁决原则

- **Schema JSON 是机器可解析的权威契约** → module 文档和 VC 以 schema 为准
- **SKILL.md 是 status 枚举的权威源** → 所有 Module 和 schema 对齐 SKILL.md
- **先修 P0（采集阻塞）→ 跑采集 → 修 P1（分析前）→ 修 P2（下一周期前）**

## 最终标准

- status: `completed | degraded | blocked | needs_human`（全项目统一）
- skill_run_id: `content-ops-{module}-{YYYYMMDD}-{NNN}`
- 7 个 module 都有 YAML frontmatter
- module 02/03/04 字段名与各自 schema 一致

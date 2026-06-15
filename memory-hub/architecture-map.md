---
name: architecture-map
description: content-ops Skill 体系架构图——19 个文件、7 个模块、4 层契约、12 项已修复一致性问题
type: project
bridge: true
created: 2026-06-14
updated: 2026-06-14
completeness: high
confidence: high
needs_review: false
token_policy: full-read
---

# content-ops Skill 架构图

> 读完此文件 ≈ 读完 skills/content-ops/ 下 19 个文件的关键知识。

## 文件地图

```
skills/content-ops/
├── SKILL.md              ← 总控入口（路由+标准循环+安全边界+统一输出格式）
├── README.md             ← 人类可读概览
├── VC.md                 ← 验证契约（8 类 VC 断言）
├── config/
│   ├── routes.yaml       ← 触发词→模块路由表
│   ├── platform-matrix.yaml ← 小红书/抖音/B站平台参数
│   ├── data-fields.yaml  ← 全链路数据字段定义+来源矩阵
│   └── toolchain.yaml    ← 三层工具链定义+已知问题
├── schemas/
│   ├── skill-result.schema.json    ← 统一 result block（status/skill_run_id/outputs）
│   ├── topic-card.schema.json      ← 选题卡 required: id/title/platforms/content_type/rationale/priority
│   ├── script-outline.schema.json  ← 脚本大纲 required: script_id/type/title/platforms/segments/voice_notes
│   ├── cover-package.schema.json   ← 封面包 required: id/script_id/cover_texts/tags/titles/descriptions/ai_prompt
│   ├── competitor-sample.schema.json ← 竞品样本（_search_basics/_claude_annotations/_human_verify/_scoring）
│   └── content-file-contract.md    ← content/*.md 文件的前置元数据契约
└── modules/
    ├── 00-competitor-data.md  ← 竞品采集（二阶段标注+飞书交接）
    ├── 01-strategy.md         ← 账号策略维护（change_level + status）
    ├── 02-topic.md            ← 选题推荐（产出 topic-card）
    ├── 03-script.md           ← 脚本创作（产出 script-outline）
    ├── 04-cover.md            ← 封面包装（产出 cover-package）
    ├── 05-review.md           ← 发布复盘（依赖 Codex 管线）
    └── 06-onboarding.md       ← 新手启动（环境检查+最小路径）
```

## 核心设计原则

| 原则 | 实现 |
|------|------|
| 单入口 | SKILL.md 是唯一入口，modules/ 不直接暴露 |
| 模块可自引导 | 每个 module 有 Missing Input Handling，即使绕过总控也能处理上游缺失 |
| 二阶段标注 | Claude 标注搜索级字段 → 人类核验视频级字段（🔴不可推断 → 标 待核验） |
| 三层工具链 | Layer0=OpenCLI/lark-cli → Layer1=feishu-agent-gateway → Layer2=content-ops Skill |
| 契约驱动 | schemas/ JSON Schema 是权威契约，module 文档和 VC 以 schema 为准 |
| 人类决策点显式 | 关键决策不自动化，由 creator 确认 |

## 标准循环

```
00-采集 → 01-策略 → 02-选题 → 03-脚本 → 04-封面 → 发布 → 05-复盘 → 01-策略 → ...
```

## 统一契约

- **status**: `completed | degraded | blocked | needs_human`（全项目统一，schema 和 7 个 module 一致）
- **skill_run_id**: `content-ops-{module}-{YYYYMMDD}-{NNN}`（schema pattern: `^content-ops-[a-z0-9-]+-\d{8}-\d{3}$`）

## 工具依赖

| 工具 | 层级 | 用途 | 状态 |
|------|:---:|------|:---:|
| OpenCLI 1.8.3 | Layer0 | 小红书/抖音搜索采集 | ✅ |
| lark-cli 1.0.53 | Layer0 | 飞书 Base/Sheets 读写 | ✅ 已授权 |
| Chrome | Layer0 | 单条核验+补采 | 手动 |
| feishu-agent-gateway | Layer1 | 飞书群消息桥接 | ✅ dry-run |
| Codex 数据管线 | Layer2 | 发布数据自动采集 | ⏸️ P2+ |

## 已修复的一致性问题 (2026-06-14)

12 项问题已全部修复，详见 `memory-hub/status/skill-consistency-fix-20260614.md`：
- Status 枚举三方冲突 → 统一到 completed/degraded/blocked/needs_human
- skill_run_id 格式 → 统一到 content-ops-{module}-{YYYYMMDD}-{NNN}
- Module 02/03/04 字段名 → 对齐各自 JSON Schema
- Module 01 → 加 change_level 字段
- VC-HANDOFF-01 → 字段修正
- Module 00-03 → 补齐 YAML frontmatter
- competitor-sample.schema.json → 加 direction_type
- data-fields.yaml → 补全 无法判断/职场配音 枚举

## 飞书竞品表

- Base: `MCwibHumUasGTJsQAtRcicDInph`
- Table: `竞品样本` (`tblU23Fw2FnTjIIQ`)
- 链接: https://my.feishu.cn/base/MCwibHumUasGTJsQAtRcicDInph

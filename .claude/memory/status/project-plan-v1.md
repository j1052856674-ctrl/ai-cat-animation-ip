---
name: project-plan-v1
description: 猫猫动画IP项目整体规划已定稿，进入前置探索阶段
metadata:
  type: status
  bridge: true
---

# 项目规划 V1 已定稿

**当前阶段**: P0 前置探索（5 个关键问题需回答）
**规划文件**: `PLAN.md`
**参与人**: 你（架构师/AI 研发）+ 朋友（运营/业务）

## 核心架构摘要

- **运营中枢**: 飞书群（@agent 下指令 + Gatekeeper 审核 + 数据看板）
- **发布渠道**: 小红书 + 抖音
- **视频生产**: 初期小云雀网页版手动 → 后期 Cookie API Wrapper 自动化
- **Agent 体系**: 9 个 agent（趋势/竞品→选品→文案→生产→Gatekeeper→发布→数据→复盘 + 飞书 Bot）
- **数据策略**: 半自动（飞书多维表格 + 第三方工具 + 人工录入），不做实时爬虫
- **Codex 后台跑 agent，Claude Code 做规划写脚本**

## 依赖关系

P0（前置探索）→ P1（基建+IP+试水）→ P2（飞书Bot+Gatekeeper）→ P3（完整飞轮）→ P4（自动化+Paperclip）→ P5（变现）

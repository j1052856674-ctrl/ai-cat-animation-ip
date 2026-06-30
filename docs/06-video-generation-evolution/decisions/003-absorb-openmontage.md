# 决策 003：吸收 OpenMontage 设计模式

> **状态**：已确认（部分吸收）
> **日期**：2026-06-30
> **影响范围**：架构设计、质量管控、成本管理

---

## 背景

OpenMontage 是全球首个开源 Agent 驱动视频生产系统（29K+ stars），其设计理念非常先进。

## 决策

**吸收 OpenMontage 的设计模式，但只吸收理念和独立组件，不 fork 完整仓库。**

## 吸收内容

| 内容 | 是否吸收 | 理由 |
|---|---|---|
| **Pipeline Manifest 模式** | ✅ | 结构化的 Agent 工作流定义 |
| **Reviewer Meta Skill** | ✅ | 自动化质量审查 |
| **Checkpoint + Resume 机制** | ✅ | 解决 Session 中断问题 |
| **Cost Tracker** | ✅ | 成本透明、预算管控 |
| **Tool Registry + Selector 模式** | ✅ | 工具自动发现与路由 |
| **Remotion 组件库** | ✅ | 字幕、封面、片尾 |
| **完整 Pipeline 系统** | ❌ | 太重，和我们的 content-ops 重叠 |
| **57+ 工具** | ❌ | 只吸收 Remotion 组件，不 fork 完整仓库 |
| **本地 GPU 模型** | ❌ | 不需要本地部署 |

## 影响

- **AGPL 风险**：不 fork 完整仓库，只吸收独立组件，避免许可证风险
- **技术栈分裂**：Python（数据/编排）+ Node.js（Remotion）明确分工
- **学习成本**：需理解 Pipeline Manifest、Reviewer 等概念

## 下一步

1. 移植 Remotion 组件（TextCard、CaptionOverlay、AnimeScene）
2. 设计 Pipeline Manifest 格式
3. 实现 Checkpoint + Resume 机制
4. 实现 Cost Tracker

---

*最后更新：2026-06-30*

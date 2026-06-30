---
name: video-generation-evolution-plan
description: 视频生成技术演进方案——用libtv替代小云雀+多模型解耦+OpenMontage模式吸收
updated: 2026-06-30
lifecycle: active
supersedes: 
---

# 视频生成技术演进方案决策

## 决策摘要

**用 libtv（liblib CLI）替代小云雀作为视频生成引擎**，同时吸收 OpenMontage 设计模式，建立多模型解耦的自动化视频生产体系。

## 关键决策

### 1. 用 libtv 替代小云雀

**原因**：
- 小云雀 Web UI 无法自动化，无法集成到 Agent 工作流
- libtv CLI 支持程序化调用，支持图生视频（解决猫 IP 一致性）
- libtv 单条视频成本约 $0.05，可控透明

**影响**：
- 技术栈新增 libtv CLI（Node.js 环境）
- 成本从"免费额度"变为"按条计费"
- 流程从"人工操作 Web UI"变为"Agent 自动调用 CLI"

### 2. 脚本/图片/视频模型解耦

**原因**：
- libtv 内置的 text model（GVLM 3.1）和 image model（LibNano Pro）在各自领域不如 Claude/GPT-4o/Midjourney/FLUX
- Seedance 2.0 图生视频是核心优势，保留在 libtv

**架构**：
```
Claude/GPT 写脚本 ────┐
                      │
Midjourney/FLUX 生图 ─┼──▶ libtv 画布 ──▶ 视频生成
                      │
Seedance 2.0（libtv）──┘
```

### 3. 吸收 OpenMontage 设计模式

**吸收内容**：
- Pipeline Manifest 模式
- Reviewer Meta Skill（自动化质量审查）
- Checkpoint + Resume 机制（解决 Session 中断）
- Cost Tracker（成本透明、预算管控）
- Tool Registry + Selector 模式
- Remotion 组件库（字幕、封面、片尾）

**不吸收内容**：
- 完整 Pipeline 系统（太重，和 content-ops 重叠）
- 57+ 工具（AGPL 许可证风险）
- 本地 GPU 模型（不需要）

## 相关文档

- 完整方案：`docs/06-video-generation-evolution/`（8 个文件）
- 整合计划：`docs/06-video-generation-evolution/03-integration-plan.md`
- 架构设计：`docs/06-video-generation-evolution/02-architecture.md`
- 模型注册表：`docs/06-video-generation-evolution/04-model-registry.md`

## 下一步

**P0 验证**（第 1-2 周）：
1. 安装 libtv CLI
2. 验证图生视频（猫 IP 一致性）
3. 评估单条视频成本
4. 验证外部模型→libtv 工作流串联

**P1 基建**（第 2-3 周）：
- Provider Registry + ModelSelector
- config/models.yaml + config/presets.yaml
- Remotion 组件库集成

**P2 集成**（第 3-4 周）：
- 改造 content-ops Skill
- Reviewer Meta Skill
- Gatekeeper 增强

**P3 优化**（第 5-6 周）：
- 质量优化
- 多模式扩展
- 数据闭环

---

*最后更新：2026-06-30*

# 视频生成技术演进方案

> **目标**：构建多模型解耦、成本可控、质量可审计的自动化视频生产体系
> **范围**：脚本生成 → 图片生成 → 视频生成 → 合成包装 → 发布
> **预计周期**：4-6 周

---

## 文档索引

| 文档 | 说明 | 状态 |
|---|---|---|
| [01-vision.md](./01-vision.md) | 项目愿景、核心痛点、收益预期 | 🔄 规划中 |
| [02-architecture.md](./02-architecture.md) | 多模型架构设计（模型无关 + Selector + Provider） | 🔄 规划中 |
| [03-integration-plan.md](./03-integration-plan.md) | 整合实施计划（4 阶段） | 🔄 规划中 |
| [04-model-registry.md](./04-model-registry.md) | 模型注册表、预设策略、成本对比 | 🔄 规划中 |
| [decisions/](./decisions/) | 决策记录（ADR） | 🔄 进行中 |

---

## 核心变化速览

### 之前（小云雀时代）

```
内容运营
    │
    ▼
小云雀 Web UI
    │
    ▼
人工下载 → 手动发布
```

**痛点**：
- ❌ 无法程序化调用
- ❌ 角色一致性差
- ❌ 无工作流编排
- ❌ 成本不透明

### 之后（新架构）

```
内容运营（content-ops Skill）
    │
    ├───────────────┬───────────────┬────────────────┐
    ▼               ▼               ▼                ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│ Script │    │ Image  │    │ Video  │    │ Compose│
│ Skill  │    │ Skill  │    │ Skill  │    │ Skill  │
│(Claude)│    │(MJ/FLUX│    │(libtv) │    │(Remotion│
└───┬────┘    └───┬────┘    └───┬────┘    └───┬────┘
    │             │             │             │
    └─────────────┴─────────────┴─────────────┘
                  │
                  ▼
           飞书 Gatekeeper
                  │
                  ▼
           小红书/抖音发布
```

**收益**：
- ✅ 脚本/图片/视频完全解耦，各自选最佳模型
- ✅ 图生视频保证猫 IP 一致性
- ✅ 成本透明（每条视频精确到分）
- ✅ 支持 A/B 测试、快速切换模型

---

## 关键决策

| # | 决策 | 状态 | 文档 |
|---|---|---|---|
| 001 | 用 libtv（liblib CLI）替代小云雀 | ✅ 已确认 | [decisions/001-use-libtv.md](./decisions/001-use-libtv.md) |
| 002 | 脚本/图片/视频模型解耦独立 | ✅ 已确认 | [decisions/002-model-decoupling.md](./decisions/002-model-decoupling.md) |
| 003 | 吸收 OpenMontage 设计模式 | 🔄 待确认 | [decisions/003-absorb-openmontage.md](./decisions/003-absorb-openmontage.md) |

---

## 下一步行动

1. **P0 验证**（第 1-2 周）：安装 libtv → 验证图生视频 → 验证脚本/图片上传 → 评估成本
2. **P1 基建**（第 2-3 周）：Provider Registry → Selector → 配置文件
3. **P2 集成**（第 3-4 周）：改造 Skill → 接入 content-ops → Gatekeeper 增强
4. **P3 优化**（第 5-6 周）：质量优化 → 多模式扩展 → 数据闭环

---

*最后更新：2026-06-30*

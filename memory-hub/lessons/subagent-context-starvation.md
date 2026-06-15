---
name: subagent-context-starvation
description: 给 subagent 高效传递项目上下文的标准模板——避免把 agent 当盲执行器
type: lesson
scope: project
source: claude
agents: [claude]
created: 2026-06-14
bridge: true
completeness: high
confidence: high
needs_review: false
token_policy: full-read
---

# 踩坑：Subagent 上下文饥饿

## 问题

2026-06-14 在 content-ops Skill 修复任务中，启动了 9 个 subagent（3 探索 + 3 设计 + 3 修复），每个只给了文件路径和具体任务，**没给项目上下文**（这是什么项目、当前处于什么阶段、有哪些已知决策和踩坑）。

后果：
- 修复 Agent 不知道为什么要改——可能 miss 掉跨文件的隐性约束
- 探索 Agent 重复推导了已有决策的结论
- 没有任何 Agent 知道 `toolchain.yaml` 里记录的已知问题（如 xiaohongshu 需要完整 URL），如果任务涉及调用 OpenCLI 可能撞坑

## 根因

1. **默认心智模型错**："agent = 执行工具"而非"agent = 有上下文的协作者"
2. **效率压力下过度压缩 prompt**：追求"最少信息完成当前任务"而非"充足上下文做出好判断"
3. **缺少自动化触发**：没有 checklist 或模板机制在启动 agent 前强制补充 context

## 如何避免

### 每个 subagent prompt 必须包含的上下文块

```markdown
## Project Context
- **项目**: ai-cat-animation-ip（AI猫猫动画IP内容运营）
- **类型**: 非代码项目（Skill 设计/文档工作区）
- **当前阶段**: [具体阶段，如：Phase 0 竞品数据采集准备]
- **架构图**: memory-hub/architecture-map.md（读此文件≈读完 19 个核心文件）
- **相关决策**: [列出与本任务相关的 decision 文件，如 two-phase-annotation]
- **相关踩坑**: [列出与本任务相关的 lesson 文件，如 opencli-douyin-interaction-zeros]
- **关键文件**: [列出本任务直接涉及的文件路径]
```

### 最小上下文检查清单

启动 subagent 前自问：

- [ ] Agent 知道这是什么项目吗？
- [ ] Agent 知道当前处于哪个阶段（Phase 0/1/2）吗？
- [ ] 如果任务涉及工具调用，Agent 看到 `toolchain.yaml` 了吗？
- [ ] 如果任务涉及 Schema/VC 判断，Agent 知道 Schema 是权威契约吗？
- [ ] 有没有相关的踩坑经验需要提醒？

### 具体做法

在 prompt 开头固定一段：

```
You are working on the ai-cat-animation-ip project — an AI cat animation content operations Skill suite.
Current phase: [Phase 0 competitor data collection / Phase 1 skill refinement / etc].
The Skill architecture is documented at memory-hub/architecture-map.md — read it if you need file layout.
Key design principles: [single-entry suite, two-phase annotation, three-layer toolchain, schema-as-contract].
Relevant known issues: [list from toolchain.yaml known_issues or lesson files].
```

**Why**: 这段约 200 tokens 的上下文能让 agent 做出正确判断、不重复踩坑、产出与项目一致的输出。

**How to apply**: 从下次 subagent 调用开始，prompt 必须包含上述上下文块。缺失时视为 launch 不完整。

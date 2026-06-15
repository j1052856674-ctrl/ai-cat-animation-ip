---
name: subagent-overload-silent-failure
description: worker-code subagent 单次负载过大导致静默失败（输出0字节），须分阶段执行
type: lesson
bridge: true
created: 2026-06-15
severity: high
recurrence_count: 2
related: [[architecture-map]], [[toolchain-three-layer-architecture]]
---

# Subagent Overload → 静默失败

## 现象

worker-code subagent 启动后输出文件始终 0 字节，无任何错误信息，无超时通知，静默死亡。

**复现场景**（2026-06-15 连续 2 次）：
1. Agent a99b64a820b5b3b36：采集全流程（11 次搜索 + 过滤 + 标注 + 入库），0 bytes
2. Agent a2533cad95f3a92d0：数据处理全流程（10 文件过滤 + 标注 + 评分 + JSON + 飞书 + 日志），0 bytes

## 根因

单次 subagent 调用负载过大：
- Prompt 长度：~2500 tokens（含项目 context + 8 步 procedure + 完整 JSON schema + 命令示例 + 约束清单）
- 任务复杂度：6-7 个独立阶段合并为一个 agent
- 数据处理量：10 个文件 × 10 条 = 100 条记录，每条需 5 维度标注 + 3 维度评分
- worker-code agent 在启动阶段就上下文溢出 / 静默崩溃

**核心矛盾**：content-ops module 00 设计的 7 步 Procedure 是给人/Claude 直接执行的——不是给 subagent 单次调用的。

## 修复

### 短期（2026-06-15 已采用）
- 搜索阶段：host 直接并行运行 4+4+3 次 opencli 命令
- 数据处理：host 直接脚本过滤 + 分步处理
- 放弃"一个 agent 全搞定"的模式

### 长期（需写入 module 00 和 SKILL.md）
1. module 00 新增 "Execution Architecture" 章节，明确分阶段执行：
   - Phase A: 搜索（host 并行 opencli，每个搜索 ≤60s timeout）
   - Phase B: 过滤（脚本化——时间/去重/同账号上限/不相关）
   - Phase C: 标注（可分多条批量 agent，每条 agent ≤30 条记录）
   - Phase D: 入库（host 直接 lark-cli +record-batch-create）
   - Phase E: 日志（脚本化输出 JSONL）

2. SKILL.md 总控入口增加约束：
   > 采集任务禁止单 agent 全流程。搜索和入库由 host 直接执行，标注可用 agent 但每批 ≤30 条。

3. 每个 Phase 间必须落盘中间文件（YAML → filtered YAML → JSON → Feishu），故障时可从断点恢复。

## 检测方法

- 启动 subagent 后 2 分钟内检查 output 文件大小：`wc -c <output_file>`，0 bytes = 已死亡，立即降级到 host 直接执行。
- 对于采集类任务，**优先 host 直接执行**，agent 只用于需要判断/标注的子任务。

## 关联

- [[architecture-map]] — module 00 的 Procedure 设计过于"单线程"，需要拆分
- [[toolchain-three-layer-architecture]] — Layer0 工具（OpenCLI/lark-cli）应由 host 直接调用，agent 只做判断层工作

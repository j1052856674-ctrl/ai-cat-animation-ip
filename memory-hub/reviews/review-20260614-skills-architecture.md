---
id: mem-20260614-skills-architecture-review
name: review-20260614-skills-architecture
title: Skills architecture deep review
type: review
scope: project
status: active
source: claude
agents: [claude, worker-think]
created: 2026-06-14
updated: 2026-06-14
bridge: true
supersedes: []
conflicts_with: []
completeness: partial
confidence: medium
needs_review: true
token_policy: selective-read
---

# Deep Review — `skills/` 架构与包装方式

## 评审元数据

| 项 | 值 |
|---|---|
| 评审对象 | `E:/side-projects/ai-cat-animation-ip/skills` |
| 评审问题 | 是否包装成一个大 Skill；`skills/orchestrator.md` 是否应作为独立 Skill；是否需要完整重构 |
| 评审日期 | 2026-06-14 |
| 调用链 | `review-need` → `review-skill` → `review-tech` |
| 隔离方式 | 三视角只读子代理：使用者 / 维护者 / 编排者 |
| 重要限制 | 未修改 `skills/` 目标文件；仅写入本评审资产 |
| 未完成验证 | Claude Code Skill 运行时发现机制核验子代理失败：`429 usage limit`；因此 `orchestrator.md` 是否被运行时识别仍需后续实测或查官方文档 |

## Step 0: 隔离必要性评分

| 信号 | 分值 | 权重后 | 理由 |
|---|---:|---:|---|
| 决策不可逆性 | 3 | 9 | 架构可改，但一旦按错误目录形态推进，会影响后续 Skill 生态与迁移成本 |
| 领域交叉度 | 5 | 10 | 内容运营、Skill 设计、Claude/Codex 编排、飞书/数据管线、平台合规交叉 |
| 确认偏误风险 | 3 | 6 | 用户已提出“是否大 Skill / 完整重构”方向，需要防止迎合 |
| 方案空间广度 | 3 | 3 | 至少存在单大 Skill、多 Skill 套件、入口编排器+原子 Skill 三种方案 |
| 时间敏感度 | 5 | 5 | 不赶时间，应优先保证架构判断正确 |
| **总分** |  | **33** | ≥31，理论应全隔离；本轮采用三视角只读子代理，运行时核验因 429 未完成 |

---

## Phase 1: 需求澄清与价值剖析

### 价值三轴: 12/25

| 轴 | 评分 | 理由 |
|---|---:|---|
| 用户价值 | 5/5 | 决定后续内容运营 Skill 是可维护工作流套件，还是一个难维护的巨型提示词。 |
| 可行性 | 3/5 | 当前已有 6 个原子 Skill + 1 个编排器，具备小步修补基础；但若要接入真实 Skill 运行时，需要目录/入口规范确认。 |
| 风险 | 4/5 | 当前只评审方案，不改目标文件；主要风险是后续选错架构导致返工。 |
| **总评分** | **12/25** | min(5,3) × 4 = 12，有推进价值，但必须补成功标准与边界。 |

### 需求矛盾

用户问题倾向“包装成一个大的 Skill”，但 `skills/orchestrator.md` 当前已经声明：

- 编排器不实现能力；
- 每个 Skill 是独立能力单元；
- 编排器是唯一入口。

矛盾不在“要不要一个入口”，而在“入口是否等于把所有能力合并”。推荐调和方式：**对外一个入口，内部多个原子 Skill**。

### 反驳角度

不推荐完整合并成一个巨型单文件 Skill。合并会带来：

1. 上下文膨胀：只做封面也会加载采集、策略、复盘等无关内容。
2. 维护耦合：一个环节修改影响全链路。
3. 验收困难：无法独立验证 `02→03`、`03→04` 等交接物。
4. 中断恢复困难：单大 Skill 更难记录阶段状态与恢复点。

---

## Phase 2: Skill 设计评审

### 门禁检查

| 门禁 | 状态 | 说明 |
|---|:--:|---|
| A. 声明 | 🟡 PARTIAL | 所有 `SKILL.md` 基本有 `provides` 与 `depends_on`；但 `depends_on` 混用 `skill/file/tool`，且 `phases: [all]` 引用悬空，子 Skill 未定义 phase。 |
| B. 文件 | ✅ PASS | 编排者视角扫描认为 `content/` 下被引用的核心文件存在；但这些文件是否有统一 schema 未验证。 |
| C. 目录 | 🟡 PARTIAL | 6 个子 Skill 为 `skills/<编号-中文名>/SKILL.md`，结构统一；但根级 `orchestrator.md` 不是同形态，是否被运行时识别未验证。 |

### 多视角评分

| 维度(权重) | 使用者 | 维护者 | 编排者 | 综合 |
|---|:--:|:--:|:--:|:--:|
| 声明完整性(25%) | 3/5 | 4/5 | 2/5 | 3.0 |
| Prompt质量(25%) | 3/5 | 4/5 | 2/5 | 3.0 |
| 编排与隔离(20%) | 4/5 | 4/5 | 1/5 | 3.0 |
| 知识资产(15%) | 2/5 | 3/5 | 3/5 | 2.7 |
| 扩展性(10%) | 4/5 | 3/5 | 2/5 | 3.0 |
| 目录结构(5%) | 4/5 | 4/5 | 3/5 | 3.7 |
| 学习成本(5%) | 2/5 | 3/5 | 3/5 | 2.7 |
| **综合加权总分** |  |  |  | **3.1 / 5.0** |

置信度：🟡 中等。三个视角都反对“巨型单 Skill”，都支持“保留原子 Skill + 补契约层”；但对 `orchestrator.md` 的最终运行时形态，因官方/实测核验失败，仍需复核。

### 各视角核心判断

| 视角 | 一句话判断 | 主要风险 |
|---|---|---|
| 使用者 | 骨架合理，但首次使用体验差，零模板、零自引导、工具链过重。 | `content/` 文件和工具未初始化时，用户直接触发会卡死。 |
| 维护者 | 设计思路成熟，链路完整，但知识资产格式漂移和数据字段缺口会让运行时缺数据。 | `05-发布复盘` 依赖曝光、完播、前 3 秒留存，但上游字段声明未闭合。 |
| 编排者 | 业务逻辑不用重构，但契约层/信号层不满足自动化编排。 | 无 JSON schema、无 `.result.json`、无可预测输出路径、路由歧义会导致 headless 挂起。 |

---

## 核心问题回答

### 1. `skills/` 是否应包装成一个大的 Skill？

**推荐：包装成“对外单入口的大 Skill 套件”，不要合并成巨型单文件 Skill。**

建议形态：

```text
内容运营总入口 Skill
  ├─ 00-竞品数据采集
  ├─ 01-账号策略维护
  ├─ 02-选题推荐
  ├─ 03-脚本创作
  ├─ 04-封面包装
  └─ 05-发布复盘
```

用户体验上是一个大能力；维护实现上仍是多个原子能力。

### 2. `skills/orchestrator.md` 是否也是 Skill？

**设计语义上是入口编排器；运行时是否被识别为 Skill 未验证。**

当前风险：

- 它位于 `skills/orchestrator.md`，不是其他子 Skill 的 `skills/<name>/SKILL.md` 形态。
- 它声明“唯一入口”，但若运行时允许用户直接触发 `03-脚本创作` 等子 Skill，则 orchestrator 的前置检查会被绕过。
- 运行时规则核验子代理失败，错误为 `429 usage limit`，因此不能声称已确认 Claude Code 会或不会识别该文件。

推荐方向：

- 若后续实测证明根级 markdown 不会被识别：迁移为标准入口，例如 `skills/content-ops/SKILL.md`。
- 若运行时支持根级入口：也应补 `skills/README.md` 或 `skills/VC.md`，明确它是套件入口而不是能力实现方。
- 无论哪种，子 Skill 都必须具备“被直接触发时的上游缺失自引导”，不能完全依赖 orchestrator 拦截。

### 3. 是否需要完整重构？

**不需要完整重构业务方法论；需要重构/补齐契约层。**

| 层级 | 结论 | 说明 |
|---|---|---|
| 内容运营方法论 | 保留 | 采集→策略→选题→脚本→封面→复盘链路合理。 |
| 原子 Skill 边界 | 保留 | 00-05 职责边界清楚。 |
| 入口形态 | 调整 | `orchestrator.md` 需要运行时规范化，或降级为流程说明/README。 |
| 契约层 | 必须补齐 | 缺 schema、完成信号、状态文件、输出路径。 |
| 新手启动 | 必须新增或补齐 | 当前首次使用没有最小可行路径。 |

---

## 严重问题（🔴）

### 🔴-1: 自动化契约缺失，无法可靠编排

**证据**：编排者视角确认 `02-选题推荐`、`03-脚本创作`、`04-封面包装` 输出均为自然语言描述，没有 `.result.json`、固定输出路径或 JSON schema。

**影响**：Claude/Codex 无法可靠判断阶段是否完成，也无法把上游输出机器解析为下游输入。

**建议**：新增统一完成信号和核心 schema：

- `skill-result.schema.json`
- `topic-card.schema.json`
- `script-outline.schema.json`
- `cover-package.schema.json`

### 🔴-2: `orchestrator.md` 的“唯一入口”声明可能不成立

**证据**：使用者视角指出子 Skill 自身也声明触发词，如“写脚本”；如果用户直接触发 `03-脚本创作`，会绕过 orchestrator 的前置检查。

**影响**：用户以为被编排器保护，实际可能直接进入缺前置条件的子 Skill。

**建议**：

1. 后续实测 Claude Code Skill 发现/路由规则；
2. 将 orchestrator 标准化为真正入口或降级为流程文档；
3. 每个子 Skill 增加上游缺失自引导。

### 🔴-3: 首次使用无最小启动路径

**证据**：使用者视角指出多个 Skill 假设 `content/*.md`、OpenCLI、lark-cli、Codex 数据目录已就绪，但缺初始化模板和“作品数=0 时第一条内容怎么产出”。

**影响**：新用户第一次触发即可能失败，无法快速验证系统价值。

**建议**：新增 `06-新手启动` 或将启动流程纳入总入口 Skill，负责模板初始化、工具检查、第一条内容路径。

---

## 中等问题（🟡）

### 🟡-1: 数据字段链路不闭合

**证据**：`05-发布复盘` 需要曝光量、播放量、点击率、完播率、前 3 秒留存等诊断指标；`00-竞品数据采集` 字段主要覆盖点赞、收藏、评论、转发、评论样本、内容属性、风险点。

**影响**：复盘归因可能没有数据来源，只能主观判断。

**建议**：建立数据字段矩阵，区分：竞品采集字段、已发布作品字段、Codex 管线字段、新人期不可用字段。

### 🟡-2: 共享知识资产缺少 schema 和版本

**证据**：`content/账号策略.md`、`content/粉丝画像.md`、`content/爆款拆解经验.md`、`content/历史作品数据库.md` 被多个 Skill 读取，但未统一定义 frontmatter、表格头或版本字段。

**影响**：文件格式漂移会造成多 Skill 解析假设不一致。

**建议**：新增 `content/README.md` 或 `skills/schemas/content-files.md`，定义每个内容文件的最小结构。

### 🟡-3: `depends_on.phases` 粗粒度且悬空

**证据**：orchestrator 对子 Skill 使用 `phases: [all]`，但子 Skill 未定义 phase。

**影响**：无法细粒度调用“采集/入库/分析”等子阶段。

**建议**：要么删除悬空 phase；要么定义统一 phase 契约。

### 🟡-4: 平台差异散落

**证据**：小红书/抖音/B站差异分布在采集、脚本、封面、复盘等多个文件。

**影响**：新增视频号/快手等平台时，需跨多文件修改，容易漏改。

**建议**：新增轻量平台矩阵，如 `content/platform-matrix.md` 或 `skills/platform-contract.md`。

---

## 建议改进（🟢）

1. 增加根级 `skills/README.md`：说明这是内容运营 Skill 套件，列入口、子 Skill、执行顺序和新手路径。
2. 增加每个子 Skill 的“输入缺失处理”章节。
3. 给人类决策点定义 headless 降级策略，避免 subagent 等待用户。
4. 后续如需跨平台 CI 或 URL 交互，可考虑将中文目录增加 ASCII alias；短期不必作为 P0。

---

## 推荐改造路径

### P0 — 不改业务内容，先补契约

| # | 行动项 | 目标文件/目录 | 验证方式 |
|---|---|---|---|
| 1 | 新增体系级 VC/验收矩阵 | `skills/VC.md` | 覆盖路由、数据前置、上下游交接、新人期门禁、异常路径 |
| 2 | 定义统一完成信号 | `skills/schemas/skill-result.schema.json` 或 `skills/VC.md` | Grep 能找到 `skill_run_id/status/outputs/next_step/blocking_reason` |
| 3 | 定义核心交接物 schema | `skills/schemas/` | 至少覆盖选题卡、脚本大纲、封面方案 |
| 4 | 明确输出路径规范 | `outputs/skill-runs/...` 或报告末尾 JSON block | 下游可预测读取上游产物 |

### P1 — 解决首次使用与直接触发

| # | 行动项 | 目标文件/目录 | 验证方式 |
|---|---|---|---|
| 5 | 新增新手启动入口或总入口启动章节 | `skills/06-新手启动/SKILL.md` 或 `skills/content-ops/SKILL.md` | 空项目能生成最小 content 模板与第一条内容路径 |
| 6 | 子 Skill 增加上游缺失自引导 | `03/04/05` 等 | 直接触发时不会卡死，能提示或降级到上游 |
| 7 | 修正数据字段链路 | `00/05`、数据字段矩阵 | 复盘所需字段都有来源或标记不可用 |

### P2 — 结构优化

| # | 行动项 | 目标文件/目录 | 验证方式 |
|---|---|---|---|
| 8 | 平台矩阵集中化 | `content/platform-matrix.md` 或 `skills/platform-contract.md` | 新增平台优先改矩阵，不散落修改 |
| 9 | 运行时入口标准化 | 待 Skill 发现机制复核后决定 | `/skills` 或等价机制能看到入口 Skill |

---

## 最终结论

**🟡 有条件接受：保留多 Skill 架构，包装成对外单入口的内容运营 Skill 套件；不要合并成巨型 Skill；不要重写业务方法论；必须补齐契约层、完成信号、新手启动和直接触发自引导。**

当前最稳妥方案：

1. **短期**：新增 `skills/VC.md` + result schema + 交接物 schema，不动 00-05 业务内容。
2. **中期**：新增新手启动入口，补 content 模板和工具检查。
3. **运行时复核后**：决定将 `orchestrator.md` 迁移为 `skills/content-ops/SKILL.md`，还是保留为 README/流程总览。

## 未完成验证与后续复核

Claude Code Skill 运行时发现机制未完成验证，原因是子代理返回：`API Error: Request rejected (429) · You've reached your usage limit for this period.`

因此以下结论必须在后续执行前复核：

- `skills/orchestrator.md` 是否会被 Claude Code 识别为 Skill；
- 项目内 Skill 是否必须使用 `skills/<name>/SKILL.md`；
- 多 Skill 套件是否支持总入口 + 子 Skill 的推荐目录形态。

建议后续通过官方文档、`/skills` 列表或最小测试 Skill 实测确认。

---
id: mem-20260614-review-skills
title: Deep review of project skills system
type: review
scope: project
status: active
source: claude
agents: [claude]
created: 2026-06-14
updated: 2026-06-14
bridge: true
supersedes: []
conflicts_with: []
completeness: complete
confidence: medium
needs_review: true
token_policy: selective-read
---

# Deep Review — `skills/` 项目 Skill 体系

## 评审元数据

| 项 | 值 |
|---|---|
| 评审对象 | `E:/side-projects/ai-cat-animation-ip/skills` |
| 评审场景 | Skill/Agent 设计评审 + CLI/工具落地验证 |
| 评审阶段 | review-need → review-skill → review-tech |
| 评审日期 | 2026-06-14 |
| 隔离级别 | lightweight；子 Agent worktree 隔离因当前目录非 Git 仓库且无 Worktree hooks 不可用，已降级为主对话只读评审 |
| 验证方式 | 文件读取、frontmatter/路径检查、Grep、CLI help/auth/status 实测、项目 memory-hub 对照 |

## Step 0: 隔离必要性评分

| 信号 | 分值 | 权重后 | 理由 |
|---|---:|---:|---|
| 决策不可逆性 | 3 | 9 | Skill 体系可改，但会影响后续内容运营流程与 Codex/Claude 协作 |
| 领域交叉度 | 5 | 10 | 内容运营、平台采集、飞书入库、Skill 编排、合规边界 3+ 领域交叉 |
| 确认偏误风险 | 1 | 2 | 当前评审未看到用户强倾向，主要是质量检查 |
| 方案空间广度 | 3 | 3 | 可在文档型 Skill、自动化 Skill、外部管线之间调整 |
| 时间敏感度 | 5 | 5 | 不赶时间，应优先保证正确性 |
| **总分** |  | **29** | 16-30 → 轻量隔离 |

> 降级说明：按要求尝试启动 3 个视角子 Agent，但 Agent worktree 创建失败：当前目录不是 Git 仓库且未配置 WorktreeCreate hooks。未继续重复同类尝试，改为主对话只读完成评审，并将“隔离不足”计入置信度限制。

---

## Phase 1: 需求澄清与价值剖析

### 价值三轴: 12/25

| 轴 | 评分 | 理由 |
|---|---:|---|
| 用户价值 | 5/5 | `skills/orchestrator.md:25` 明确把内容运营全链路串联起来，直接解决“选题→脚本→封面→复盘→策略更新”断点问题。 |
| 可行性 | 3/5 | 主要是文档型 Skill，易落地；但核心闭环依赖 OpenCLI、飞书权限、Codex 数据管线等外部前提。 |
| 风险 | 4/5 | 安全边界写得较清楚，如 Chrome 兜底不批量抓取、不读 cookie/token；但平台数据可信度与飞书权限仍是执行风险。 |
| **总评分** | **12/25** | min(5,3) × 4 = 12，达到可推进但需补齐验收标准。 |

### 完整性检查

| 项 | 状态 | 证据/问题 |
|---|:--:|---|
| 核心目标 | ✅ | 编排器目标清楚：`skills/orchestrator.md:27`。 |
| 用户场景 | ✅ | 各 Skill 均有触发场景/什么时候使用。 |
| 成功标准 | 🔴 | 多数 Skill 描述“输出什么”，但缺少端到端 Done 标准：例如“采集→入库→选题消费”如何判定全链路成功未成矩阵。 |
| 约束条件 | 🟡 | 采集 Skill 安全边界清楚；新人期、数据前置、权限状态散落在多个文件。 |
| 边界清单 | 🟡 | 单个 Skill 有职责边界，如 `skills/04-封面包装/SKILL.md:77`；但体系级边界缺统一验收入口。 |
| 关键假设 | 🟡 | 有“作品数 >=10”“Codex 管线跑通”“近期竞品数据足够”等假设，但缺统一验证状态表。 |

### 假设风险矩阵

| 假设 | 风险等级 | 验证方式 | 状态 |
|---|:--:|---|:--:|
| OpenCLI 可稳定采集小红书/抖音样本 | 高 | 运行 `opencli xiaohongshu --help` / `opencli douyin --help` 已确认命令存在，但模块加载有大量 warning；需实采样本验证。 | 部分验证 |
| 飞书 `lark-cli` 可写入 Base/Sheets | 高 | `lark-cli --version` 与 help 可用；`auth status` 显示 bot ready/user missing；项目记忆显示写入仍卡 `app_scope_not_applied`。 | 待验证 |
| 新人期 <10 条不启用复盘/策略维护 | 中 | 编排器和复盘/策略 Skill 都提及；需要统一状态源记录当前作品数。 | 待验证 |
| 下游 Skill 能消费上游自然语言输出 | 中 | 文档写明上游/下游关系，但没有结构化输出 schema 或 `.result.json`。 | 未验证 |

### 反驳角度

当前 Skill 体系把“内容运营经验”写进了 Skill 文档，但还没有把“机器可验收契约”写进去。若目标只是人类辅助创作，这已经可用；若目标是 Claude/Codex 自动化闭环，则现在最弱的不是文案质量，而是：缺少结构化输入/输出、完成信号、验收矩阵。

### VC 骨架

建议为 `skills/` 增加体系级验收矩阵：

| F# | 功能 | Done 标准 |
|---|---|---|
| F1 | 路由 | 用户输入 8 类触发词时，编排器能路由到唯一 Skill；歧义时输出可选项不自作主张。 |
| F2 | 数据前置 | 无近期竞品样本时，选题推荐必须标“待验证假设”或路由采集。 |
| F3 | 采集入库 | OpenCLI 样本被映射到统一字段，并成功写入 Base/Sheets 或明确说明权限阻塞。 |
| F4 | 上下游交接 | 每个 Skill 输出包含下游所需字段，缺字段时可检测失败。 |
| F5 | 新人期门禁 | 作品数 <10 且数据管线未跑通时，不启用深度复盘/策略维护。 |

---

## Phase 2: Skill 设计评审

### 门禁检查

| 门禁 | 状态 | 未通过项 / 备注 |
|---|:--:|---|
| A. 声明 | 🟡 PARTIAL | 所有 Skill 文件都有 `provides` 和 `depends_on`；但 `review-skill` A3 要求每个 depends_on 条目包含 `skill` 字段，而项目 Skill 合理使用了 `file`/`tool` 依赖（如 `skills/00-竞品数据采集/SKILL.md:5`）。需明确项目型 Skill 允许 `file/tool/skill` 三类依赖，避免被通用门禁误判。 |
| B. 文件 | ✅ PASS | `content/账号策略.md`、`content/粉丝画像.md`、`content/爆款拆解经验.md`、`content/历史作品数据库.md`、`content/竞品调研数据库.md` 均存在。未发现 JSON 配置文件。 |
| C. 目录 | ✅ PASS | `skills/` 目录扁平：6 个子目录 + 1 个编排器文件；无 v1/v2 并存，无深层嵌套。 |

### 多视角评分（降级合成）

> 由于子 Agent 隔离不可用，以下为主对话基于三个视角的降级评分；置信度为 🟡 中等。

| 维度(权重) | 使用者 | 维护者 | 编排者 | 综合 |
|---|:--:|:--:|:--:|:--:|
| 声明完整性(25%) | 4/5 | 3/5 | 3/5 | 3.3 |
| Prompt质量(25%) | 4/5 | 3/5 | 3/5 | 3.3 |
| 编排与隔离(20%) | 3/5 | 2/5 | 2/5 | 2.3 |
| 知识资产(15%) | 4/5 | 3/5 | 3/5 | 3.3 |
| 扩展性(10%) | 3/5 | 3/5 | 3/5 | 3.0 |
| 目录结构(5%) | 4/5 | 4/5 | 4/5 | 4.0 |
| 学习成本(5%) | 4/5 | 3/5 | 3/5 | 3.3 |
| **加权总分** | **3.75** | **2.95** | **2.95** | **3.22 / 5.0** |

置信度：🟡。结论：可用但需补齐自动化契约。

### 各视角核心判断

| 视角 | 一句话判断 | 共识/分歧 |
|---|---|---|
| 使用者 | 作为人类辅助创作入口可用，触发词和每步产物清晰。 | 认为可直接使用，但需要知道“当前到了哪一步”。 |
| 维护者 | 内容策略规则较完整，但“新人期/数据前置/权限状态”散落，6 个月后维护成本会上升。 | 关注规则集中化和验收矩阵。 |
| 编排者 | 编排器声明了上下游，但没有结构化输出 schema 和完成信号，自动化流水线难以可靠消费。 | 认为最需修的是机器可读契约。 |

### 扩展性分析

以新增“B站长视频”平台为例，最少需改：

| 文件 | 修改点 |
|---|---|
| `skills/orchestrator.md` | 触发词、标准循环、平台策略说明需加入 B站入口。 |
| `skills/02-选题推荐/SKILL.md` | 选题卡平台字段和内容类型扩展。 |
| `skills/03-脚本创作/SKILL.md` | 已有 B站时长提示，但需明确 B站输出版本是否必选。 |
| `skills/04-封面包装/SKILL.md` | 已有 B站标题/简介可选，但需明确触发条件。 |
| `skills/05-发布复盘/SKILL.md` | 数据源、指标和历史对比字段需扩展 B站。 |
| `content/*` | 策略、历史数据库、爆款拆解需新增 B站字段或样例。 |

最少 5 个 Skill 文件 + 3-4 个 content 文件，跨 2 个目录。当前无声明式平台注册表，平台扩展靠多文件同步，属于中等维护风险。

### 目录结构问题

| 问题 | 严重度 | 建议 |
|---|:--:|---|
| 编排器文件名为 `orchestrator.md` 而非子目录 `SKILL.md`，虽然有 frontmatter，但不符合其他 Skill 文件形态。 | 🟡 | 若要被统一 Skill 扫描器识别，建议迁移为 `skills/orchestrator/SKILL.md` 或在文档中声明这是特殊入口。 |
| 缺少体系级 README/验收矩阵。 | 🟡 | 增加 `skills/README.md` 或 `skills/VC.md`，集中定义入口、状态源、完成信号、端到端验收。 |
| 没有结构化结果目录。 | 🟡 | 定义每次调用输出到 `outputs/`、`memory-hub/status/` 或 `.result.json` 的最小字段。 |

---

## Phase 3: 技术落地验证

### 验证覆盖统计

| 维度 | 检查项 | 已验证 | 不一致 | 待验证 |
|---|---|:--:|:--:|:--:|
| CLI 集成 | `lark-cli --version` | ✅ | 0 | 0 |
| CLI 集成 | `lark-cli auth status` | ✅ | 0 | 1：用户身份 missing 是否影响目标写入场景需按 API 决定 |
| CLI 集成 | `lark-cli base/sheets` help 中命令存在性 | ✅ | 1 | 0 |
| CLI 集成 | OpenCLI 小红书/抖音命令存在性 | ✅ | 1 | 1：未执行真实采集 |
| 工具能力 | Skill 声明 vs 项目记忆 | ✅ | 0 | 1：飞书权限实际写入仍待通过 |
| 安全边界 | Chrome 兜底/敏感信息边界 | ✅ | 0 | 0 |

### 关键不一致 / 风险

| 声称 | 实测/对照 | 影响 |
|---|---|---|
| `skills/00-竞品数据采集/SKILL.md:73` 建议 `lark-cli base +table-list --help`、`:75` 建议 `+record-upsert`、`:76` 建议 `+record-batch-create`。 | 实测这些命令均存在。`+record-upsert` help 明确“不按业务键自动 upsert”，与文档 `skills/00-竞品数据采集/SKILL.md:79` 一致。 | Base 路径命令声明正确。 |
| `skills/00-竞品数据采集/SKILL.md:85` 写 `lark-cli sheets +workbook-create --help`，`:86` 写 `lark-cli sheets +cells-set --help`，`:87` 写 `lark-cli sheets +csv-put --help`。 | 实测三者均存在；但 `sheets --help` 显示旧命令 `+create/+write` 已 deprecated，文档使用新命令是正确的。 | Sheets 兜底路径命令声明正确。 |
| 项目记忆 `memory-hub/status/current-execution-status.md:27` 记录 `lark-cli version 1.0.53`。 | `lark-cli version` 实测失败，`lark-cli --version` 实测输出 `lark-cli version 1.0.53`。 | 文档/记忆中若写命令，应统一为 `lark-cli --version`；否则后续验证脚本会失败。 |
| `skills/00-竞品数据采集/SKILL.md:43-45` 使用小红书 URL/完整链接作为 note/comments 参数。 | `opencli xiaohongshu --help` 显示 `note <note-id>`、`comments <note-id>`，而不是 URL；不确定 OpenCLI 是否也兼容 URL，因为未执行详情采集。 | 可能导致执行者拿 URL 直接跑失败。建议改为“从完整 URL 提取/确认 note-id，或实测 URL 兼容后再写 URL”。 |
| `skills/00-竞品数据采集/SKILL.md:51` 使用 `opencli douyin search`。 | `opencli douyin --help` 显示 `search <query>` 存在。 | 抖音搜索命令存在，但未实采，不评价字段真实性。 |
| OpenCLI help。 | help 输出前有大量模块加载 warning，且包含 `xiaohongshu/*`、`douyin/*` 模块 “must declare access” warning；但命令清单仍显示目标命令。 | 不是当前 Skill 的直接错误，但说明 OpenCLI 环境有噪音/兼容风险。端到端执行前应先用低 limit 实采确认。 |
| 飞书入库状态。 | `lark-cli auth status`：bot ready，user missing；项目记忆 `memory-hub/status/current-execution-status.md:31-36` 记录 scopes 未应用，Base/Sheets 写入尚未成功。 | Skill 文档不能声称已完成入库；当前只能说“CLI 可用，写入受权限阻塞”。文档 `skills/00-竞品数据采集/SKILL.md:66` 已正确要求授权前不能声称写入。 |

### CLI 验证记录

| 命令 | 结果 |
|---|---|
| `lark-cli auth status` | 成功：bot identity ready；user identity missing。 |
| `lark-cli --version` | 成功：`lark-cli version 1.0.53`。 |
| `lark-cli version` | 失败：unknown command。需避免在验证脚本中使用。 |
| `lark-cli base --help` | 成功：包含 `+table-list`、`+record-upsert`、`+record-batch-create` 等。 |
| `lark-cli sheets --help` | 成功：包含 `+workbook-create`、`+cells-set`、`+csv-put`；旧 `+create/+write` 已标 deprecated。 |
| `opencli xiaohongshu --help` | 成功返回命令清单，但带大量模块加载 warning；目标命令 `search/note/comments` 存在。 |
| `opencli douyin --help` | 成功返回命令清单，但带大量模块加载 warning；目标命令 `search` 存在。 |

### 工具能力验证

| 工具/依赖 | 声明位置 | 实测/对照 | 结论 |
|---|---|---|---|
| OpenCLI | `skills/00-竞品数据采集/SKILL.md:5` | help 可运行，目标平台命令存在；未执行真实采集。 | 部分通过 |
| official `lark-cli` | `skills/00-竞品数据采集/SKILL.md:7` | `--version` 为 1.0.53；Base/Sheets help 与文档大体一致。 | 通过 |
| Chrome 兜底 | `skills/00-竞品数据采集/SKILL.md:10`、`:147-152` | 文档明确只做登录态/视觉核验/单条补采，不读 cookie/token，不批量抓取。 | 边界通过 |
| 飞书写入 | `skills/00-竞品数据采集/SKILL.md:56-90` | 项目记忆显示写入仍受权限阻塞；auth status 显示 bot ready/user missing。 | 待验证 |

---

## 严重问题（🔴）

### 🔴-1: 缺少端到端成功标准与验证矩阵

**证据**：各 Skill 均描述“输出什么”，例如 `skills/02-选题推荐/SKILL.md:33`、`skills/03-脚本创作/SKILL.md:35`、`skills/04-封面包装/SKILL.md:35`、`skills/05-发布复盘/SKILL.md:34`，但没有体系级 VC 定义“什么算全链路跑通”。

**影响**：后续执行时容易出现“每个单点都看似完成，但选题无法消费采集数据 / 复盘无法反哺策略 / 飞书未写入却继续推荐”的链路断裂。

**修正建议**：新增 `skills/VC.md` 或 `skills/README.md`，包含功能清单、输入输出 schema、端到端用例、异常用例、非功能约束。

### 🔴-2: 自动化编排缺少可检测完成信号

**证据**：`skills/orchestrator.md:120` 只说“在上下文中记录当前进度”，Grep 未发现 `.result.json`、固定输出路径或机器可读完成信号。

**影响**：Claude/Codex 或其他编排器只能依赖自然语言判断阶段是否完成，无法可靠 resume、重试、验证下游字段。

**修正建议**：为每个 Skill 规定最小结果对象，例如 `skill_run_id`、`status`、`inputs`、`outputs`、`next_step`、`blocking_reason`，写入固定位置或报告末尾 JSON block。

---

## 中等问题（🟡）

### 🟡-1: `depends_on` 结构与通用 review-skill 门禁不完全兼容

**证据**：项目 Skill 使用 `file`/`tool` 依赖，如 `skills/00-竞品数据采集/SKILL.md:5-14`、`skills/02-选题推荐/SKILL.md:5-12`；review-skill A3 默认每个 depends_on 都有 `skill` 字段。

**影响**：项目型 Skill 会被通用门禁误判为 FAIL，或上层编排器无法区分 Skill、文件、工具依赖。

**修正建议**：项目 Skill frontmatter 规范明确允许 `depends_on` 条目类型为 `skill|file|tool`，并要求每类都有 `purpose`；对 `skill` 依赖才强制 `output/phases`。

### 🟡-2: OpenCLI 小红书详情命令参数可能与 help 不一致

**证据**：文档示例 `opencli xiaohongshu note "<完整小红书URL含xsec_token>"`（`skills/00-竞品数据采集/SKILL.md:44`），但 help 显示 `note <note-id>`、`comments <note-id>`。

**影响**：执行者可能按文档传 URL 失败；如果 URL 实际兼容，也需要实测证据。

**修正建议**：低风险修正为“详情命令以 `note-id` 为准；如使用完整 URL，需先实测兼容或从 URL 提取 note-id/xsec_token”。

### 🟡-3: 平台扩展规则散落，新增 B站或新平台需多文件同步

**证据**：平台相关逻辑分布在编排器、选题、脚本、封面、复盘和 content 文档中；无平台注册表。

**影响**：6 个月内新增平台/内容行业时，容易漏改某个 Skill，产生口径不一致。

**修正建议**：建立轻量 `content/platform-matrix.md` 或 `skills/platform-contract.md`，集中列平台、字段、输出版本、复盘指标、启用状态。

### 🟡-4: 当前飞书写入仍处阻塞状态，应被编排器前置识别

**证据**：`memory-hub/status/current-execution-status.md:31-36` 记录 scopes 未应用、Base/Sheets 写入未成功；`lark-cli auth status` 显示 bot ready/user missing。

**影响**：如果用户触发“竞品调研并入库”，Skill 只能完成采集/本地整理，不能声称入库成功。

**修正建议**：编排器触发 `00-竞品数据采集` 前读取当前执行状态；若飞书权限未完成，默认输出本地结构化结果 + 明确阻塞项。

---

## 建议改进（🟢）

### 🟢-1: 统一“新人期状态源”

**说明**：新人期规则在 `skills/orchestrator.md:79-86`、`skills/01-账号策略维护/SKILL.md:60`、`skills/05-发布复盘/SKILL.md:94` 重复出现。

**建议**：用一个状态文件记录 `作品数`、`Codex 数据管线状态`、`是否启用复盘/策略维护`，各 Skill 引用该状态源，不重复判断。

### 🟢-2: 给每个 Skill 增加“最小输入缺失提示”

**说明**：多数 Skill 写了用户需要提供什么，但没有统一的“缺 X 时如何提示”。

**建议**：每个 Skill 增加 `输入缺失处理` 小节：缺策略文档、缺选题卡、缺脚本大纲、缺数据时分别怎么降级。

---

## 可执行行动项

| # | 优先级 | 行动项 | 涉及文件/目标 | 验证方式 | 状态 |
|---|:--:|---|---|---|:--:|
| 1 | P0 | 新增体系级 VC/验收矩阵，覆盖路由、数据前置、采集入库、上下游交接、新人期门禁 | `skills/VC.md` 或 `skills/README.md` | 文件存在，包含功能清单/输入输出映射/验证矩阵/非功能约束 | ⬜ |
| 2 | P0 | 定义每个 Skill 的机器可读完成信号 | `skills/*/SKILL.md`、`skills/orchestrator.md` | Grep 能找到统一字段如 `status`、`outputs`、`next_step` 或 `.result.json` 规范 | ⬜ |
| 3 | P1 | 修正或实测小红书 `note/comments` 参数说明 | `skills/00-竞品数据采集/SKILL.md` | help 与文档一致；若保留 URL 示例，附实测记录 | ⬜ |
| 4 | P1 | 明确项目 Skill 的 `depends_on` 类型规范 | `skills/README.md` 或项目规范 | 说明 `skill/file/tool` 三类依赖字段要求 | ⬜ |
| 5 | P1 | 建立平台/状态单一事实源 | `content/platform-matrix.md` 或 `memory-hub/status/current-execution-status.md` | 新增平台只需改矩阵 + 必要 Skill，不再散落判断 | ⬜ |
| 6 | P1 | 在编排器前置检查飞书权限阻塞状态 | `skills/orchestrator.md` | 当 current-execution-status 标记飞书写入未成功时，编排器不声称入库 | ⬜ |

---

## 评审结论

**🟡 有条件接受。**

这套 `skills/` 已经适合作为“人类创作者 + Claude 辅助”的内容运营手册入口：触发词、产物、上下游关系和安全边界基本清楚。  
但如果目标是“Claude/Codex 自动化闭环”，当前还缺两类关键资产：

1. 端到端 VC/验收矩阵；
2. 机器可读输入输出与完成信号。

建议先完成 P0 行动项 1-2，再把 `00-竞品数据采集 → 飞书入库 → 02-选题推荐` 作为第一条端到端用例重跑验证。

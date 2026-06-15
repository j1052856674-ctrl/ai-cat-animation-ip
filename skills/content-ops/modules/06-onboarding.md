---
name: 06-onboarding
description: 首次使用 content-ops 技能群的前置检查——环境、文件、工具链、最小可用路径
module_id: module-06
depends_on: []
reads:
  - dir: content/
    purpose: 检查核心 content 文件是否存在、frontmatter 是否完整
  - dir: tools/codex-automation/
    purpose: 检查 Codex 数据采集管线是否就绪
  - dir: skills/
    purpose: 检查各 Skill 的 SKILL.md 是否存在、depends_on 声明是否完整
---

# Module 06: Onboarding（首次使用检查）

> 新项目或新成员接入 content-ops 技能群时，运行一次性环境检查——确认文件就绪、工具链状态、给出不阻塞第一条内容的最小可用路径。

## Purpose

content-ops 技能群依赖多个 `content/` 数据文件、`tools/` 工具链和上游 Skill 输出。首次使用时，很容易因为某个文件不存在或某个工具未配置而卡住整个流程。本模块在首次触发时自检环境，明确"哪些已经 ready、哪些需要配置、哪些可以先跳过"，给出一条在最短时间内产出第一条内容的路径。

**触发条件**：
- 首次使用 content-ops 技能群（由编排器检测后自动触发）
- 用户说"开始"、"初始化"、"检查环境"、"准备好了吗"
- 距上次 onboarding 检查超过 7 天（由编排器决定是否重新运行）

## Inputs

| 输入 | 来源 | 必须 | 说明 |
|------|------|------|------|
| `trigger` | 编排器 / 用户 | 是 | 自检触发信号 |
| `scope` | 用户指定 | 否 | 检查范围：`full`（全量） / `minimal`（仅第一条内容所需的最小路径），默认 `minimal` |

## Reads

本模块按以下顺序扫描环境（不要求全部通过）：

### 6.1 Content 文件检查

| 文件 | 检查项 | 用途 |
|------|--------|------|
| `content/账号策略.md` | 文件存在 + frontmatter 完整（name/description/version/confidence） | 所有模块的策略基线 |
| `content/粉丝画像.md` | 文件存在 | 粉丝偏好输入 |
| `content/爆款拆解经验.md` | 文件存在 + 是否为空（至少要有 3 条记录的模板） | 爆款公式输入 |
| `content/历史作品数据库.md` | 文件存在 + 数据记录数 | 复盘数据源、选题去重 |
| `content/竞品调研数据库.md` | 文件存在 | IP 方向验证数据源 |

### 6.2 工具链检查

| 工具 | 检查方式 | 用途 |
|------|----------|------|
| `OpenCLI` | 检查 `opencli` 命令是否可用 | AI 视频生成（小云雀） |
| `lark-cli`（@larksuite/cli） | 检查是否安装 + 是否完成飞书授权 | 飞书多维表格结构化入库 |
| `Chrome / Playwright` | 检查 Playwright 是否安装 + 浏览器是否可用 | 后期发布自动化 |
| `Codex` | 检查 Codex CLI 是否可用 + 是否已配置 data/daily/ 管线 | 数据采集管线 |
| `Claude Code` | 检查 CC 是否可用（当前会话本身已证明可用） | Skill 运行环境 |

### 6.3 Skills 文件检查

| 检查项 | 说明 |
|--------|------|
| `skills/` 下各 Skill 的 `SKILL.md` 是否存在 | 对应 00-05 的 6 个 Skill |
| `depends_on` 声明是否完整 | 检查每个 SKILL.md 的 frontmatter 中 depends_on 是否有值 |
| `skills/content-ops/modules/` 下模块文件是否存在 | 对应 00-06 的 7 个模块 |

## Outputs

### 输出格式

```yaml
onboarding_report:
  checked_at: "YYYY-MM-DD HH:MM"
  scope: minimal | full

  content_files:
    - file: content/账号策略.md
      status: ready | missing | incomplete
      detail: ""                    # missing 时说明影响
    - file: content/粉丝画像.md
      status: ready | missing
      detail: ""
    - file: content/爆款拆解经验.md
      status: ready | missing | empty
      detail: ""
    - file: content/历史作品数据库.md
      status: ready | missing | empty
      detail: ""
    - file: content/竞品调研数据库.md
      status: ready | missing | empty
      detail: ""

  tools:
    - tool: opencli
      status: available | not_available
      detail: ""                    # not_available 时说明影响和替代方案
    - tool: lark-cli
      status: available | not_available | authorized | unauthorized
      detail: ""
    - tool: playwright
      status: available | not_available
      detail: ""
    - tool: codex
      status: available | not_available | pipeline_not_configured
      detail: ""
    - tool: claude_code
      status: available             # 当前会话已证

  skills:
    - skill: "00-竞品数据采集"
      status: ready | missing_skill_file
    - skill: "01-账号策略维护"
      status: ready | missing_skill_file
    - skill: "02-选题推荐"
      status: ready | missing_skill_file
    - skill: "03-脚本创作"
      status: ready | missing_skill_file
    - skill: "04-封面包装"
      status: ready | missing_skill_file
    - skill: "05-发布复盘"
      status: ready | missing_skill_file
    - module: "content-ops/modules/*"
      status: ready | partial | missing

  minimal_path_to_first_content:
    ready: true | false             # 能否产出第一条内容
    missing_blockers: []            # 阻塞项清单（必须解决才能产出第一条内容）
    missing_non_blockers: []        # 非阻塞项清单（可以先跳过）
    suggested_first_flow: ""        # 建议的第一步操作
```

## Procedure

```
Step 1: 扫描 content/ 目录 → 列出所有 .md 文件，逐个检查存在性
Step 2: 检查 frontmatter 完整性 → 对 content/账号策略.md 检查 name/description/version/confidence 字段
Step 3: 检查 content/爆款拆解经验.md 和 content/历史作品数据库.md 是否为空（空 vs 有数据）
Step 4: 扫描 tools/ 目录 → 检查 codex-automation/ 目录是否存在
Step 5: 逐个检查工具可用性：
    ├─ opencli: 运行 opencli --version
    ├─ lark-cli: 运行 npx @larksuite/cli --version
    ├─ playwright: 运行 npx playwright --version
    └─ codex: 检查 tools/codex-automation/data/daily/ 是否有数据文件
Step 6: 扫描 skills/ 目录 → 逐个检查 SKILL.md 存在 + depends_on 声明
Step 7: 扫描 skills/content-ops/modules/ → 检查模块文件完整性
Step 8: 判定 minimal_path_to_first_content：
    ├─ 计算阻塞项：content/账号策略.md 缺失 + 所有脚本/封面 Skill 缺失
    ├─ 计算非阻塞项：lark-cli 不可用、playwright 不可用、复盘相关文件缺失
    └─ 给出 suggested_first_flow
Step 9: 输出 onboarding_report
```

## Missing Input Handling

### 阻塞项（不解决无法产出第一条内容）

| 缺失项 | 影响 | 解决方案 |
|--------|------|----------|
| `content/账号策略.md` 不存在 | 所有模块没有策略基线——不知道 IP 人设、视觉风格、内容方向 | 必须创建。提供最小模板（IP名称 + 一句话定位 + 核心人设 3 要素 + 3 大内容支柱）。5 分钟可完成 |
| 所有内容 Skill 文件均缺失 | 无法执行任何内容生产链路 | 必须至少存在 `02-选题推荐` + `03-脚本创作` + `04-封面包装` 的 SKILL.md |
| 没有任何 content 文件 | content-ops 技能群无数据可读 | 至少创建 `content/账号策略.md`（最小模板） |

### 非阻塞项（可跳过，不影响第一条内容）

| 缺失项 | 影响 | 替代 / 跳过方案 |
|--------|------|----------------|
| `opencli` 不可用 | 无法通过 CLI 生成 AI 视频 | 改用手动在小云雀网页端生成 + 手动下载 |
| `lark-cli` 未授权 | 无法自动写入飞书多维表格 | 改用手动填入飞书表格；标注 `feishu: manual_entry` |
| `playwright` 不可用 | 无法自动化发布 | 前期手动发布（手机端），这是 P1-P2 的预期行为 |
| `codex` 管线未配置 | 无自动数据采集 | 数据复盘改手动输入模式；不影响内容生产 |
| `content/历史作品数据库.md` 为空 | 无法做趋势对比和去重 | 新项目正常状态——前 10 条不需要复盘 |
| `content/竞品调研数据库.md` 为空或不存在 | 无法做 IP 方向数据验证 | 不影响——先用假设版策略试发，采集数据后补调研 |
| `content/粉丝画像.md` 不存在 | 封面/标题/脚本的受众匹配度判断不准确 | 降级为默认画像（22-35 岁打工人），与 IP 人设一致 |
| `content/爆款拆解经验.md` 为空 | 封面公式、标题结构、钩子模式缺少数据支撑 | 降级为通用内容方法论；早期多测多观察 |

### 最小路径算法

```
minimal_path_to_first_content:
  阻塞项 = []
  for each_blocker:
    if item.status == missing AND item.required_for_first_content == true:
      阻塞项.append(item)
  
  ready = (阻塞项.length == 0)
  
  if ready:
    suggested_first_flow = "从 02-选题推荐 开始，走 选题→脚本→封面→发布 的标准流程"
  else:
    suggested_first_flow = "请先解决以下阻塞项：" + 阻塞项列表 + "。最快路径：创建 content/账号策略.md（最小模板 5 分钟）→ 跳过所有数据工具 → 直接用 02 选题推荐 → 03 脚本创作 → 04 封面包装 → 手动发布。复盘和策略维护等作品数 >= 10 后再启用。"
```

## Result Contract

```yaml
result:
  skill_run_id: "content-ops-module-06-{YYYYMMDD}-{NNN}"
  status: completed | degraded | blocked
  outputs:
    - onboarding_report     # 完整环境检查报告
  next_step: "根据 minimal_path 指引执行第一步" | "解决阻塞项后再运行 onboarding"
  blocking_reason: null     # 当有阻塞项且 ready=false 时填写
  warnings: []              # 非阻塞缺失项清单
```

**触发 downstream**：检查完成后，编排器根据 `minimal_path_to_first_content.ready` 决定是否启动标准流程。若 ready=true，自动提示"可以开始第一条内容了，要现在开始吗？"

## Safety / Boundaries

1. **不做自动修复**：本模块只做检查 + 报告，不自动创建缺失文件、不自动安装工具、不自动执行命令来修复环境。所有修复由用户确认后手动或由编排器触发相应模块。
2. **阻塞项 vs 非阻塞项边界清晰**：只有 `content/账号策略.md` 和核心 Skill 文件缺失才算阻塞项。工具链缺失（opencli/lark-cli/playwright/codex）一律归为非阻塞项——因为 P1-P2 就是手动为主的阶段，工具自动化是后续优化。
3. **不替代 Phase 0 前置探索**：本模块检查的是文件就绪状态，不替代 PLAN.md 中的 Phase 0 前置探索（角色一致性测试、合规试发、数据工具试用等）。前置探索是项目级决策，onboarding 是 Skill 级就绪检查。
4. **最大努力原则**：工具检查命令执行失败不阻塞报告生成——标记为 `not_available` 并说明影响即可。不要因为一个 `opencli --version` 命令执行失败而中断整个 onboarding 流程。
5. **不修改被检查的文件**：不允许在检查过程中修改任何 content/ 文件或 skills/ 文件。只读检查。
6. **首次使用 = 最小路径**：`scope` 默认为 `minimal`，聚焦于"能否产出第一条内容"，不展开高级特性（复盘、策略维护、自动化工具）。用户明确要求全量检查时才切到 `full` 模式。
7. **检查结果只给用户不给自动化**：onboarding 报告是一份给人看的状态文档。不要基于检查结果自动跳过模块或改变下游模块行为——那些决策由编排器和用户来做。

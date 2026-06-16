---
name: 选题推荐
description: 基于竞品样本和账号策略，产出 5-10 条选题卡供创作者选择
provides: [选题推荐, 趋势分析, 方向覆盖建议]
depends_on:
  - file: content/账号策略.md
    purpose: 内容支柱和定位
  - file: content/粉丝画像.md
    purpose: 目标受众画像参考
  - file: content/爆款拆解经验.md
    purpose: 已验证的爆款公式和标题结构
  - file: content/历史作品数据库.md
    purpose: 已发布作品记录，用于去重
  - skill: competitor-intel
    phases: [竞品数据采集]
    purpose: 获取竞品样本作为选题方向依据
---

# 选题推荐

## Purpose

内容创作者常有"不知道下一条拍什么"的困境。本 Skill 基于账号策略、粉丝画像、爆款拆解经验与历史数据，生成 5-10 条选题建议，让创作者的每条作品都有明确的选题依据而非凭直觉，提高爆款概率，避免选题同质化。

## Inputs

| 字段 | 必填 | 说明 |
|------|:--:|------|
| `trigger` | 是 | `"recommend_topics"` / `"new_cycle_start"` |
| `constraints.platform` | 否 | `小红书` / `抖音` / `B站` / `全平台`，默认全平台 |
| `constraints.content_type` | 否 | `口播` / `vlog` / `教程` / `剧情` / `混剪`，不指定则不过滤 |
| `constraints.tone` | 否 | `温暖` / `搞笑` / `深度` / `犀利`，不指定则按策略默认 |
| `constraints.duration` | 否 | `短` / `中` / `长`，影响选题方向而非脚本时长 |
| `competitor_data_available` | 否 | 由编排器传入：`true` / `false` / `partial`，影响输出置信度 |

## Reads

| 文件 | 用途 |
|------|------|
| `content/账号策略.md` | 账号定位 + 内容方向 + 差异化卖点 + 禁止项 |
| `content/粉丝画像.md` | 粉丝特征 + 兴趣标签 + 活跃时段 |
| `content/爆款拆解经验.md` | 已验证的爆款公式、标题结构、钩子模式、封面套路 |
| `content/历史作品数据库.md` | 已发作品记录，用于避免重复 + 判断哪些方向已跑通 |

## Outputs

输出 5-10 条**选题卡列表**，每条选题卡符合 `topic-card` schema：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | `topic-<YYYYMMDD>-<序号>`，唯一标识 |
| `title` | string | 候选标题，模仿爆款标题结构 |
| `platforms` | array | `["小红书"]` / `["抖音", "B站"]` / `["全平台"]`，适合平台列表 |
| `content_type` | string | `口播` / `vlog` / `教程` / `剧情` / `混剪` |
| `tone` | string | 情感调性：`温暖` / `搞笑` / `深度` / `犀利` |
| `rationale` | string | 基于策略/画像/爆款规律的论证（2-3 句） |
| `cover_direction` | string | 封面核心文字 + 视觉方向建议 |
| `priority` | string | `high` / `medium` / `low`（按：匹配策略度 + 爆款概率 + 制作成本综合判定） |
| `risk` | string | 可能翻车的原因（争议性强 / 时效窗口短 / 数据不足） |
| `content_pillar` | string | 所属内容支柱 |

额外输出：
- **全局置信度**：基于 `competitor_data_available`，标注整体选题的 `rationale` 质量。
- **方向覆盖建议**：新账号前 5 条作品推荐覆盖 2-3 个不同方向做测试（新品种草期策略）。

## Procedure

### Step 1: 读取数据源

1. 读取 `content/账号策略.md` → 提取：定位、目标人群、内容方向、差异化卖点、禁止项列表。
2. 读取 `content/粉丝画像.md` → 提取：年龄/性别/兴趣/活跃时段。
3. 读取 `content/爆款拆解经验.md` → 提取：已验证的爆款公式、标题模式、钩子结构、封面套路。
4. 读取 `content/历史作品数据库.md` → 提取：已发作品列表（标题、类型、平台、表现数据），构建去重参考集。

### Step 2: 前置检查 — 竞品数据充足性

检查 `competitor_data_available` 标志（由编排器传入）：

| 状态 | 处理 |
|------|------|
| `true` | 有近期竞品数据，选题可基于证据，`evidence_level` 可为 `verified` |
| `false` | 无竞品数据。选题仍可输出，但**所有选题的 `evidence_level` 必须标为 `hypothesis`**（待验证假设） |
| `partial` | 部分方向有数据。有数据的方向标 `verified`，无数据的标 `hypothesis` |

**当 `competitor_data_available = false` 时**，必须在输出开头明确告知：
> "当前无近期竞品采集数据，以下选题基于策略、画像和爆款规律生成，属于**待验证假设**。建议先执行竞品数据采集（competitor-intel）以降低试错成本。"

### Step 3: 生成选题

基于以下维度综合生成选题：

1. **策略匹配**：选题必须符合账号定位和内容方向；禁止项绝对不能推荐。
2. **爆款公式复用**：应用已验证的标题结构、钩子模式。
3. **历史去重**：核对 `content/历史作品数据库.md`，确保推荐选题不与近期作品高度雷同。
4. **粉丝画像适配**：选题角度和案例选择匹配粉丝特征。
5. **平台差异**：小红书侧重干货密度+利他性；抖音侧重爽感+情绪共鸣；B站侧重深度+系列化。

### Step 4: 排序与分级

优先级判定（`高` / `中` / `低`）：

| 权重因素 | 说明 |
|------|------|
| 策略匹配度 | 越贴近账号主方向，优先级越高 |
| 爆款概率 | 同赛道近期爆款验证过的公式 |
| 制作成本 | 低成本可批量 > 需特定场景/道具 |
| 数据支撑度 | 有竞品数据验证 > 纯假设 |
| 时效性 | 热点型选题有时效窗口，谨慎推荐 |

### Step 5: 新品种草期策略

检查作品数 < 5 条 → 新品种草期：
- 推荐选题覆盖 2-3 个不同方向做测试。
- 不锁定单一方向，不根据极少样本做方向收窄。
- 在输出末尾提示这是测试期，建议在选择后记录测试假设。

## Missing Input Handling

| 缺失项 | 处理 |
|------|------|
| `competitor_data_available = false` | 所有选题的 `rationale` 标注为假设，开头告知证据不足，建议先采集 |
| `content/账号策略.md` 不存在 | 使用保守默认策略：通用猫猫IP定位；提示创建策略文档以提高推荐质量 |
| `content/粉丝画像.md` 不存在 | 使用通用画像假设（18-35岁、偏好治愈/搞笑）；标注 "粉丝画像缺失，推荐精度有限" |
| `content/爆款拆解经验.md` 不存在 | 基于通用爆款原则生成；标注 "爆款拆解经验缺失，推荐基于通用规律" |
| `content/历史作品数据库.md` 不存在 | 视为首发，所有选题均为全新；不执行去重 |
| 策略文档定义了禁止项 | 严格执行，禁止项内容类型绝对不推荐 |
| 用户约束与策略冲突 | 提示冲突，以策略为准；如果用户坚持，标注为 "创作者主动偏离策略" |

## Result Contract

```yaml
skill_run_id: "topic-recommendation-{YYYYMMDD}-{NNN}"
status: "completed" | "degraded" | "blocked" | "needs_human"
outputs:
  topic_cards:
    - id: "topic-<YYYYMMDD>-<序号>"
      title: "<候选标题>"
      platforms: ["<小红书 | 抖音 | B站 | 全平台>"]
      content_type: "<口播 | vlog | 教程 | 剧情 | 混剪>"
      tone: "<温暖 | 搞笑 | 深度 | 犀利>"
      rationale: "<基于策略/画像/爆款规律的论证>"
      cover_direction: "<封面核心文字 + 视觉方向建议>"
      priority: "<high | medium | low>"
      risk: "<可能翻车的原因>"
      content_pillar: "<所属内容支柱>"
    # ... 5-10 条
  total_cards: <N>
  overall_confidence: "<high | medium | low>"
  competitor_data_status: "<true | false | partial>"
  newbie_exploration: true | false
  constrained_by_strategy: true | false
next_step: "script-creation"  # 创作者选定某条选题卡后
blocking_reason: null | "<阻塞原因>"
```

## Safety / Boundaries

1. **无竞品数据不伪装成已验证**：`competitor_data_available = false` 时，所有选题的 `rationale` 必须标注为假设性建议，明确告知 "建议先采集"。
2. **尊重策略禁止项**：策略文档明确禁止的内容类型，绝对不推荐。如果用户约束与策略冲突，提示冲突，以策略为准。
3. **避免重复**：必须核对历史作品数据库，避免与近期作品高度雷同。
4. **时效性选题谨慎推荐**：热点型选题标注时效窗口，提醒创作者抓紧或放弃。
5. **优先级是建议不是命令**：创作者有最终决策权，本模块只提供数据驱动的排序建议。
6. **新品种草期不孤注一掷**：新账号前 5 条作品覆盖 2-3 方向，不根据极少样本锁定单一方向。
7. **不替创作者选择**：只推荐选题并排序，不自行决定"用哪条"。

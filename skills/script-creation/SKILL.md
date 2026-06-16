---
name: 脚本创作
description: 基于选定选题卡，生成完整脚本大纲（含钩子、分段、配音、CTA）
provides: [脚本大纲, 钩子设计, 分段节奏, 平台适配]
depends_on:
  - file: content/账号策略.md
    purpose: 人设和语气规范
  - file: content/粉丝画像.md
    purpose: 粉丝特征和语言风格
  - file: content/爆款拆解经验.md
    purpose: 已验证的钩子模式和节奏模板
  - skill: topic-recommendation
    phases: [选题卡输出]
    purpose: 创作输入
---

# 脚本创作

## Purpose

短视频的核心竞争力在脚本结构：前 3 秒决定完播率，中间节奏决定留存率，结尾互动决定转化和涨粉。本 Skill 把选题卡转化为可拍摄的结构化脚本大纲——不写逐字稿（限制创作者发挥），而是设计关键的骨架节点，让创作者知道每一段拍什么、怎么讲、为什么这样安排。

## Inputs

| 字段 | 必填 | 说明 |
|------|:--:|------|
| `topic_card` | 条件必填 | 创作者选定的选题卡（来自 `topic-recommendation` 输出）；如果缺失但用户提供了足够信息，可基于用户输入生成临时选题卡 |
| `topic_card.id` | 条件必填 | 选题卡唯一标识，用于链路追踪 |
| `constraints.emphasis` | 否 | 希望强调的卖点 |
| `constraints.avoid_expression` | 否 | 希望避开的表达方式 |
| `constraints.visual_note` | 否 | 是否需要展示某种特定画面 |

## Reads

| 文件 | 用途 |
|------|------|
| `content/账号策略.md` | 账号人设、口播风格（温暖/犀利/幽默/理性）、内容调性 |
| `content/粉丝画像.md` | 粉丝年龄/性别/偏好 → 决定语言风格、节奏、案例选择 |
| `content/爆款拆解经验.md` | 已验证的钩子模式、分段节奏模板、结尾互动公式 |

## Outputs

输出符合 `script-outline` schema 的结构化脚本大纲：

### 4.1 元数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `script_id` | string | `script-<YYYYMMDD>-<序号>` |
| `topic_id` | string | 选题卡 `id`，如为临时选题卡则标 `temp-<timestamp>` |
| `tone` | string | 口播风格：`温暖` / `犀利` / `幽默` / `理性` |
| `persona` | string | 从策略文档提取的账号人设关键词 |

### 4.2 开头 3 秒钩子（3 个备选）

```yaml
hooks:
  - type: "<反问 | 反差 | 数据冲击 | 痛点共鸣 | 悬念 | 情绪先行>"
    text: "<一句话钩子文案>"
  - type: "<类型>"
    text: "<一句话钩子文案>"
  - type: "<类型>"
    text: "<一句话钩子文案>"
```

### 4.3 分段大纲（3-5 段）

每段包含：
```yaml
segments:
  - order: 1
    what: "<核心信息/观点，一句话概括>"
    visual: "<口播直拍 | B-roll素材 | 动画 | 文字卡片 | 场景切换>"
    why: "<基于爆款经验的节奏论证>"
  # ... 3-5 段
```

### 4.4 口播要点

```yaml
voice_notes:
  tone: "<轻松 | 严肃 | 兴奋 | 娓娓道来 | 慵懒>"
  pace_hints:
    - "<节奏提示，如 这一段放慢语速>"
    - "<节奏提示，如 这里停顿1秒制造悬念>"
  keywords_emphasis: ["<关键词1>", "<关键词2>"]
```

### 4.5 结尾互动引导（3 个备选）

```yaml
ending_guides:
  - type: "<提问互动 | 投票 | 关注理由 | 下期预告 | 评论区召唤>"
    text: "<一句话引导文案>"
  - type: "<类型>"
    text: "<一句话引导文案>"
  - type: "<类型>"
    text: "<一句话引导文案>"
```

### 4.6 平台适配版本

以上大纲同步输出两套平台适配版本：

```yaml
platforms:
  - platform: "小红书"
    duration_seconds: 60-90
    segments_count: 3
    hook_intensity: "中等"
    style_notes: "紧凑、干货密度高、口播口语化、强调利他性、结尾强调收藏"
  - platform: "抖音"
    duration_seconds: 30-60
    segments_count: 3
    hook_intensity: "强力"
    style_notes: "节奏更快、钩子更猛、情绪更强、结尾强调点赞+共鸣"
```

## Procedure

### Step 1: 获取选题卡

**正常路径（选题卡存在）：**
从编排器接收创作者选定的选题卡（`topic_card`），提取：
- 标题、平台、内容类型、情感调性、封面方向
- `rationale` 中的论证逻辑

**降级路径（选题卡缺失）：**
不直接卡死。执行以下降级：
1. 提示创作者："当前缺少选题卡。建议先执行选题推荐（topic-recommendation）。"
2. 如果创作者提供了话题/方向/大致想法 → 基于用户输入**生成临时选题卡**（`id: temp-<timestamp>`）。
3. 如果创作者无任何输入 → 输出 `status: "blocked"`，引导至 topic-recommendation。

### Step 2: 读取调性约束

1. 读取 `content/账号策略.md` → 提取人设、口播风格、内容调性、禁止项。
2. 读取 `content/粉丝画像.md` → 提取年龄/偏好/活跃时段 → 决定语言风格和案例选择。
3. 读取 `content/爆款拆解经验.md` → 提取钩子模式、分段节奏模板、结尾互动公式。

### Step 3: 设计钩子（3 个备选）

| 钩子类型 | 适用场景 | 示例结构 |
|------|------|------|
| 反问 | 引发思考、互动 | "你知道吗？90%的猫…" |
| 反差 | 打破预期、制造笑点 | "这是全网最社恐的猫，但它…" |
| 数据冲击 | 建立权威、好奇 | "做过100条猫视频我发现…" |
| 痛点共鸣 | 建立连接、认同 | "每个养猫人都经历过…" |
| 悬念 | 拉停留、完播 | "看完第3秒你就知道为什么了" |
| 情绪先行 | 快速感染、共情 | "这条给我看哭了…" |

钩子选择需参考：粉丝画像的痛点和兴趣 > 爆款拆解中高完播钩子 > 选题调性。

### Step 4: 构建分段大纲（3-5 段）

1. 将选题核心信息拆解为 3-5 个逻辑段落。
2. 每段定义：讲什么（核心信息） → 放什么（画面） → 为什么这样排。
3. 节奏论证基于爆款经验（如 "第 2 段放案例增加可信度，防止观众划走"）。
4. 分段数量基于平台：
   - 小红书：3 段（60-90 秒）
   - 抖音：3-4 段（30-60 秒）
   - B站：5+ 段（3-8 分钟）

### Step 5: 编写口播要点

1. 语气必须匹配账号策略中定义的人设调性。
2. 标注需要重音强调的关键词。
3. 标注节奏变化点（放慢、停顿、加速）。
4. 口播风格不能这条温柔下条犀利，除非策略处于测试期。

### Step 6: 设计结尾互动引导（3 个备选）

| 引导类型 | 适用目标 |
|------|------|
| 提问互动 | 提升评论率 |
| 投票 | 引导参与、增加停留 |
| 关注理由 | 转化涨粉 |
| 下期预告 | 系列化、期待管理 |
| 评论区召唤 | 私域导流（如 "私信扣1拿原图"） |

### Step 7: 生成平台适配版本

按 `platforms[]` 结构生成两套平台适配版本：

```yaml
platforms:
  - platform: "小红书"
    duration_seconds: 60-90
    segments_count: 3
    hook_intensity: "中等"
    style_notes: "紧凑、干货密度高、口播口语化、结尾强调收藏+利他性"
  - platform: "抖音"
    duration_seconds: 30-60
    segments_count: 3
    hook_intensity: "强力"
    style_notes: "节奏更快、钩子更猛、情绪更强、结尾强调点赞+共鸣"
```

## Missing Input Handling

| 缺失项 | 处理 |
|------|------|
| 无选题卡 + 用户无输入 | **不卡死**；输出 `status: "blocked"`，`blocking_reason: "缺少选题卡"`，`next_step: "topic-recommendation"` |
| 无选题卡 + 用户提供了话题/方向 | 生成临时选题卡（`id: temp-<timestamp>`），基于临时卡生成脚本 |
| `content/账号策略.md` 不存在 | 使用默认人设（治愈系猫猫IP），口播风格默认温暖；标注 "策略文档缺失，脚本调性基于通用假设" |
| `content/粉丝画像.md` 不存在 | 使用通用画像（18-35岁女性为主），语言风格默认亲切；标注 "画像缺失，语言风格基于通用假设" |
| `content/爆款拆解经验.md` 不存在 | 基于通用爆款原则生成钩子和节奏；标注 "爆款拆解缺失，脚本结构基于通用规律" |
| 选题卡 `rationale` 标注为假设 | 脚本中减少确定性断言；在 segments 的 `why` 中标注 "待数据验证" |

## Result Contract

```yaml
skill_run_id: "script-creation-{YYYYMMDD}-{NNN}"
status: "completed" | "degraded" | "blocked" | "needs_human"
outputs:
  script_id: "script-<YYYYMMDD>-<序号>"
  topic_id: "<topic_id | temp-<timestamp>>"
  temporary_card: true | false
  persona: "<人设关键词>"
  tone: "<温暖 | 犀利 | 幽默 | 理性>"
  hooks:
    - type: "<钩子类型>"
      text: "<一句话钩子文案>"
    # ... 3 个
  segments:
    - order: 1
      what: "<一句话核心信息>"
      visual: "<画面建议>"
      why: "<节奏论证>"
    # ... 3-5 段
  voice_notes:
    tone: "<轻松 | 严肃 | 兴奋 | 娓娓道来 | 慵懒>"
    pace_hints: ["<提示1>", "<提示2>"]
    keywords_emphasis: ["<词1>", "<词2>"]
  ending_guides:
    - type: "<引导类型>"
      text: "<一句话引导文案>"
    # ... 3 个
  platforms:
    - platform: "小红书"
      duration_seconds: 60-90
      segments_count: 3
      hook_intensity: "中等"
      style_notes: "紧凑、干货密度高、口播口语化"
    - platform: "抖音"
      duration_seconds: 30-60
      segments_count: 3
      hook_intensity: "强力"
      style_notes: "节奏更快、钩子更猛、情绪更强"
next_step: "cover-design"
blocking_reason: null | "<缺少选题卡 | 策略文档缺失 | ...>"
```

## Safety / Boundaries

1. **不是逐字稿**：本模块输出结构化大纲，目的是让创作者理解 "为什么这样拍"，而不是照着念稿。逐字稿会让内容失去真实感。
2. **钩子是第一优先级**：前 3 秒的钩子质量直接决定完播率，必须提供多个备选方案。
3. **每段必须有 "为什么"**：让创作者理解叙事逻辑，而不是机械执行。
4. **双版本是硬要求**：小红书和抖音的内容消费习惯差异大，不能用同一版脚本通发。
5. **口播风格必须匹配策略人设**：策略文档中定义的人设和调性贯穿始终，除非策略处于测试期。
6. **时长意识**：分段数量基于平台特性——小红书 60-90 秒、抖音 30-60 秒、B站 3-8 分钟。
7. **缺选题卡不卡死**：引导至 topic-recommendation 或基于用户输入生成临时选题卡；不陷入无输入死循环。
8. **假设选题降低断言**：使用临时选题卡或 `rationale` 标注为假设的选题时，脚本中减少确定性语言。

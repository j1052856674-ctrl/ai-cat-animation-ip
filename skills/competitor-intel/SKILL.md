---
name: 竞品情报采集
description: 用 OpenCLI 采集小红书/抖音竞品样本原始数据，输出到 data/ 目录，不进行分析
provides: [竞品数据采集, 搜索级标注, 数据入库]
depends_on:
  - tool: OpenCLI
    purpose: 小红书/抖音搜索采集
  - tool: lark-cli
    purpose: 飞书多维表格写入
  - tool: Chrome
    purpose: 单条核验和补采
reads:
  - file: content/竞品调研数据库.md
    purpose: P0 关键词池、采样规则
  - file: skills/content-ops/config/toolchain.yaml
    purpose: OpenCLI/lark-cli 调用规范与已知问题
---

# 竞品情报采集

## Purpose

**纯采集 Skill**，负责用 OpenCLI 采集小红书、抖音竞品样本原始数据，做搜索级标注后写入飞书多维表格或本地 data/ 目录。**不做分析**——分析交给下游 `topic-recommendation` 等 Skill。

**核心约束**：
1. 只采集元数据（标题/作者/链接/点赞/封面等），不下载视频
2. 采集数据按规范存档到 `data/` 目录，不在 Skill 目录内存储
3. Claude 看不到视频画面，🔴 维度标 `待核验`

---

## 采集模式

| 模式 | 命令 | 说明 |
|------|------|------|
| `search` | `collect.js --mode=search` | 关键词搜索（默认） |
| `daily-hot` | `collect.js --mode=daily-hot` | 每日热榜（仅抖音 hashtag hot） |
| `user-page` | `collect.js --mode=user-page` | 指定用户主页采集 |

---

## Capability Boundary

**本 Skill 只采集，不分析**：

| 能力 | 范围 |
|------|------|
| ✅ 搜索采集 | 关键词/热榜/用户主页 |
| ✅ 搜索级标注 | 从 tags/desc 推断内容形式、叙事结构、情绪调性 |
| ✅ 数据入库 | 写入飞书或本地 data/ 目录 |
| ❌ 方向分析 | 交给 `topic-recommendation` |
| ❌ 爆款拆解 | 交给 `topic-recommendation` + 人类 |
| ❌ 视频分析 | Claude 无法看视频，🔴 维度标 `待核验` |

---

## Inputs

| 字段 | 必填 | 说明 |
|------|:--:|------|
| `mode` | 否 | `search` / `daily-hot` / `user-page`，默认 search |
| `platform` | 是 | `xiaohongshu` / `douyin` |
| `keyword` | 条件 | search 模式必填；从 `content/竞品调研数据库.md` 取 |
| `user-id` | 条件 | user-page 模式必填 |
| `limit` | 否 | 每关键词/用户采集条数，默认 10，上限 50 |
| `save-cover` | 否 | 是否保存封面图片到 `data/covers/` |

---

## Output Fields

### 搜索级字段（自动填充）

| 字段 | 来源 | 说明 |
|------|------|------|
| `样本ID` | 自动生成 | `CR-YYYYMMDD-序号` |
| `平台` | OpenCLI | `小红书` / `抖音` |
| `搜索关键词` | OpenCLI | 原始搜索词 |
| `标题` | OpenCLI | 优先 desc 字段，截断前 60 字 |
| `完整链接` | OpenCLI | **必填**，主去重键 |
| `封面链接` | OpenCLI | 可直接下载 |
| `作者` | OpenCLI | 缺失则标 `未知` |
| `点赞数` | OpenCLI | 抖音常不准，标可信度 |
| `收藏数` | OpenCLI | 小红书可用 |
| `发布时间` | OpenCLI | 缺失留空不猜测 |
| `时间窗口` | 自动计算 | ≤7天=`热点` / 8-30天=`趋势` / >30天=`丢弃` |

### 搜索级标注字段（从 tags/desc 推断）

| 字段 | 可选值 | 推断规则 |
|------|------|------|
| `内容形式` | `动画` / `图文` / `实拍` / `混剪` / `配音` / `无法判断` | 从 `#ai漫剧` `#ai短剧` → 动画；`#图文` → 图文 |
| `叙事结构` | `猫vlog` / `猫Meme` / `AI漫剧` / `情感短片` / `教程` / `搞笑片段` / `无法判断` | 从标签判断 |
| `情绪调性` | `治愈` / `搞笑` / `萌` / `温暖` / `社畜共鸣` / `无法判断` | 从标签判断 |
| `视觉风格(工具)` | `可灵AI` / `即梦AI` / `Midjourney` / `其他` / `待核验` | 从标签判断 |
| `角色类型` | `固定橘猫` / `固定其他猫` / `无固定角色` / `系列化角色群` / `待核验` | 从标题+作者名识别 |

### 人类核验字段（留空，人工填写）

| 字段 | 可选值 | 说明 |
|------|------|------|
| `节奏类型` | `≤15s快` / `16-30s中` / `>30s慢` / `待核验` | 看视频确认 |
| `钩子策略` | `画面冲击` / `文字悬念` / `声音` / `动作` / `无` | 看前 3 秒 |
| `视觉风格确认` | 同搜索级 + 可修正 | 实际看视频确认 |
| `角色一致性` | `✅ 固定角色` / `⚠️ 偶尔一致` / `❌ 无固定角色` | 账号内不同视频间 |
| `互动风格` | `引导@好友` / `提问互动` / `金句截图` / `无运营` | 看结尾和评论区 |
| `对标判定` | `待判断` / `值得对标` / `参考` / `不相关` | 综合判断 |

---

## 数据存储规范

采集数据存储在项目根目录 `data/` 下，**不在 Skill 目录内**，确保可迁移：

```
data/
├── raw/              # 原始采集数据（按日期命名）
│   ├── search-xiaohongshu-AI猫-2026-06-16-xxxxxx.json
│   ├── daily-hot-douyin-2026-06-16-xxxxxx.json
│   └── user-page-douyin-sec_uid-2026-06-16-xxxxxx.json
├── annotated/        # 标注后数据
├── covers/           # 封面图片（可选）
└── archives/         # 历史归档
```

**文件名格式**：`{mode}-{platform}-{keyword/user-id}-{timestamp}.json`

---

---

## Procedure

### Step 1: 采集

使用 P0 关键词（8 个 × 2 平台），每词 10 条，目标 160 条初筛。

```bash
# 小红书
opencli xiaohongshu search "<关键词>" --limit 10 -f yaml 2>/dev/null

# 抖音
opencli douyin search "<关键词>" --limit 10 -f yaml 2>/dev/null
```

### Step 2: 过滤

按优先级顺序：

1. **时间窗口** — 按 `published_at` 分组：≤7天=`热点`，8-30天=`趋势`，>30天=**直接丢弃不入库**。如果某关键词返回超过 50% >30天样本，该关键词标记为 `方向枯竭`，需迭代替换。
2. **去重** — 主键 `平台 + 完整链接`；链接缺失时用 `平台 + 标题 + 作者 + 发布时间`
3. **同账号上限** — 同一账号在同一关键词下最多保留 3 条
4. **去不相关** — 移除内容属性为 `不相关` 的样本（如纯萌宠用品、宠物医院、完全不涉及猫 IP 的内容）

### Step 3: 搜索级标注

对每条过滤后样本，从 tags/desc/标题 推断：内容形式、叙事结构、情绪调性、视觉风格(工具)、角色类型。不可知维度标 `待核验`。

### Step 4: 生成核验清单

取搜索级标注后互动量最高的 20 条（优先 `热点` + `趋势`），生成人类核验清单。清单中人类核验字段留空，标注 `待核验`。

### Step 5: 入库飞书

写入飞书多维表格。表结构包含搜索级字段 + 搜索级标注 + 人类核验字段（留空）+ 评分字段。

```bash
# 先查帮助
lark-cli base +record-batch-create --help

# 写入前确认 auth
lark-cli auth status

# 写入（记录批量为 JSON 文件传入）
lark-cli base +record-batch-create \
  --app-token <base-token> \
  --table-id <table-id> \
  --records @samples.json
```

⚠️ 注意：UTF-8 without BOM，否则 lark-cli JSON 解析失败。

飞书不可用时降级为本地 `content/竞品调研数据库.md` 追加写入。

### Step 6: 人类核验

通知创作者："飞书表格中 top-20 已就绪，请核验以下 4 列：节奏类型 / 钩子策略 / 视觉风格确认 / 角色一致性 / 互动风格 / 对标判定。其余搜索级字段无需修改。"

### Step 7: 读回完整数据

```bash
lark-cli base +record-list --app-token <base-token> --table-id <table-id>
```

读回后：
- 过滤 `对标判定 = 值得对标` + `对标判定 = 参考`
- 按方向分类统计
- 输出方向分析（下一步：`topic-recommendation` 或 `strategy-maintenance`）

---

## Missing Input Handling

| 缺失项 | 处理 |
|------|------|
| 未提供关键词 | 从 `content/竞品调研数据库.md` P0 列表取默认关键词 |
| 未指定平台 | 默认双平台（小红书 + 抖音） |
| OpenCLI 搜索失败 | 降低 limit 重试一次；仍失败则记录失败原因 |
| 小红书详情/评论不可用 | 只保留搜索级字段；`数据可信度`=OpenCLI |
| 抖音互动字段为 0 | 标 `待核验`，不声称已获完整数据 |
| 发布时间为空 | 标记 `时间窗口`=`待核验`，`数据可信度`=`OpenCLI-缺发布时间`；不丢弃但降低排序权重 |
| 某关键词 >50% 样本 >30天 | 标记该关键词为 `方向枯竭`，从 P0 池迭代替换关键词，不写入飞书 |
| `lark-cli auth status` 未配置 | 提示运行 `lark-cli config init --new` |
| 飞书写入失败 | 降级为本地 `content/竞品调研数据库.md` 追加；status=`degraded` |
| 飞书权限未就绪 | 输出本地结构化结果 + 明确阻塞项（scopes 未应用） |

---

## Handoff Workflow

```
┌─────────────────────────────────────────────────────┐
│ Claude（自动化）                                      │
│  Step 1-3: 采集 → 过滤 → 搜索级标注                    │
│  Step 4-5: 生成 top-20 → 写入飞书                      │
│  → 通知创作者："表格已就绪，请核验 4 列"                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 创作者（手动，约 10 分钟）                              │
│  打开飞书多维表格 → 逐条看 top-20 视频 → 填写：         │
│  - 节奏类型（≤15s / 16-30s / >30s）                   │
│  - 钩子策略（画面 / 文字 / 声音 / 动作 / 无）           │
│  - 视觉风格确认（修正 Claude 的推断）                   │
│  - 角色一致性（✅ 固定 / ⚠️ 偶尔 / ❌ 无）              │
│  - 互动风格（@好友 / 提问 / 金句 / 无）                │
│  - 对标判定（值得对标 / 参考 / 不相关）                 │
│  → 完成后回来说"填好了"                                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ Claude（自动化）                                      │
│  Step 7: lark-cli 读回完整数据                        │
│  → 方向分析 → 选题建议 → 进入 topic-recommendation       │
└─────────────────────────────────────────────────────┘
```

---

## Result Contract

```yaml
skill_run_id: "competitor-intel-{YYYYMMDD}-{NNN}"
status: "completed" | "degraded" | "blocked" | "needs_human"
outputs:
  total_scraped: <N>
  after_dedup: <N>
  after_time_filter: <N>
  hot_7d: <N>
  trend_30d: <N>
  feishu_table: "<base-token>/<table-id>"
  feishu_ingested: true | false
  human_verify_top_n: 20
  keywords_used: ["<k1>", ...]
top_directions:
  - direction: "<AI猫vlog / AI猫Meme / ...>"
    sample_count: <N>
    avg_likes: <N>
    signal_strength: "strong" | "moderate" | "weak"
human_action_required:
  - action: "打开飞书表格核验 top-20 人类核验列"
    estimated_time: "10 分钟"
    table_link: "<飞书表格链接>"
next_step: "等待人类核验完成后进入 topic-recommendation 或 strategy-maintenance"
blocking_reason: null | "<阻塞原因>"
warnings: ["<降级/异常提醒>"]
```

---

## Safety / Boundaries

1. **不声称未完成的事**：飞书权限未就绪时只输出本地结果；人类核验字段未填写时只标 `待核验`，不代填。
2. **能力边界诚实**：Claude 不能看视频——🔴 维度必须在 result block 中明确标注"需要人类核验"。
3. **OpenCLI 是采集主入口**：不绕过 OpenCLI 做批量浏览器抓取；Chrome 只做单条核验和补采。
4. **数据可信度透明**：每条样本标注数据可信度；抖音互动数据不可直接当作真实效果。
5. **不读取/导出凭据**：不读 cookie、token、localStorage；不绕过登录/风控/访问限制。
6. **不执行写操作**：不点赞、评论、关注、私信、发布；仅读取公开内容。
7. **去重保护人工数据**：更新不覆盖人类填写的核验列。

---

## 脚本使用

### 1. 采集

```bash
# 模式 1: 关键词搜索（默认）
node scripts/collect.js --mode=search --platform=xiaohongshu --keyword="AI猫" --limit=20

# 模式 2: 每日热榜（仅抖音）
node scripts/collect.js --mode=daily-hot --platform=douyin --limit=50

# 模式 3: 指定用户主页
node scripts/collect.js --mode=user-page --platform=douyin --user-id="<sec_uid>" --limit=20

# 可选参数
#   --save-cover     保存封面图片到 data/covers/
#   --limit=N        采集条数上限（默认 10）
```

**风控防护**：
- 请求间隔 3s（基础）+ 30s（每 10 条）
- 命令超时 60s，全局超时 5 分钟
- 出错后自动重试 3 次
- 连续失败 3 次自动退出

### 2. 搜索级标注

```bash
node scripts/annotate.js data/raw/search-xiaohongshu-AI猫-2026-06-16-xxxxxx.json

# 输出: data/annotated/search-xiaohongshu-AI猫-2026-06-16-xxxxxx-annotated.json
```

> ⚠️ 注意：annotate.js 只做**搜索级标注**（从 tags/desc 推断），不做分析。
> 方向分析、爆款拆解等交给 `topic-recommendation` Skill。

### 3. 入库

```bash
node scripts/ingest-feishu.js \
  data/annotated/xxx-annotated.json \
  --app-token=xxx \
  --table-id=xxx
```

---

## 脚本目录

| 脚本 | 用途 |
|------|------|
| `scripts/collect.js` | 主采集：3 种模式 + 登录态检测 + 频率控制 + 超时保护 |
| `scripts/annotate.js` | **搜索级标注**：内容形式/叙事结构/情绪调性（不做分析） |
| `scripts/ingest-feishu.js` | 飞书入库：批量写入 + 重试机制 |

---

## 与下游 Skill 的关系

```
┌────────────────────┐
│ competitor-intel    │  ← 只采集 + 搜索级标注
│ 输出: data/raw/   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ annotate.js        │  ← 搜索级标注（tags/desc推断）
│ 输出: data/annotated/ │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ topic-recommendation │  ← 方向分析 + 爆款拆解（交给分析 Skill）
│ 输入: data/annotated/│
└────────────────────┘
```

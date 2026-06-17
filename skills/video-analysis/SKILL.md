---
name: video-analysis
description: 短视频画面分析与视频阅读方案设计技能。用于分析 MP4 或视频 URL、设计视频阅读流水线、比较视频理解模型、输出 hook/冲突/情绪曲线/节奏/可复刻公式等结构化拆解。默认是零运行时设计层，不主动安装依赖或调用付费 API，除非用户明确要求执行。
---

# 视频分析

## 目标

用一套固定、可审计的结构分析短视频：

```text
视频 URL / MP4
  -> 获取可播放视频
  -> 尽量提取逐字稿
  -> 用具备视觉能力的模型读取画面或整条视频
  -> 输出按时间轴组织的 hook / 冲突 / 情绪 / 节奏 / 公式分析
```

默认模式是**方案设计与 schema 设计**。除非用户明确要求执行，否则不要安装 Python/Node 依赖、下载模型或调用外部 API。

## 参考思路

把下面两个参考模式结合起来：

| 参考 | 可借鉴 | 边界 |
|---|---|---|
| `video-copy-analyzer` | 下载策略、逐字稿优先、内嵌字幕 -> OCR -> ASR 兜底 | 偏文字/字幕分析，本身不够成“视频理解” |
| `Rico3cats-wow-video-analyzer` | 压缩视频、逐字稿+视频双输入、六维结构化报告 | 具体运行实现别照搬，重点借 schema 和结构 |

## 运行模式

| 模式 | 适用场景 | 运行要求 |
|---|---|---|
| `design-only` | 用户要方案、Skill、schema、模型选择、流水线设计 | 不装依赖，不调 API |
| `manual-input` | 用户提供逐字稿、截图、关键帧、备注 | 只分析现成素材 |
| `video-file` | 用户提供本地 MP4 并要求执行 | 需要用户明确要求后才做本地处理 |
| `provider-api` | 用户提供 API Key/Provider 并要求执行 | 需要 provider 适配器和成本提醒 |

## 模型策略

优先采用 provider 适配器设计。模型可以换，但输出 schema 不能变。

| 角色 | 候选 | 说明 |
|---|---|---|
| 免费/MVP 试跑 | Gemini 具备视频能力的模型 | 适合早期试质量；上线前确认免费额度和数据使用条款 |
| 主力深拆 | StepFun 具备视频能力的模型，如 `step-3.7-flash` | 适合整段视频输入，最好配逐字稿一起用 |
| 低成本粗筛 | Qwen VL/Flash 具备视频能力的模型 | 用于批量筛选，再把 Top 样本送给更强模型 |
| 报告润色 | 网关里的长上下文文本模型，如 qwen/deepseek/kimi/glm | 只能在视觉提取之后使用；没确认视频输入能力前不要当视频阅读模型 |

模型能力要看支持的输入类型，不要只看上下文长度。只有当 API 支持视频文件、`video_url` 或图像/帧输入时，模型才算能读视频。

## Provider 配置契约

用一个小配置对象，让用户切模型时不用改下游分析逻辑。

```yaml
video_analysis:
  provider: gemini
  model: gemini-2.5-flash
  api_key_env: GEMINI_API_KEY
  api_base: ""
  input_mode: video_plus_transcript
  max_video_seconds: 300
  cost_mode: trial
```

支持的 `input_mode`：

| 模式 | 含义 |
|---|---|
| `video_plus_transcript` | 压缩视频 + 逐字稿，一起送给具备视频能力的模型 |
| `frames_plus_transcript` | 采样帧 + 逐字稿，一起送给具备视觉能力的模型 |
| `transcript_only` | 纯文本兜底；所有视觉字段都要标低置信度 |

## 工作流

### 第 1 步：确认输入

先确认用户手里有什么：

| 输入 | 处理 |
|---|---|
| 视频 URL | 先规划获取路径；抖音优先用已有 OpenCLI `play_url` |
| 本地 MP4 | 如果用户要求执行，就可以分析 |
| 只有逐字稿 | 只做文本层分析，并标注视觉证据缺失 |
| 关键帧/截图 | 可分析视觉瞬间，但不能推断没看到的时间段 |

### 第 2 步：选择分析深度

| 深度 | 输出 |
|---|---|
| `quick` | 总分、hook、首个冲突、公式 |
| `standard` | 时间轴、hook、冲突、情绪曲线、节奏、公式 |
| `deep` | 标准版 + 分镜证据、受众心理、改写建议、批量对比字段 |

### 第 3 步：建立证据

每个判断至少带一个证据源：

| 证据类型 | 示例 |
|---|---|
| `visual` | 物体、人物动作、镜头变化、场景切换、画面文字 |
| `audio` | 口播台词、音效、音乐节拍 |
| `text` | 字幕、标题、caption、评论引导 |
| `metadata` | 时长、平台、点赞、发布时间 |

如果证据缺失，就写 `unknown`，不要猜。

### 第 4 步：先输出 JSON

先输出机器可读 JSON，再写自然语言总结。schema 文件存在时，按 `schemas/video-analysis.schema.json` 校验。

必须包含的高层区块：

| 区块 | 用途 |
|---|---|
| `summary` | 一段话概览和分数 |
| `timeline` | 带时间码的场景/功能拆解 |
| `hook` | 首个吸引点，带证据 |
| `conflicts` | 冲突类型、强度、触发点、升级、解决 |
| `emotion_curve` | 带时间码的情绪强度和类型 |
| `pacing` | 节奏和留存风险 |
| `replicable_formula` | 可复用内容结构 |
| `quality_control` | 置信度、缺失输入、幻觉风险 |

### 第 5 步：再写给人看的报告

JSON 后面补一段面向创作者的简洁报告：

1. 哪些地方有效。
2. 哪些地方伤留存。
3. 下一条可以复用哪一段。
4. 下一步该测什么。

## 质量规则

1. 只有逐字稿时，不要把它叫成“视频理解”。
2. 没有视觉证据时，不要推断视觉风格、动作、hook 时间、冲突时间。
3. 时间范围要写成 `0-3s`、`3-8s`、`8-15s`，不要只写“开头”。
4. 冲突强度用 1-5 分，并解释原因。
5. 把模型输出当草稿证据；凡是影响策略的字段都要标置信度。
6. 平台操作只读，不要点赞、评论、关注、发布，也不要绕过登录/限流。

## 结果契约

```yaml
skill_run_id: "video-analysis-{YYYYMMDD}-{NNN}"
status: "completed" | "degraded" | "blocked" | "needs_human"
outputs:
  analysis_json: "<path or inline json>"
  report_md: "<path or inline markdown>"
  input_mode: "video_plus_transcript | frames_plus_transcript | transcript_only"
  provider: "<provider/model or none>"
  confidence: "high | medium | low"
next_step: "<recommended next step>"
blocking_reason: null
warnings: []
```

## 环境检测

只有在用户要求执行 `video-file` 或 `provider-api` 模式时，才检查环境。

### 必需项

| 组件 | 用途 |
|---|---|
| Python 3.9+ | 运行本地前处理脚本 |
| FFmpeg | 压缩视频、抽音频、抽帧 |
| `yt-dlp` | 通用视频下载 |
| `requests` | 抖音下载与接口请求 |
| `pysrt` | 字幕文件读写 |
| `python-dotenv` | 本地环境变量读取 |

### 可选项

| 组件 | 用途 |
|---|---|
| `funasr` / `modelscope` / `torch` / `torchaudio` | 中文 ASR 逐字稿 |
| `rapidocr-onnxruntime` | 烧录字幕 OCR |
| `openai-whisper` | 备用语音转写 |

### 环境检测规则

1. 设计阶段不检查依赖，只给方案。
2. 真正执行时先检测 FFmpeg、Python、下载器、ASR/OCR 组件。
3. 缺什么就只补什么，不一次性装一堆。
4. 如果用户只给逐字稿或截图，就不要强制装视频处理依赖。

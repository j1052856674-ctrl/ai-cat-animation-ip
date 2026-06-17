# 视频分析报告模板

在产出有效的 `video-analysis.schema.json` 结果后，用这个模板写给创作者的报告。

## 创作者报告

### 总览

`{one_liner}`

- 总分：`{overall_score}/100`
- 置信度：`{confidence}`
- 主要亮点：`{main_strength}`
- 主要风险：`{main_risk}`

### Hook

- 时间：`{hook.time_range}`
- 类型：`{hook.type}`
- 强度：`{hook.strength}/5`
- 为什么有效或无效：`{hook.description}`
- 证据：`{hook.evidence}`

### 冲突

每个冲突都写：

- 时间：`{time_range}`
- 类型：`{type}`
- 强度：`{intensity}/5`
- 触发点：`{trigger}`
- 升级/解决：`{escalation}` / `{resolution}`

### 时间轴

| 时间 | 功能 | 画面 | 语音/文字 |
|---|---|---|---|
| `{time_range}` | `{function}` | `{visual}` | `{audio_text}` |

### 可复用公式

`{replicable_formula.formula}`

可直接套用的模板：

`{replicable_formula.template}`

可复制项：

- `{what_to_copy}`

不要照搬：

- `{what_not_to_copy}`

下一步测试：

`{next_test}`

### 质量控制

- 是否有视觉证据：`{visual_evidence_available}`
- 是否有逐字稿：`{transcript_available}`
- 缺失输入：`{missing_inputs}`
- 幻觉风险：`{hallucination_risks}`

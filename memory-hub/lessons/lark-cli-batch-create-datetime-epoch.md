---
name: lark-cli-batch-create-datetime-epoch
description: lark-cli base +record-batch-create datetime字段必须用epoch毫秒，ISO字符串和YYYY-MM-DD格式均会失败
type: lesson
scope: project
source: claude
agents: [claude]
created: 2026-06-15
bridge: true
completeness: high
confidence: high
needs_review: false
token_policy: selective-read
---

# 踩坑：lark-cli batch-create 日期格式

## 问题

用 lark-cli base +record-batch-create 写入 74 条竞品样本时，datetime 字段（发布时间/采集时间）连续失败：

| 尝试 | 格式 | 结果 |
|------|------|------|
| 1 | `2026/03/22` | `not_found`（字段找不到，实际是格式不对的误报） |
| 2 | `2026-03-22 00:00:00` | `invalid_request: Provide a valid datetime string in the format YYYY-MM-DD HH:mm:ss` |
| 3 | `2026-03-22T00:00:00+08:00` | `invalid_request`（同上错误） |

## 根因

lark-cli batch-create 的 datetime 字段**不接受字符串**，必须传 **epoch 毫秒时间戳**（`Number` 类型）。Feishu API 报错信息有误导性——提示用字符串格式，但实际上只有数字才被接受。

## 修正

用 `new Date(v).getTime()` 转换所有日期字段为 epoch 毫秒：

```javascript
rows.map(r => fields.map(f => {
  if ((f === '发布时间' || f === '采集时间') && v) {
    return new Date(v.replace(/\//g, '-')).getTime();
  }
  return v;
}));
```

## 防范

lark-cli 写入涉及 datetime 字段时，先用 `--dry-run` 单条测试日期格式，确认后的转换逻辑直接记录。

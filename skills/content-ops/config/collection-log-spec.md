# 采集日志规范

> 每次竞品数据采集必须记录的标准化日志。用于采集质量追踪、异常定位和后续流程优化。

---

## 必记字段

每次采集记录以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `collection_time` | `string` | 采集开始时间，Asia/Shanghai，格式 `YYYY-MM-DD HH:mm:ss` |
| `keywords` | `string[]` | 本轮使用的搜索关键词列表 |
| `platforms` | `string[]` | 采集平台，取值 `xiaohongshu` / `douyin` |
| `total_returned` | `number` | 原始搜索返回数（所有关键词+平台合计） |
| `after_dedup` | `number` | 去重后的样本数 |
| `after_time_filter` | `number` | 时间过滤后（丢弃 >30天）的样本数 |
| `ingested` | `number` | 最终入库数（写入飞书 Base 的记录数） |
| `anomaly_count` | `number` | 异常数合计 |
| `anomalies` | `object[]` | 异常明细列表，每条包含 `type`、`keyword`、`platform`、`detail` |

---

## 异常分类

| 异常类型 | 枚举值 | 说明 |
|------|------|------|
| 搜索失败 | `search_failed` | OpenCLI 命令执行失败/超时/权限错误 |
| API 限流 | `api_rate_limited` | 平台返回限流响应（HTTP 429 或等效） |
| 序列化失败 | `serialization_failed` | OpenCLI 返回数据无法解析为预期格式 |
| 字段缺失 | `field_missing` | 关键字段缺失（如 link/title/published_at 为空） |
| 日期解析失败 | `date_parse_failed` | `published_at` 格式无法解析为日期 |

---

## 日志格式

**JSONL**，每行一条采集记录（一轮采集 = 一条记录）。

```jsonl
{"collection_time":"2026-06-15 14:30:00","keywords":["AI猫vlog","猫meme"],"platforms":["xiaohongshu","douyin"],"total_returned":80,"after_dedup":72,"after_time_filter":65,"ingested":60,"anomaly_count":5,"anomalies":[{"type":"field_missing","keyword":"猫meme","platform":"douyin","detail":"3条样本 link 为空"},{"type":"date_parse_failed","keyword":"AI猫vlog","platform":"xiaohongshu","detail":"2条 published_at 格式异常"}]}
```

---

## 存储位置

```
content/collection-logs/{YYYYMMDD}-{HHmmss}.jsonl
```

示例：`content/collection-logs/20260615-143000.jsonl`

---

## 与飞书表的关系

日志中的 `record_id`（若记录）对应飞书 Base 中的 `_record_id`，用于追溯入库记录与日志的关联关系。`collection_time` 对应飞书记录的 `采集时间` 字段。

日志是采集过程的审计记录，飞书表是数据的主存储——两者互补，日志不可替代飞书表。

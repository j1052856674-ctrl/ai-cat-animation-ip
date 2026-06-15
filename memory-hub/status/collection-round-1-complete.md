---
name: collection-round-1-complete
description: 首轮竞品采集完成——74条入飞书 Base，top-20 人类核验清单已就绪
type: status
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

# 首轮竞品采集完成

## 采集结果

| 指标 | 数值 |
|------|:--:|
| 搜索关键词 | 12 个 P0（小红书 5 + 抖音 7） |
| OpenCLI 平台 | 小红书 + 抖音 |
| 原始采集 | ~120 条 |
| 过滤后入库 | **74 条**（小红书 28 + 抖音 46） |
| 时间窗口 | 热点(≤7天) 4 / 趋势(8-30天) 4 / 参考(>30天) 66 |

## 飞书

- Base: `MCwibHumUasGTJsQAtRcicDInph`
- Table: `竞品样本` (`tblU23Fw2FnTjIIQ`)
- 链接: https://my.feishu.cn/base/MCwibHumUasGTJsQAtRcicDInph
- 搜索级字段 14 个 + Claude 标注字段 6 个 + 人类核验字段 6 个 + 评分字段 3 个

## 下一步

1. 创作者打开飞书表格，核验 top-20 人类核验列（节奏/钩子/视觉确认/角色一致性/互动风格/对标判定）
2. 核验完成后 Claude 读回完整数据 → 方向分析 → 进入 02-topic 选题推荐

## 已知问题

- 抖音互动字段（plays/comments/shares）OpenCLI 恒返回 0，标 `待核验`
- 采集 Agent 因 `image_url` 字段 API 序列化失败（OpenCLI 返回了封面缩略图），改用直接命令处理
- 首次入库因日期格式不兼容失败（epoch millisecond→ISO→epoch millisecond，最终用 `new Date().getTime()` 修复）

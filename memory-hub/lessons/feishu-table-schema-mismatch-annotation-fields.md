---
name: feishu-table-schema-mismatch-annotation-fields
description: Feishu Base 竞品样本表仅有14个基础字段，schema定义的标注/评分/人类核验字段未建表，导致lark-cli无法写入完整数据
type: lesson
scope: project
source: worker-code
agents: [worker-code]
created: 2026-06-15
bridge: true
completeness: high
confidence: high
needs_review: false
token_policy: selective-read
---

# 踩坑：Feishu 表 Schema 与实际字段不匹配

## 问题

Round 2 竞品采集处理 76 条样本写入飞书时，`lark-cli base +record-batch-create` 报告 `not_found` 错误，实际仅有 14 个基础字段可写入。

## 根因

`schemas/competitor-sample.schema.json` 定义了 27+ 字段（搜索级 + 标注 + 评分 + 人类核验），但飞书 Base 实际建表时只创建了 14 个基础字段：

**飞书表中存在的字段**（14 个）：
样本ID, 平台, 搜索关键词, 标题, 完整链接, 作者, 点赞数, 收藏数, 分享数, 评论数, 发布时间, 时间窗口, 数据可信度, 采集时间

**飞书表中缺失的字段**（13+ 个）：
cover_url, 内容形式, 叙事结构, 情绪调性, 视觉风格(工具), 角色类型, 互动强度, IP可迁移性, 制作可行性, 节奏类型, 钩子策略, 视觉风格确认, 角色一致性, 互动风格, 对标判定

`lark-cli --dry-run` 不验证字段名有效性（只验证请求格式），导致单字段测试全部"通过"，误导认为字段存在。

## 修正

1. 仅写入 14 个存在的字段到飞书
2. 完整标注+评分数据保存到本地 `content/round2-samples.json`
3. `数据可信度` 的 "OpenCLI-缺发布时间" 值不在飞书表选项中 → 映射为 "待核验"
4. `时间窗口` 的 "待核验" 值不在飞书表选项中 → douyin 条目传 null

## 防范

1. **飞书写入前先用真实写入测试字段**：`lark-cli --dry-run` 不可信，应用最小 `+record-batch-create` 真实写 1 条确认字段名和可选值
2. **表结构变更时同步 schema**：飞书表新增字段后，应同时更新 `competitor-sample.schema.json` 和 `data-fields.yaml`
3. **标注数据双通道**：飞书只存搜索级基础字段，标注+评分以本地 JSON 为主 → 需要另外的同步机制或手动导入

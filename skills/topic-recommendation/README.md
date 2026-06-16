# 选题推荐

## 职责

基于竞品样本和账号策略，产出 5-10 条选题卡供创作者选择。

## 脚本目录

- `scripts/generate-topics.js` — 选题生成

## 依赖

- `content/账号策略.md`
- `content/粉丝画像.md`
- `content/爆款拆解经验.md`
- `content/历史作品数据库.md`
- `competitor-intel` 竞品样本

## 输入输出

- **输入**：策略文档 + 竞品样本 + 历史作品
- **输出**：选题卡列表（`topic-card.schema.json`）
- **下游**：`script-creation`

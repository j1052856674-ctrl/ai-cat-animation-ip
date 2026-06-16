# 竞品情报采集

## 职责

用 OpenCLI 采集小红书/抖音竞品样本，搜索级标注后写入飞书，人类核验视频级维度。

## 脚本目录

- `scripts/collect.sh` — OpenCLI 批量采集
- `scripts/annotate.js` — 搜索级标注
- `scripts/ingest-feishu.sh` — 飞书入库

## 依赖

- OpenCLI >= 1.8
- lark-cli
- Chrome（单条核验兜底）

## 输入输出

- **输入**：`content/竞品调研数据库.md`（关键词池）
- **输出**：飞书多维表格 / 本地文件（搜索级标注样本）
- **下游**：`topic-recommendation`、`strategy-maintenance`

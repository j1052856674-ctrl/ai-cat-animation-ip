# 发布复盘

## 职责

读取最新作品数据，7天趋势对比，定位问题环节，输出复盘结论与策略更新建议。

## 脚本目录

- `scripts/analyze.sh` — 数据分析

## 依赖

- `content/历史作品数据库.md`
- `content/账号策略.md`
- `content/粉丝画像.md`
- `tools/codex-automation/data/daily/` 采集数据

## 输入输出

- **输入**：发布数据 + 历史作品 + 策略文档
- **输出**：复盘报告
- **下游**：`strategy-maintenance`

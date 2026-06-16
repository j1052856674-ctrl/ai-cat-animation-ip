# 脚本创作

## 职责

基于选定选题卡，生成完整脚本大纲（含钩子、分段、配音、CTA）。

## 脚本目录

- `scripts/build-outline.js` — 脚本大纲生成辅助

## 依赖

- `content/账号策略.md`
- `content/粉丝画像.md`
- `content/爆款拆解经验.md`
- `topic-recommendation` 选题卡

## 输入输出

- **输入**：选题卡 + 策略文档
- **输出**：脚本大纲（`script-outline.schema.json`）
- **下游**：`cover-design`

# 封面包装

## 职责

基于脚本大纲设计封面大字、跨平台标题、描述文案和AI封面图提示词。

## 脚本目录

- `scripts/generate-cover-prompt.js` — 封面提示词生成

## 依赖

- `content/账号策略.md`
- `content/粉丝画像.md`
- `content/爆款拆解经验.md`
- `script-creation` 脚本大纲

## 输入输出

- **输入**：脚本大纲 + 策略文档
- **输出**：封面方案（`cover-package.schema.json`）
- **下游**：发布

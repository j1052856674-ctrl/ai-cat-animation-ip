---
name: toolchain-choices
description: 猫猫动画IP项目关键工具链决策及理由
metadata:
  type: decision
  bridge: true
---

# 工具链关键决策

## 决策 1: 跳过 Pippit CLI

**选择**: 不使用 `@pippit-dev/cli`
**理由**: 需要 `XYQ_ACCESS_KEY`，该 Key 在小云雀网页端无法生成（可能是内部/合作方限定）。等官方开放或直接上 Cookie API Wrapper。
**替代**: 初期小云雀网页版手动生成，P4 上 `seedance2.0_XYQ_APi` Cookie 自动化方案。

## 决策 2: 跳过 OpenClaw

**选择**: 不使用 OpenClaw
**理由**: 已有飞书 CLI + CC + Codex，OpenClaw 的飞书插件和多引擎管理无额外价值。

## 决策 3: 半自动数据策略（飞书多维表格）

**选择**: 不做自动化爬虫，采用飞书多维表格 + 人工录入 + 第三方数据平台辅助
**理由**: 小红书和抖音反爬严格，频繁抓取容易封号。朋友作为运营每天刷手机即可录入爆款数据。
**替代**: 禅妈妈/新榜/灰豚免费版辅助。P3+ 视情况购买第三方 API。

## 决策 4: P3 之前手动发布

**选择**: 发布阶段前全部手机端手动操作
**理由**: 需先摸清平台对 AI 视频的风控边界（是否限流/判搬运），确认安全后再自动化。

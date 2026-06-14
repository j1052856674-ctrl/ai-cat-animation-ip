---
name: codex-automation-tool
description: Codex 短视频运营数据采集+日报自动化工作流已就绪
metadata:
  type: decision
  bridge: true
---

# Codex 自动化运营分析工作流

**状态**: ✅ 文件就绪，待 Codex 接入运行
**创建时间**: 2026-06-14
**位置**: `tools/codex-automation/`

## 核心内容

基于 Codex Automations + Computer Use 的三步工作流：
1. **采集数据** — 打开抖音创作者平台，读取作品数据 → `data/daily/YYYY-MM-DD.json`
2. **生成分析** — 对比 7 天趋势，检测异常 → `reports/YYYY-MM-DD.md`
3. **渲染报告** — HTML 模板替换 → `output/YYYY-MM-DD.html`

## 与 PLAN.md 数据策略的关系

此工具覆盖「自有账号数据」的自动化采集与分析（Agent ⑥ + ⑦ 的数据部分），**不替代**竞品/趋势数据的人工+第三方工具策略（Agent ①）。

两者互补：
- 自有数据：Codex 自动化（本工具）
- 竞品/趋势数据：人工刷 + 飞书多维表格（PLAN.md P0-P2 策略）

## 关键决策

- 选择 Computer Use 而非 API 抓取：模拟真人操作浏览器，降低风控风险
- 仅覆盖抖音（抖音创作者平台有浏览器端），小红书数据采集待 P3+ 解决
- 日报模板使用 Mustache 风格 {{占位符}}，Codex 直接替换，不依赖额外渲染引擎
- 遇到登录/验证码立即暂停，绝不自动重试

## 下一步

- 用户将 `automation-prompt.md` 发给 Codex 完成安装
- 用 `examples/daily-report.sample.json` 做一次模拟渲染验证

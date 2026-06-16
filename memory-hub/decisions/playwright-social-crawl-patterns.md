---
name: playwright-social-crawl-patterns
description: Playwright采集社交媒体数据的两层策略和反模式
type: decision
bridge: true
supersedes:
created: 2026-06-16
updated: 2026-06-16
lifecycle: archived
---

# Playwright 采集社交媒体数据的策略

> ⚠️ **此决策已过时**。2026-06-16 验证发现 OpenCLI 已能满足采集需求，Playwright 作为备选方案。
>
> 最新方案见: `docs/03-technical/crawl-strategy.md`

---

## 设计原则：两层提取策略

1. **页面加载层**：必须等待动态数据加载完成。抖音/小红书都是 SPA，`domcontentloaded` 事件触发时数据还没渲染。需要：
   - 不用 `networkidle`（太严格，30s超时）
   - 用 `domcontentloaded` + `waitForTimeout(5000+)` 
   - 或等待特定元素出现（如视频标题）

2. **数据提取层**：CSS 选择器不稳定（抖音/小红书使用 obfuscated class names 如 `oVE17FOy`），应该：
   - 优先用 `innerText` + 正则提取（更稳定）
   - 备用 CSS 选择器（需持续维护）

## 反模式：硬编码 RAW_DATA 不是采集

`process_round2.js` 中 RAW_DATA 是手动录入的测试数据，comments/shares/plays/published_at 全部为默认值（0或null）。字段缺失的根因不是"爬取失败"而是"根本没有爬"。解决方案是引入自动化采集（OpenCLI 为主，Playwright 备选）。

## 反模式：逐个补依赖 vs 识别根因

Python 3.14 无法构建 pydantic_core → 逐个 pip install 缺失模块是错误策略。应一开始识别根因（Python版本不兼容）并直接换方案（改用 OpenCLI）。

## Playwright 测试结果

| 平台 | headless | 有头模式 | 备注 |
|------|---------|---------|------|
| 抖音 | ❌ 被检测 | ⚠️ 可拿到数据但选择器不稳定 | 需要 stealth 插件 |
| 小红书 | ❌ 登录弹窗 | ❌ 登录弹窗 | 必须登录态 |

---

*此文件已归档。当前方案：OpenCLI `search` + `user-videos` + `note`。*

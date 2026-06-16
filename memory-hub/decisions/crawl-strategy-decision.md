---
name: crawl-strategy-decision
description: '[已废弃] 采集方案选型决策——原Docker+Evil0ctal方案，现改用OpenCLI'
type: decision
bridge: true
supersedes: 
created: 2026-06-16
updated: 2026-06-16
lifecycle: archived
---

# [已废弃] 采集方案选型决策

> ⚠️ **此决策已废弃**。2026-06-16 验证发现 OpenCLI `user-videos` 已能拿到抖音完整数据，不再需要 Docker + Evil0ctal。
> 
> 最新方案见: `docs/03-technical/crawl-strategy.md`

---

## 历史决策（仅供参考）

原决策：选 Docker + Evil0ctal（抖音）而非纯 Playwright

### 评估过的方案

| 方案 | 抖音表现 | 小红书表现 | 维护成本 | 结论 |
|------|---------|-----------|---------|------|
| Playwright headless | 被检测，"视频数据加载中" | 必须登录 | 高（CSS obfuscation） | ❌ 不推荐 |
| Playwright 有头模式 | 可拿到页面数据但选择器不稳定 | 需登录态 | 高 | ⚠️ 备用 |
| ~~Evil0ctal API~~ | ~~18k stars，支持反爬~~ | ~~不支持~~ | ~~低（Docker一键）~~ | ~~✅ 推荐~~ |
| TikHub(付费) | 最全 | 最全 | 低 | 💰 参照基准 |

### 废弃原因
1. OpenCLI `user-videos` 已能拿到抖音完整数据（标题/时长/点赞/评论/视频URL）
2. 不需要额外部署 Docker
3. 维护成本更低

---

*此文件已归档，不再更新。*

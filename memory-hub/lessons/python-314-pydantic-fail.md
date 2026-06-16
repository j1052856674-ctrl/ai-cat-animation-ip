---
name: python-314-pydantic-fail
description: Python 3.14预发布版无法构建pydantic_core（Evil0ctal方案已废弃）
type: lesson
bridge: true
supersedes:
created: 2026-06-16
updated: 2026-06-16
lifecycle: archived
---

# Python 3.14 与 pydantic_core 构建失败

> ⚠️ **此踩坑记录已过时**。2026-06-16 验证发现 OpenCLI 已能满足采集需求，Evil0ctal/Docker 方案已废弃。
> 
> 最新方案见: `docs/03-technical/crawl-strategy.md`

---

## 历史问题

Python 3.14 预发布版（Python 3.14.0a1）在 Windows 上无法构建 pydantic_core，导致 ~~Evil0ctal~~ 本地部署失败。

## 根因

pydantic_core 2.18.1 的 Rust 扩展在 Python 3.14 上缺少预编译 wheel。

## 原解决方案（已废弃）

~~放弃本地 Python 部署，改用 Docker 部署绕过 Python 依赖问题。~~

## 实际解决方案（2026-06-16）

弃用 Evil0ctal，改用 OpenCLI 直接采集：
- 抖音：`search` + `user-videos` 组合
- 小红书：`search` + `note` 组合

## 经验教训

1. 不要盲目追求本地部署，先验证 CLI 工具的能力边界
2. 第三方开源项目（Evil0ctal）维护成本高，优先考虑平台官方 CLI
3. OpenCLI 已能满足需求时，不要引入额外的部署复杂度

---

*此文件已归档，作为历史参考。*

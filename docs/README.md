# AI猫动画IP 项目文档中心

> **项目**: ai-cat-animation-ip
> **目标**: AI 动画 → 宠物 IP → 表情包/带货变现
> **文档版本**: v1.0
> **最后更新**: 2026-06-16

---

## 📁 文档导航

### [00-project/](./00-project/) — 项目总览
| 文档 | 说明 |
|------|------|
| [README.md](./00-project/README.md) | 项目总览、技术栈、变现路径 |
| [PLAN.md](./00-project/PLAN.md) | 完整项目规划（Phase 0-5）|
| [architecture.md](./00-project/architecture.md) | 系统架构图、Agent 体系设计 |

### [01-strategy/](./01-strategy/) — 策略文档
| 文档 | 来源 | 说明 |
|------|------|------|
| [account-strategy.md](./01-strategy/account-strategy.md) | `content/账号策略.md` | IP定位、人设、内容方向 |
| [fan-persona.md](./01-strategy/fan-persona.md) | `content/粉丝画像.md` | 目标受众画像 |
| [keyword-strategy.md](./01-strategy/keyword-strategy.md) | `memory-hub/decisions/keyword-strategy-optimization.md` | 关键词四维组合法 |
| [viral-analysis.md](./01-strategy/viral-analysis.md) | `content/爆款拆解经验.md` | 爆款规律拆解 |

### [02-operations/](./02-operations/) — 运营流程
| 文档 | 来源 | 说明 |
|------|------|------|
| [two-phase-annotation.md](./02-operations/two-phase-annotation.md) | `memory-hub/decisions/two-phase-annotation-capability-boundary.md` | 两阶段标注能力边界 |

### [03-technical/](./03-technical/) — 技术文档
| 文档 | 来源 | 说明 |
|------|------|------|
| [opencli-capabilities.md](./03-technical/opencli-capabilities.md) | 新生成 | OpenCLI v1.8.3 完整能力矩阵 |
| [crawl-strategy.md](./03-technical/crawl-strategy.md) | `memory-hub/decisions/crawl-strategy-decision.md` | 采集方案选型决策 |
| [playwright-patterns.md](./03-technical/playwright-patterns.md) | `memory-hub/decisions/playwright-social-crawl-patterns.md` | Playwright 采集策略 |

### [04-skills/](./04-skills/) — Skill 设计
| 文档 | 说明 |
|------|------|
| *(待补充)* | Skill 拆分方案 |

### [05-references/](./05-references/) — 参考资料
| 文档 | 来源 | 说明 |
|------|------|------|
| [competitor-database.md](./05-references/competitor-database.md) | `content/竞品调研数据库.md` | 竞品数据库模板 |
| [history-works.md](./05-references/history-works.md) | `content/历史作品数据库.md` | 历史作品数据库模板 |

---

## 🗂️ 其他目录

| 目录 | 说明 |
|------|------|
| `memory-hub/` | 项目记忆（踩坑记录、状态、决策原档）|
| `scripts/` | 活跃脚本（采集脚本、工具脚本）|
| `scripts/archive/` | 废弃脚本归档 |
| `skills/` | Skill 代码和定义 |
| `tools/` | 工具代码（飞书网关等）|

---

## 🧹 清理记录

| 时间 | 操作 | 说明 |
|------|------|------|
| 2026-06-16 | 迁移 `content/` → `docs/` | 策略文档统一归档 |
| 2026-06-16 | 迁移 `memory-hub/decisions/` → `docs/` | 决策文档按主题归档 |
| 2026-06-16 | 归档废弃脚本 | `scripts/` 测试脚本归档到 `scripts/archive/` |
| 2026-06-16 | 删除 `.claude/memory/` | 旧会话记忆已迁移到 `memory-hub/` |
| 2026-06-16 | 删除 `evil0ctal-api/` | 外部仓库，不再使用 |
| 2026-06-16 | 删除 `content/` | 内容已迁移到 `docs/` |

---

## 📋 下一步

- [ ] 补充 `docs/04-skills/` — Skill 拆分方案
- [ ] 更新根目录 `README.md`
- [ ] 整合 `memory-hub/` 中的重复决策文件

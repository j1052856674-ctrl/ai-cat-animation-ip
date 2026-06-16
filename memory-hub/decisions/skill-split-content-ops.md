---
name: skill-split-content-ops
---
## Skill 拆分决策：从单体大 Skill 到多 Skill 架构

### 背景

原 `skills/content-ops/` 是一个单体大 Skill，内部包含 7 个模块（00-06），文件膨胀、职责不清、无法独立调用。

### 拆分方案

| 新 Skill | 来源模块 | 职责 | scripts/ |
|----------|---------|------|----------|
| **content-ops** | 总控精简 | 路由、状态管理、新手引导 | `check-env.sh` |
| **competitor-intel** | module-00 | 竞品数据采集+标注+入库 | `collect.sh`, `annotate.js`, `ingest-feishu.sh` |
| **strategy-maintenance** | module-01 | 账号策略校准 | `update-strategy.sh` |
| **topic-recommendation** | module-02 | 选题推荐 | `generate-topics.js` |
| **script-creation** | module-03 | 脚本创作 | `build-outline.js` |
| **cover-design** | module-04 | 封面包装 | `generate-cover-prompt.js` |
| **post-review** | module-05 | 发布复盘 | `analyze.sh` |

### 关键原则

1. **编排者不实现**：content-ops 只负责路由和状态管理，不实现任何业务能力
2. **脚本归属自己**：每个 Skill 的脚本放在自己 `scripts/` 下，不放在外面
3. **Schema 随 Skill 走**：topic-card、script-outline、cover-package 等 schema 迁移到对应 Skill
4. **全局共享保留在 content-ops**：skill-result.schema.json、toolchain.yaml 等全局配置留在总控

### 待清理（Phase 3）

- [x] `skills/content-ops/modules/00-05.md`（已迁移到新 Skill）
- [x] `skills/content-ops/schemas/topic-card.script-outline.cover-package.competitor-sample.json`（已迁移）

### Phase 3 完成记录

- **已删除**：modules/00-05（保留 06-onboarding 在总控）
- **已删除**：schemas/competitor-sample、topic-card、script-outline、cover-package
- **保留**：modules/06-onboarding.md（新手引导属于总控职责）
- **保留**：schemas/skill-result.schema.json、content-file-contract.md（全局共享）
- **content-ops 文件数**：从 21 个精简到 11 个

---

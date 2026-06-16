# AI猫动画IP 副业项目

> AI 动画 → 宠物 IP → 表情包/带货变现
>
> **📚 文档中心**: [docs/README.md](docs/README.md)

## 项目状态

| 阶段 | 状态 | 说明 |
|------|:--:|------|
| P0 前置探索 | 🔄 进行中 | OpenCLI 能力验证完成，待规划 Skill |
| P1 基建 + IP | ⏸️ 未开始 | |
| P2 飞书 Bot + Gatekeeper | ⏸️ 未开始 | 飞书网关已搭建 |
| P3 完整运营飞轮 | ⏸️ 未开始 | |
| P4 自动化 | ⏸️ 未开始 | |
| P5 变现 | ⏸️ 未开始 | |

## 快速导航

| 文档 | 路径 |
|------|------|
| 📋 项目规划 | [docs/00-project/PLAN.md](docs/00-project/PLAN.md) |
| 🏗️ 系统架构 | [docs/00-project/architecture.md](docs/00-project/architecture.md) |
| 🔑 关键词策略 | [docs/01-strategy/keyword-strategy.md](docs/01-strategy/keyword-strategy.md) |
| 🛠️ OpenCLI 能力 | [docs/03-technical/opencli-capabilities.md](docs/03-technical/opencli-capabilities.md) |
| 📊 竞品数据库 | [docs/05-references/competitor-database.md](docs/05-references/competitor-database.md) |

## 技术栈

| 工具 | 用途 | 状态 |
|---|---|---|
| OpenCLI | 小红书/抖音数据采集 | ✅ 已验证能力边界 |
| lark-cli | 飞书多维表格读写 | ✅ 已验证 |
| Playwright | 浏览器自动化 | ⚠️ 备用方案 |
| Claude Code | 编码、脚本编写 | ✅ 使用中 |

## 项目结构

```
ai-cat-animation-ip/
├── docs/                    # 📚 文档中心
│   ├── 00-project/          # 项目总览
│   ├── 01-strategy/         # 策略文档
│   ├── 02-operations/       # 运营流程
│   ├── 03-technical/        # 技术文档
│   ├── 04-skills/           # Skill 设计
│   └── 05-references/       # 参考资料
├── memory-hub/              # 项目记忆
│   ├── decisions/           # 决策记录
│   ├── lessons/             # 踩坑记录
│   └── status/              # 项目状态
├── scripts/                 # 活跃脚本
│   ├── active/              # 当前使用
│   ├── archive/             # 废弃归档
│   └── utils/               # 公共工具
├── skills/                  # Skill 代码
│   └── content-ops/         # 内容运营总控
└── tools/                   # 工具代码
    └── feishu-agent-gateway/ # 飞书网关
```

## 最近更新

- **2026-06-16**: 完成 OpenCLI 能力验证，生成 [能力矩阵](docs/03-technical/opencli-capabilities.md)
- **2026-06-16**: 完成项目文档整理，建立 [docs/](docs/) 文档中心
- **2026-06-16**: 修正抖音 `user-videos` 能拿到完整数据的结论
- **2026-06-16**: 确认小红书 `note` 登录后能拿到收藏/评论

## 待办

- [ ] 规划 Skill 拆分
- [ ] 编写采集脚本
- [ ] 编写采集脚本（抖音/小红书）

---

*最后更新: 2026-06-16*

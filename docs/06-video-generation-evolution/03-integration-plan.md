# 03-整合实施计划

> **目标**：用 4-6 周时间完成多模型架构 + libtv + OpenMontage 设计模式的整合

---

## 阶段划分

```
P0 验证（第 1-2 周）        P1 基建（第 2-3 周）        P2 集成（第 3-4 周）        P3 优化（第 5-6 周）
    │                         │                         │                         │
    ▼                         ▼                         ▼                         ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ 安装 libtv  │          │ Provider    │          │ 路由升级    │          │ 质量优化    │
│ 验证图片/   │          │ Registry    │          │ Reviewer    │          │ 多模式扩展  │
│ 视频生成    │          │ Selector    │          │ Skill       │          │ 数据闭环    │
│ 评估成本    │          │ Checkpoint  │          │ Gatekeeper  │          │             │
│             │          │ Cost Tracker│          │ 增强        │          │             │
│ 产出：验证  │          │ 产出：基础  │          │ 产出：完整  │          │ 产出：优化  │
│ 报告        │          │ 设施就绪    │          │ 工作流可用  │          │ 后的系统    │
└─────────────┘          └─────────────┘          └─────────────┘          └─────────────┘
```

---

## P0 验证（第 1-2 周）

> **目标**：验证 libtv 能否满足核心需求，确认成本可接受

### P0.1 环境搭建

| 任务 | 命令 | 预估 | 验收标准 |
|---|---|---|---|
| 安装 libtv CLI | 执行 install 脚本 | 30 分钟 | `libtv --help` 正常输出 |
| 登录 liblib | `libtv login web` | 30 分钟 | 登录成功，token 有效 |
| 创建工作区 | `libtv workspace create "AI猫动画"` | 15 分钟 | workspace 创建成功 |
| 创建画布 | `libtv project create "测试画布"` | 15 分钟 | project 创建成功 |

### P0.2 图片生成验证

| 任务 | 命令 | 预估 | 验收标准 |
|---|---|---|---|
| 文生图 | `libtv node create "猫" -t image --prompt "橘猫"` | 30 分钟 | 成功生成图片 |
| 图生图 | 以上一张图为参考 | 30 分钟 | 形象一致，姿态变化 |
| 图片 Slash | `libtv image shortcut list` | 30 分钟 | Slash 指令可用 |

### P0.3 视频生成验证

| 任务 | 命令 | 预估 | 验收标准 |
|---|---|---|---|
| 文生视频 | `text2video` 模式 | 30 分钟 | 视频生成成功 |
| 图生视频 | `singleImage2video` | 30 分钟 | 猫形象一致，动作自然 |
| 首尾帧视频 | `frames2video` | 30 分钟 | 首尾画面与输入一致 |
| 音频驱动 | `audio2video` | 30 分钟 | 动作与音频匹配 |

### P0.4 脚本/分镜验证

| 任务 | 命令 | 预估 | 验收标准 |
|---|---|---|---|
| 脚本生成 | `libtv node create "剧本" -t script --prompt "..."` | 30 分钟 | 脚本结构完整 |
| 分镜图组 | `libtv script storyboard "剧本"` | 30 分钟 | 分镜图与脚本对应 |

### P0.5 成本与效果评估

| 任务 | 说明 | 预估 | 验收标准 |
|---|---|---|---|
| 单条视频成本 | 记录图片+视频的实际消耗 | 30 分钟 | 成本可接受（< ¥5/条） |
| 批量生成测试 | 同时生成 5 条视频 | 1 小时 | 无报错，质量稳定 |
| 质量评估 | 邀请朋友评估生成质量 | 1 小时 | 评分 > 7/10 |

### P0 退出标准

- ✅ libtv 能稳定生成质量可接受的猫视频
- ✅ 图生视频模式能保证猫形象一致性
- ✅ 单条视频成本在可接受范围内
- ✅ 工作流串联无阻塞

---

## P1 基建（第 2-3 周）

> **目标**：完成 Provider Registry、Selector、配置文件等基础设施

### P1.1 Provider Registry

| 任务 | 文件 | 预估 |
|---|---|---|
| BaseProvider 抽象类 | `lib/providers/base_provider.py` | 2 小时 |
| Claude Provider | `lib/providers/claude_provider.py` | 2 小时 |
| OpenAI Provider | `lib/providers/openai_provider.py` | 2 小时 |
| LibTV Provider | `lib/providers/libtv_provider.py` | 3 小时 |
| Midjourney Provider | `lib/providers/midjourney_provider.py` | 2 小时 |
| FLUX Provider | `lib/providers/flux_provider.py` | 2 小时 |
| Provider Registry | `lib/providers/registry.py` | 2 小时 |

### P1.2 ModelSelector

| 任务 | 文件 | 预估 |
|---|---|---|
| 配置加载 | `lib/selector.py`（加载 models.yaml / presets.yaml） | 2 小时 |
| 模型选择逻辑 | `lib/selector.py`（select / select_ab_test / fallback） | 3 小时 |
| 健康检查 | `lib/selector.py`（health_check / availability） | 2 小时 |
| 成本估算 | `lib/selector.py`（estimate_cost） | 2 小时 |

### P1.3 配置文件

| 任务 | 文件 | 预估 |
|---|---|---|
| 模型注册表 | `config/models.yaml` | 2 小时 |
| 预设策略 | `config/presets.yaml` | 1 小时 |
| 环境变量模板 | `.env.example` | 30 分钟 |

### P1.4 Checkpoint 机制

| 任务 | 文件 | 预估 |
|---|---|---|
| Checkpoint 写入 | `lib/checkpoint.py` | 4 小时 |
| Checkpoint 读取 | `lib/checkpoint.py` | 2 小时 |
| Resume 逻辑 | `lib/checkpoint.py` | 4 小时 |

### P1.5 Cost Tracker

| 任务 | 文件 | 预估 |
|---|---|---|
| 成本估算 | `lib/cost_tracker.py` | 4 小时 |
| 成本记录 | `lib/cost_tracker.py` | 2 小时 |
| 预算告警 | `lib/cost_tracker.py` | 2 小时 |

### P1 退出标准

- ✅ Provider Registry 可用，支持 6+ 模型
- ✅ ModelSelector 可用，支持 4 种策略
- ✅ 配置文件可加载，支持快速切换
- ✅ Checkpoint 可用，session 中断后可恢复
- ✅ Cost Tracker 可用，成本透明

---

## P2 集成（第 3-4 周）

> **目标**：将新能力集成到 content-ops Skill，建立质量审查机制

### P2.1 修改 content-ops 路由

| 任务 | 文件 | 预估 |
|---|---|---|
| 新增 "生成视频" 路由 | `skills/content-ops/config/routes.yaml` | 2 小时 |
| 新增 "生成脚本" 路由 | `skills/content-ops/config/routes.yaml` | 2 小时 |
| 新增 "生成封面" 路由 | `skills/content-ops/config/routes.yaml` | 2 小时 |
| 更新依赖声明 | `skills/content-ops/SKILL.md` | 1 小时 |

### P2.2 升级 Video Production 模块

| 任务 | 文件 | 预估 |
|---|---|---|
| 脚本生成 Stage | `skills/content-ops/modules/03-script.md` | 4 小时 |
| 图片生成 Stage | 新增 module | 4 小时 |
| 视频生成 Stage | 新增 module | 4 小时 |
| 视频合成 Stage | 新增 module | 4 小时 |
| 封面包装 Stage | `skills/content-ops/modules/04-cover.md` | 4 小时 |

### P2.3 引入 Reviewer Skill

| 任务 | 文件 | 预估 |
|---|---|---|
| Reviewer Skill 设计 | `skills/content-ops/skills/meta/reviewer.md` | 1 天 |
| 质量审查清单 | `skills/content-ops/skills/meta/review-checklist.md` | 4 小时 |
| 自动化审查 | `skills/content-ops/skills/meta/reviewer.md` | 1 天 |

### P2.4 Gatekeeper 升级

| 任务 | 文件 | 预估 |
|---|---|---|
| 审核卡片增强 | `tools/feishu-agent-gateway/` | 1 天 |
| 审核状态同步 | `lib/checkpoint.py` | 4 小时 |
| 批量审核 | `tools/feishu-agent-gateway/` | 4 小时 |

### P2 退出标准

- ✅ content-ops 可以路由到新的 video-production 模块
- ✅ 完整工作流：脚本 → 图片 → 视频 → 合成 → 封面
- ✅ Reviewer Skill 可用，质量审查自动化
- ✅ Gatekeeper 审核增强，支持视频预览

---

## P3 优化（第 5-6 周）

> **目标**：优化生成质量、扩展视频模式、建立数据闭环

### P3.1 质量优化

| 任务 | 说明 | 预估 |
|---|---|---|
| Prompt 工程优化 | 针对猫 IP 优化生成 prompt | 2 天 |
| 参考图库建设 | 建立猫形象参考图库 | 2 天 |
| 负面 prompt 调优 | 排除不希望的元素 | 1 天 |
| 模型对比测试 | Seedance 2.0 vs 其它模型 | 2 天 |

### P3.2 扩展视频模式

| 任务 | 说明 | 预估 |
|---|---|---|
| 首尾帧模式 | 用于控制视频起始和结束 | 2 天 |
| 音频驱动模式 | 用于音乐卡点视频 | 2 天 |
| 视频参考模式 | 用于模仿爆款视频风格 | 2 天 |
| 混剪模式 | 多段视频拼接 | 2 天 |

### P3.3 数据闭环

| 任务 | 说明 | 预估 |
|---|---|---|
| 发布数据回传 | 将小红书/抖音数据回传到 checkpoint | 2 天 |
| A/B 测试 | 对比不同生成策略的效果 | 2 天 |
| 效果归因 | 分析哪些因素影响播放量 | 2 天 |
| 自动优化 | 根据数据反馈自动调整参数 | 3 天 |

### P3 退出标准

- ✅ 视频质量稳定，朋友评分 > 8/10
- ✅ 至少 3 种视频模式可用
- ✅ 数据闭环建立，可自动优化

---

## 关键依赖

```
P0 验证
├── 依赖：libtv CLI 安装包可用
├── 依赖：liblib 账号可登录
└── 产出：验证报告（是否可行、成本、质量）

P1 基建
├── 依赖：P0 验证通过
├── 依赖：Python 3.10+
├── 依赖：Node.js 18+
└── 产出：Provider Registry、Selector、配置文件、Checkpoint、Cost Tracker

P2 集成
├── 依赖：P1 基建完成
├── 依赖：content-ops 现有模块稳定
└── 产出：完整工作流可用

P3 优化
├── 依赖：P2 集成完成
└── 产出：优化后的系统
```

---

## 验收标准

### 功能验收

| 验收项 | 验收标准 |
|---|---|
| 视频生成 | 一条命令生成视频，无需人工干预 |
| 形象一致性 | 同一猫形象生成 5 条视频，相似度 > 80% |
| 脚本生成 | 输入选题，自动输出完整脚本（含分镜） |
| 封面生成 | 输入脚本，自动输出封面（含标题、标签） |
| 字幕生成 | 视频自动生成逐字高亮字幕 |
| 质量审查 | 生成后自动审查，输出评分和改进建议 |
| 成本透明 | 每条视频生成前预估成本，生成后记录实际成本 |
| 状态恢复 | Session 中断后可从上次中断点恢复 |

### 性能验收

| 验收项 | 验收标准 |
|---|---|
| 单条视频生成时间 | < 5 分钟（从脚本到成品） |
| 批量生成 | 支持同时生成 5 条视频 |
| 成功率 | > 90%（生成成功 / 生成尝试） |
| 成本 | 单条视频 < ¥5 |

### 质量验收

| 验收项 | 验收标准 |
|---|---|
| 朋友评分 | > 8/10（10 分制） |
| 平台通过率 | 小红书/抖音审核通过 > 95% |
| 播放量 | 平均播放量 > 1000（发布 7 天后） |

---

## 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| libtv 生成效果不达预期 | 项目延期 | P0 验证阶段充分测试，如不达标则退回小云雀 |
| libtv 成本过高 | 预算超支 | P0 验证阶段精确测算成本，设定预算上限 |
| 多模型架构复杂度 | 延期 | 分阶段实施，先跑通单模型再扩展 |
| Remotion 学习曲线 | 延期 | 先复用现有组件，再开发新组件 |
| liblib 服务不稳定 | 无法生成 | 保留小云雀作为 fallback |

---

## 资源需求

| 资源 | 数量 | 说明 |
|---|---|---|
| 时间 | 4-6 周 | fan + Agent 协作 |
| liblib 账号 | 1 个 | 用于视频生成 |
| liblib 预算 | ¥500-1000 | 用于测试和初期生成 |
| Node.js 环境 | 1 套 | 用于 Remotion |
| Python 3.10+ | 1 套 | 用于 Provider Registry |
| FFmpeg | 1 套 | 用于视频处理 |
| 飞书账号 | 1 个 | 用于 Gatekeeper 和数据存储 |

---

*最后更新：2026-06-30*

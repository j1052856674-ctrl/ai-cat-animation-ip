---
name: 内容运营总控
description: 内容运营全链路总入口——路由、状态管理、新手引导、工具协调
provides: [内容运营总控, 路由, 状态管理, 新手引导, 工具协调]
depends_on:
  - skill: competitor-intel
    phases: [竞品数据采集]
    purpose: 竞品数据采集与标注
  - skill: strategy-maintenance
    phases: [策略更新]
    purpose: 账号策略校准
  - skill: topic-recommendation
    phases: [选题推荐]
    purpose: 选题推荐
  - skill: script-creation
    phases: [脚本创作]
    purpose: 脚本大纲创作
  - skill: cover-design
    phases: [封面包装]
    purpose: 封面方案设计
  - skill: post-review
    phases: [发布复盘]
    purpose: 数据复盘与策略建议
  - tool: OpenCLI
    purpose: 数据采集
  - tool: lark-cli
    purpose: 飞书读写
  - tool: Chrome
    purpose: 浏览器兜底
---

# 内容运营总控

## 一句话目标

内容运营全链路总入口。你只需说出需求（"出选题""写脚本""做封面""复盘"等），总控自动检查前置条件、路由到对应 Skill、传递上下文，并输出统一结果。全程不替你决策——关键选择始终由你做出。

---

## 使用原则

1. **始终先检查状态再路由** — 收到任何指令，先确认：当前在标准循环的哪一步、上游依赖是否就绪、工具环境是否可用。
2. **单入口** — 不直接指定"调用哪个 Skill"。所有请求走总控路由。
3. **人类决策点显式列出** — 选哪条选题、是否发布、是否改策略等决策，由你做出；总控只提供数据驱动的建议。
4. **不自动发布** — 任何情况下，总控不自动触发发布操作、不绕过平台授权。
5. **安全边界不可逾越** — 不绕过平台审核机制、不代你登录、不模拟用户行为提交内容。

---

## 路由规则

触发词路由到目标 Skill。路由表定义在 `config/routes.yaml`：

| 触发词 | 路由目标 | 前置条件 |
|--------|---------|---------|
| "竞品调研""验证方向""采集数据""看效果数据" | `competitor-intel` | 无硬前置 |
| "推荐选题""下一条拍什么""选题建议" | `topic-recommendation` | 需有近期竞品样本；不足时先路由到 competitor-intel |
| "写脚本""出脚本""这条怎么拍" | `script-creation` | 需有选定选题卡 |
| "做封面""出封面""封面和标题" | `cover-design` | 需有脚本大纲 |
| "复盘""分析数据""看看昨天那条" | `post-review` | 需有发布数据 |
| "更新策略""调整方向""重新定位" | `strategy-maintenance` | 需有复盘结论 |
| "从选题开始""来一条完整的" | topic → script → cover 串联 | 无前置 |
| "第一次使用""新手启动""帮我开始" | 新手引导 | 无前置 |

### 路由歧义处理

当用户输入同时匹配多个模块时（如"看看数据"可能指竞品采集或发布复盘），总控列出匹配项让用户选择，不自动推断。

### 依赖缺失处理

上游输出缺失时，总控不强行执行。例如"写脚本"但未选定选题 → 提示"请先从最新选题推荐中选择一条"，而非自行决定。

---

## 标准循环

```
周期开始
  → competitor-intel（采集小红书/抖音样本并写入飞书或本地）
  → strategy-maintenance（根据采集样本校准方向）
  → topic-recommendation（出 5-10 条选题）
  → 创作者选定选题
  → script-creation（基于选定选题出大纲）
  → cover-design（基于脚本出封面方案）
  → 创作者拍摄、剪辑、发布
  → 等待 24-48 小时
  → post-review（分析数据）
  → strategy-maintenance（根据复盘更新策略）
  → 回到 competitor-intel / topic-recommendation
```

---

## 状态检查

每次收到指令后，总控执行以下检查：

```
1. 读取上下文：定位当前在标准循环的哪一步
2. 检查上游依赖：确认所需文件/工具是否存在
3. 检查工具可用性：OpenCLI / lark-cli / Chrome 状态
4. 判断路由：当前指令应路由到哪个 Skill
5. 检查新人期门禁：作品数 < 10 时强制新人规则
6. 执行路由：传递上下文并调用目标 Skill
```

---

## 中断恢复

如果执行到一半时说"继续""接着上次"或重新触发已有步骤：

1. 读取上下文摘要，定位上次执行到哪一步
2. 确认无需重新执行的前提下，从断点继续
3. 最终产物覆盖而非重复创建

---

## 统一输出格式

所有模块完成后，总控输出统一结果块（result block）：

```yaml
skill_run_id: "content-ops-{module}-{YYYYMMDD}-{NNN}"
status: "completed" | "degraded" | "blocked" | "needs_human"
outputs:
  - path: "<相对项目路径>"
    type: "<topic_card | script_outline | cover_package | competitor_sample | review_result>"
    summary: "<一句话摘要>"
next_step: "<下一步建议>"
blocking_reason: "<若 status=blocked，说明原因和解决路径>"
human_decisions: ["<需要人类决策的事项>"]
warnings: ["<降级/异常提醒>"]
```

`status` 取值定义：

| 状态 | 含义 |
|------|------|
| `completed` | 模块正常完成，产出可用 |
| `degraded` | 模块在降级模式下完成（如飞书不可用改本地），产出可用但能力受限 |
| `blocked` | 前置条件不满足，未执行。blocking_reason 说明原因 |
| `needs_human` | 模块完成但有人类决策点待确认 |

---

## 安全边界

### 不自动发布

任何情况下，总控不自动执行以下操作：
- 不调用平台发布 API
- 不代你提交内容到小红书/抖音/飞书
- 不为你填写任何平台表单

### 不绕过授权

- 飞书、OpenCLI 等工具需要你已授权；未授权时总控提示你手动完成
- 不模拟登录、不存储凭据、不绕过 OAuth

### 内容安全

- 不生成违反平台社区规范的内容
- 不生成涉及政治敏感、色情、暴力的选题/文案
- 发现风险内容时主动提示并拒绝

### 数据安全

- 不将 `content/` 下的策略数据写入第三方服务
- 不在 result block 外输出完整粉丝画像或账号策略

---

## 与其他 Skill 的关系

```
┌────────────────────────────────────────────┐
│           内容运营总控 (content-ops)          │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │         标准循环                      │    │
│  │  topic → script → cover → 发布     │    │
│  │    ↑                          ↓      │    │
│  │  strategy ←── review ←── data      │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  路由到下游 Skill，不重复实现业务能力          │
└────────────────────────────────────────────┘

下游 Skill：
├── competitor-intel      # 竞品数据采集
├── strategy-maintenance  # 账号策略维护
├── topic-recommendation  # 选题推荐
├── script-creation       # 脚本创作
├── cover-design          # 封面包装
└── post-review           # 发布复盘
```

- **总控不实现能力** — 总控只定义流程、路由、状态管理，不重复实现任何 Skill 的业务方法论
- **总控不维护数据** — 所有 `content/` 下的文件由各自 Skill 维护，总控只确保调用链中文件存在
- **总控是唯一入口** — 创作者永远只和总控交互，不直接指定"调用哪个 Skill"
- **Skill 可独立自引导** — 即使被直接触发（绕过总控），Skill 也能处理上游缺失

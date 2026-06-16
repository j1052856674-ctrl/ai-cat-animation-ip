# 猫猫动画 IP 副业项目

> AI 动画 → 宠物 IP → 表情包/带货变现

## 技术栈总览

| 工具 | 用途 | 状态 |
|---|---|---|
| **Claude Code** | 编码、脚本编写、流程编排 | ✅ 已安装 |
| **Codex** | 编码、自动化任务 | ✅ 已安装 |
| **小云雀 CLI** (`@pippit-dev/cli`) | AI 视频/动画生成（Seedance 2.0） | ❌ 待安装 |
| **OpenClaw** | 飞书频道集成、内容发布 | ✅ 已配置 |
| **飞书**（OpenClaw 插件） | 内容分发、社群运营 | ✅ 已配置 |
| **Paperclip** | Agent 编排（多 Agent 协作时启用） | ⏸️ 第二步 |
| **pm2** | 进程守护 | ✅ 已安装 |

## 工具职责

### 小云雀 CLI
- npm 包：`@pippit-dev/cli`
- 配置：`xyq_access_key` + `xyq_openapi_base="https://xyq.jianying.com"`
- 能力：剧本→分镜→角色→成片全流程，批量图片/视频生成
- 依赖：Node.js

### 飞书（OpenClaw Channel）
- 插件：`@openclaw/feishu@2026.5.12`
- 当前状态：WebSocket 已连接，feishu[default] 运行中
- 用途：内容发布到飞书群、机器人互动、社区运营

### Claude Code / Codex
- 脚本编写、流程自动化
- 协调小云雀 CLI 的调用
- 内容模板管理

### Paperclip（第二步）
- 当 Agent 数量 > 3 或需要 24/7 自动化时启用
- 管理多个 Agent 的心跳、预算、任务分配

## 内容生产管线规划

```
剧本/Prompt → [小云雀 CLI] → 视频/图片素材 → 后期处理 → 分发
                    ↑                               ↓
              Claude Code 编排              飞书群/表情商店
```

## 变现路径

| 阶段 | 方式 | 技术支撑 |
|---|---|---|
| 1 | 表情包 | AI 生成 → 批量裁剪 → 上传微信表情商店 |
| 2 | 内容 IP | 飞书/抖音分发猫猫动画积累粉丝 |
| 3 | 带货 | 宠物用品 + 飞书社群 + 内容营销 |

## 待办

- [ ] 安装小云雀 CLI：`npm install -g @pippit-dev/cli`
- [ ] 获取 xyq_access_key
- [ ] 跑通小云雀 → 视频生成 Hello World
- [ ] 设计猫猫 IP 角色设定
- [ ] 飞书内容发布跑通
- [ ] Paperclip 评估

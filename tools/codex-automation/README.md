# Codex 短视频运营分析自动化

> 给 AI 猫猫动画 IP 项目配套的运营数据自动化工作流。
>
> 状态：✅ 文件就绪，待 Codex 接入

---

## 这是什么

一套 Codex Automation + Computer Use 工作流，自动完成三件事：

```
抖音创作者平台 → 采集数据 → 趋势对比 → HTML 日报
      ↑                                    ↓
      └── 每天 08:00 自动运行 ←──── 飞书群推送
```

**和项目 PLAN.md 的关系**：

| PLAN 环节 | 本工具覆盖 |
|---|---|
| ⑥ 数据回收 Agent | ✅ 自动化采集自有账号数据 |
| ⑦ 复盘 Agent | ✅ 自动趋势对比 + 异常检测 |
| ① 趋势/竞品 Agent | ❌ 竞品数据仍需人工 + 第三方工具 |
| ⑤ 发布 Agent | ❌ 发布仍是手动（P3 前） |

本工具解决的是**自有账号数据的自动化闭环**——竞品/趋势数据仍按 PLAN.md 的半自动策略走。

---

## 目录结构

```
tools/codex-automation/
├── README.md                              ← 本文件
├── automation-prompt.md                   ← 发给 Codex 的一键安装提示词
├── templates/
│   └── daily-report-template.html         ← HTML 日报模板（含 {{占位符}}）
├── examples/
│   └── daily-report.sample.json           ← 示例数据（结构参考）
├── douyin-daily-report-skill/
│   └── SKILL.md                           ← Codex Skill 完整定义
├── data/daily/                            ← Codex 自动写入（YYYY-MM-DD.json）
├── reports/                               ← Codex 自动写入（YYYY-MM-DD.md）
└── output/                                ← Codex 自动写入（YYYY-MM-DD.html）
```

---

## 快速开始

### 1. 前提检查

- [ ] 安装了 Codex app
- [ ] Codex 已能访问本项目目录
- [ ] 在系统设置中给 Codex 开启了辅助功能/屏幕录制权限
- [ ] 抖音创作者平台账号已登录（浏览器中保持登录态）

### 2. 安装

打开 Codex app → 进入本项目线程 → 复制 `automation-prompt.md` 中的提示词发给 Codex。

### 3. 验证

发这条测试指令给 Codex：

> 请立即手动执行一次运营日报工作流，用 examples/daily-report.sample.json 作为模拟数据，验证模板渲染是否正常。

如果 `output/` 下生成了 HTML 文件且浏览器能正常打开，说明安装成功。

### 4. 日常

- 每天上午 08:00 自动运行
- 如果遇到登录失效，Codex 会暂停并通过飞书通知
- 每天的输出文件：`data/daily/日期.json` + `reports/日期.md` + `output/日期.html`

---

## 日报内容

每份日报包含：

| 区块 | 内容 |
|---|---|
| 📊 核心指标 | 8 个指标卡片 + 变化趋势 |
| 🏆 最佳作品 | 完整数据 + 表现判断 |
| 📋 作品明细 | 当天所有作品的表格 |
| 📅 7 天趋势 | 连续 7 天的核心指标对比表 |
| ⚠️ 异常波动 | 自动检测并标注严重程度 |
| 🔍 分析与建议 | 做对了什么、问题在哪、原因推测、下一步行动、继续观察项 |

---

## 对 小红书 的适配

当前工作流仅针对抖音（抖音有浏览器可访问的创作者平台）。小红书的数据采集方案：

| 方案 | 说明 |
|---|---|
| **方案 A：手动导出** | 小红书创作者后台 → 数据中心 → 导出 CSV → 放到 `data/daily/` |
| **方案 B：第三方工具** | 禅妈妈/新榜/灰豚的 API（见 PLAN.md Q4） |
| **方案 C：手机端自动化** | 在手机端通过快捷指令/自动化抓包 → 推送到飞书 |

建议先用方案 A 跑通数据闭环，再决定 P3+ 是否上方案 B/C。

---

## 维护

| 场景 | 操作 |
|---|---|
| 模板样式调整 | 直接改 `templates/daily-report-template.html`，不要改占位符名字 |
| 新增数据字段 | 同步改 3 个文件：sample.json 结构 → SKILL.md 字段规范 →模板 {{变量}} |
| Codex 选择器失效 | 飞书群会收到告警，改 SKILL.md 中的页面选择器描述 |
| 想改日报时间 | 改 `automation-prompt.md` 的定时规则重新发给 Codex |

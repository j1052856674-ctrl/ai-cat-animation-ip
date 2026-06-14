---
name: douyin-daily-report
description: Codex 自动化抖音创作者平台数据采集 + 运营分析日报生成
version: 1.0.0
platform: codex
provides: [短视频数据采集, 运营日报生成, 趋势对比分析]
depends_on: []
---

# 抖音运营日报 Skill

> 给 Codex 使用的自动化 Skill。定时从抖音创作者平台采集数据，对比历史趋势，生成运营分析 HTML 日报。

## 一、Skill 能力

| 能力 | 说明 |
|---|---|
| **数据采集** | 通过 Computer Use 打开抖音创作者平台，读取账号作品数据 |
| **结构化存储** | 将当天数据写为 `data/daily/YYYY-MM-DD.json` |
| **趋势对比** | 读取近 7 天历史数据，自动计算变化率、方向、异常 |
| **日报生成** | 基于数据 + 趋势 → 生成 Markdown 分析报告 |
| **HTML 渲染** | 用模板替换占位符，输出可直接在浏览器打开的日报页面 |

## 二、工作流（3 步）

### 工作流 1：采集数据

```
触发：定时任务（建议每天 08:00）
操作：
  1. 打开抖音创作者平台 (creator.douyin.com)
  2. 如果遇到登录/扫码/验证码 → 暂停，飞书群通知用户手动处理
  3. 进入「作品管理」→「已发布作品」
  4. 逐一读取每条作品的数据字段：
     - 标题、发布时间、播放量、点赞、评论、收藏、分享
     - 完播率、互动率、涨粉贡献
  5. 汇总为 JSON，写入 data/daily/YYYY-MM-DD.json
  6. 如果当天无新发布 → 采集昨日整体数据（用于趋势追踪）
```

**采集字段规范**（每条视频至少采集以下字段）：
```json
{
  "id": "视频 ID（从 URL 或页面提取）",
  "title": "视频标题",
  "publish_time": "ISO 8601 时间格式",
  "plays": 0,
  "likes": 0,
  "comments": 0,
  "saves": 0,
  "shares": 0,
  "completion_rate": 0.0,
  "interaction_rate": 0.0,
  "new_followers": 0,
  "duration_seconds": 0,
  "tags": []
}
```

### 工作流 2：生成分析

```
触发：工作流 1 完成后自动触发
输入：data/daily/YYYY-MM-DD.json + data/daily/ 近 7 天文件
操作：
  1. 读取当天 JSON
  2. 扫描 data/daily/ 目录，取最近 7 个日期的 JSON
  3. 计算每日变化率、变化方向
  4. 检测异常波动（播放量单日下降 > 30%、互动率突变 > 50% 等）
  5. 生成 Markdown 日报，写入 reports/YYYY-MM-DD.md
```

**异常检测规则**：
| 条件 | 级别 | 标签 |
|---|---|---|
| 播放量单日下降 > 30% | ⚠️ warning | 流量异常 |
| 互动率单日波动 > 50% | ⚠️ warning | 内容质量异常 |
| 连续 3 天下降 | 🔴 danger | 持续下滑趋势 |
| 点赞/收藏比突变 > 2x | ℹ️ info | 内容类型偏好变化 |
| 涨粉暴增 > 100% | ℹ️ info | 爆款预警（正面） |
| 举报/不感兴趣上升 | 🔴 danger | 合规风险 |

**Markdown 日报必须包含**：
1. 总体判断（1 句话）
2. 最佳作品及原因
3. 做对了什么（列表）
4. 问题与风险（列表）
5. 原因推测（1-2 段）
6. 下一步建议（列表）
7. 继续观察项（列表）

### 工作流 3：渲染报告

```
触发：工作流 2 完成后自动触发
输入：data/daily/YYYY-MM-DD.json + reports/YYYY-MM-DD.md
操作：
  1. 读取 templates/daily-report-template.html
  2. 从 JSON 中提取占位符对应的值
  3. 使用 Mustache/Handlebars 语法替换（{{variable}} 和 {{#each list}}）
  4. 从 Markdown 分析中提取文本段落填入模板
  5. 写入 output/YYYY-MM-DD.html
  6. 飞书群推送报告摘要 + HTML 文件路径
```

## 三、错误处理

| 场景 | 行为 |
|---|---|
| **登录失效 / 需要扫码** | 暂停所有流程，飞书群发消息 @用户：需要手动扫码登录 |
| **页面结构变化** | 尝试备用选择器，失败后推送告警：页面选择器需要更新 |
| **当天无新数据** | 采集整体账号数据（非按作品），日报标注「今日无新发布」 |
| **历史数据缺失**（不满 7 天） | 有多少对比多少，标注「数据积累中（X/7 天）」 |
| **模板文件缺失** | 使用内置最小模板生成纯文本报告 |
| **连续失败 3 次** | 停止自动化，推送告警，等待用户介入 |

## 四、权限要求

Codex 需要以下权限才能运行此 Skill：
- **Computer Use**：控制浏览器访问抖音创作者平台
- **文件系统访问**：读写项目 `tools/codex-automation/` 目录
- **官方 `lark-cli`**（可选）：把报告摘要或结构化数据写入飞书文档/表格

用户需提前在系统设置中授予 Codex：
- macOS：系统偏好设置 → 隐私与安全性 → 辅助功能 → 允许 Codex
- Windows：设置 → 隐私 → 屏幕录制 → 允许 Codex

## 五、目录约定

```
tools/codex-automation/
  data/daily/          ← 工作流 1 写入（YYYY-MM-DD.json）
  reports/             ← 工作流 2 写入（YYYY-MM-DD.md）
  output/              ← 工作流 3 写入（YYYY-MM-DD.html）
  templates/           ← HTML 模板（只读）
  examples/            ← 示例数据（参考用）
  douyin-daily-report-skill/
    SKILL.md           ← 本文件
```

## 六、配置变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DOUYIN_CREATOR_URL` | `https://creator.douyin.com` | 创作者平台地址 |
| `DATA_DIR` | `tools/codex-automation/data/daily/` | 数据存储目录 |
| `TEMPLATE_PATH` | `tools/codex-automation/templates/daily-report-template.html` | HTML 模板路径 |
| `OUTPUT_DIR` | `tools/codex-automation/output/` | 报告输出目录 |
| `TREND_WINDOW_DAYS` | `7` | 趋势对比天数 |
| `LARK_CLI_PROFILE` | （空） | 官方 `lark-cli` 配置 profile（可选，默认使用当前 profile） |


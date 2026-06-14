---
name: 竞品数据采集
description: 用 OpenCLI 采集小红书/抖音竞品样本，经 Chrome 单条核验后写入飞书多维表格或电子表格
provides: [竞品数据采集, IP方向验证数据, 飞书入库]
depends_on:
  - tool: OpenCLI
    purpose: 小红书/抖音结构化采集主入口
  - tool: lark-cli
    package: "@larksuite/cli"
    purpose: 飞书多维表格或电子表格结构化入库
  - tool: Chrome
    purpose: 登录态、详情页视觉核验、缺失字段单条补采
  - file: content/竞品调研数据库.md
    purpose: 字段定义与人工补录模板
---

# 竞品数据采集

## 一、解决什么问题

在没有真实数据前，不把任何 IP 方向视为已确定结论。本 Skill 用小红书、抖音竞品样本验证内容方向、互动强度、评论情绪和商业化风险，把 OpenCLI 采集结果整理后写入飞书数据表，供后续 IP 方向验证、选题推荐和复盘使用。

## 二、触发场景

- 用户说“竞品调研”“验证 IP 方向”“采集小红书/抖音数据”“看这个方向有没有数据”。
- 选题推荐前缺少竞品数据，或已有策略只来自主观判断。
- 需要把小红书/抖音样本整理进飞书多维表格或电子表格。

## 三、工具分工

| 层级 | 工具 | 职责 |
|---|---|---|
| 采集层 | OpenCLI | 小红书搜索、笔记详情、评论；抖音搜索 |
| 入库层 | `lark-cli`（官方 `@larksuite/cli`） | 写入飞书多维表格或电子表格 |
| 兜底层 | Chrome | 登录态确认、详情页视觉核验、单条缺失字段补采 |

不要使用 npm 裸包 `lark-cli` 作为依赖源；官方包是 `@larksuite/cli`，安装后暴露命令 `lark-cli`。本项目已废弃本地 webhook wrapper，飞书相关能力统一收敛到官方 `lark-cli`。

## 四、采集命令

### 小红书

```powershell
opencli xiaohongshu search "打工人猫" --limit 5 -f yaml --site-session persistent
opencli xiaohongshu note "<完整小红书URL含xsec_token>" -f yaml --site-session persistent
opencli xiaohongshu comments "<完整小红书URL含xsec_token>" --limit 5 -f yaml --site-session persistent
```

### 抖音

```powershell
opencli douyin search "打工人猫" --limit 5 -f yaml --site-session persistent
```

抖音搜索返回的播放、评论、分享等互动字段可能为 0 或不完整，不能直接当作真实效果数据。关键样本需要用 Chrome 打开详情页做单条视觉核验，并把 `数据可信度` 标为 `Chrome核验` 或 `待核验`。

## 五、飞书入库

### 首次配置

```powershell
lark-cli config init --new
lark-cli auth login --recommend
lark-cli auth status
```

`config init` 和 `auth login` 可能会输出浏览器授权链接，需要用户手动完成授权。授权完成前，只能验证 CLI 能力和命令结构，不能声称已经写入飞书。

### 多维表格优先

优先使用飞书多维表格作为竞品数据库：

```powershell
lark-cli base --help
lark-cli base +table-list --help
lark-cli base +record-upsert --help
lark-cli base +record-batch-create --help
```

写入前先用 `record-search` 或本地去重表确认是否已有记录；已有记录时带 `--record-id` 使用 `record-upsert` 更新，没有记录时创建新记录。`record-upsert` 不会按业务键自动去重。若多维表格权限、字段类型或 token 参数暂时不清楚，退一步使用电子表格作为过渡表。

### 电子表格兜底

```powershell
lark-cli sheets --help
lark-cli sheets +workbook-create --help
lark-cli sheets +cells-set --help
lark-cli sheets +csv-put --help
```

电子表格用于先跑通“采集结果可以结构化入库”的最小闭环，后续再迁移到多维表格。

## 六、字段映射

| 飞书字段 | OpenCLI/核验来源 | 规则 |
|---|---|---|
| 平台 | 命令来源 | `小红书` / `抖音` |
| 关键词 | 采集命令 | 保留原始搜索词 |
| 标题/描述 | 搜索结果或详情页 | 优先详情页标题，其次搜索摘要 |
| 作者 | 搜索结果或详情页 | 缺失则标 `未知` |
| 链接 | 搜索结果 URL | 必填，用于主去重键 |
| 发布时间 | 详情页字段 | 缺失则留空，不猜测 |
| 点赞数 | OpenCLI/Chrome | 小红书可用 OpenCLI；抖音关键样本需核验 |
| 收藏数 | OpenCLI/Chrome | 缺失则留空 |
| 评论数 | OpenCLI/Chrome | 小红书可结合 comments；抖音需谨慎 |
| 转发/分享数 | OpenCLI/Chrome | 抖音字段不可靠时标待核验 |
| 评论样本 | `comments` 输出 | 取 3-5 条高信息量评论 |
| 内容属性 | 人工/模型分类 | 真实宠物 / IP人设 / 商业种草 / 教程 / 搬运 / 不相关 |
| IP方向标签 | 人工/模型分类 | 例如打工猫、治愈陪伴、反差萌、宠物知识 |
| 情绪/共鸣点 | 评论与内容判断 | 用短语，不写长段 |
| 可借鉴点 | 内容拆解 | 钩子、封面、叙事、评论引导等 |
| 风险点 | 合规与内容判断 | 搬运、诱导互动、过度商业、素材版权等 |
| 采集时间 | 当前时间 | Asia/Shanghai ISO 或 `YYYY-MM-DD HH:mm` |
| 数据可信度 | 采集方式 | OpenCLI / Chrome核验 / 手动补录 / 待核验 |
| 采集方式 | 实际路径 | OpenCLI / Chrome核验 / 手动补录 |

## 七、去重规则

1. 主键：`平台 + 链接`。
2. 链接缺失时用 `平台 + 标题/描述 + 作者 + 发布时间`。
3. 已存在记录只更新互动字段、评论样本、采集时间和数据可信度；不覆盖人工分类、可借鉴点和风险点，除非用户明确要求。

## 八、分类与评分

### 内容属性

| 分类 | 判定标准 |
|---|---|
| 真实宠物 | 以真实猫狗日常、实拍互动为主 |
| IP人设 | 明确拟人设定、固定角色、系列化表达 |
| 商业种草 | 商品、店铺、团购、佣金导向明显 |
| 教程 | 宠物知识、拍摄剪辑、养护方法 |
| 搬运 | 疑似二传、混剪、无原创说明 |
| 不相关 | 与猫猫 IP 或目标赛道无关 |

### 评分维度

每项 1-5 分，输出总分和一句理由：

| 维度 | 高分标准 |
|---|---|
| 互动强度 | 赞藏评分享相对同类样本明显高 |
| 评论情绪 | 评论有真实共鸣、二创欲、转发理由 |
| IP可迁移性 | 能转化为“阿饱/打工橘猫”等原创角色表达 |
| 制作难度 | 低成本、可批量、可复用模板 |
| 商业痕迹风险 | 分数越高代表风险越低 |

## 九、Chrome 兜底规则

- 只用于登录态确认、详情页视觉核验、OpenCLI 不完整字段的单条补采。
- 不做批量浏览器抓取，不绕过验证码、登录、风控或访问限制。
- 不读取、导出、保存 cookie、token、localStorage 或其他敏感凭据。
- 不执行点赞、评论、关注、私信、发布等写操作。

## 十、失败处理

| 场景 | 处理 |
|---|---|
| OpenCLI 搜索失败 | 降低 limit 重试一次；仍失败则记录失败原因，不换成批量浏览器抓取 |
| 小红书详情缺少 `xsec_token` | 要求提供完整链接，或只保留搜索级字段 |
| 抖音互动字段为 0 | 标 `待核验`，关键样本用 Chrome 单条核验 |
| `lark-cli auth status` 未配置 | 提示运行 `lark-cli config init --new` 和 `lark-cli auth login --recommend` |
| 飞书写入失败 | 保留本地结构化结果摘要，说明错误，不声称入库成功 |

## 十一、下游交接

完成一次采集后，向编排器输出：

- 采集关键词、平台、样本量、入库位置。
- 高分样本 Top 3 与原因。
- 数据可信度分布：OpenCLI / Chrome核验 / 手动补录 / 待核验。
- 对 `01-账号策略维护` 和 `02-选题推荐` 的建议：哪些方向值得验证，哪些方向证据不足。



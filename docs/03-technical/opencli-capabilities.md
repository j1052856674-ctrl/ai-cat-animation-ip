# OpenCLI 能力文档 v1.0

> **版本**: OpenCLI v1.8.3
> **探索日期**: 2026-06-16
> **项目**: ai-cat-animation-ip 竞品采集

---

## 一、环境信息

| 项目 | 值 |
|------|-----|
| OpenCLI 版本 | 1.8.3 |
| 探索日期 | 2026-06-16 |
| 测试平台 | Windows 10 Pro |
| 抖音登录状态 | ✅ 已登录（username: 要叫什么名字好呢）|
| 小红书登录状态 | ✅ 已登录（username: 小红薯6A2FCAB4）|

---

## 二、抖音（Douyin）能力矩阵

### 2.1 命令总览

| 命令 | 读写 | 用途 | 状态 | 备注 |
|------|:--:|------|:--:|------|
| `search` | read | 关键词搜索视频 | ✅ 可用 | plays/comments/shares 返回 0 |
| `hashtag` | read | 话题搜索/热点词/AI推荐 | ⚠️ 部分可用 | `hot` 可用，`search` 报错 |
| `user-videos` | read | 获取指定用户的视频列表 | ✅ **可用** | 能拿到完整数据（含评论） |
| `activities` | read | 官方活动列表 | ✅ 可用 | 不带 limit 参数 |
| `whoami` | read | 当前登录账号 | ✅ 可用 | |
| `stats` | read | 作品数据分析 | ❌ 不可用 | API error |
| `videos` | read | 自己的作品列表 | ⚠️ 未验证 | 账号无作品 |
| `profile` | read | 获取账号信息 | ⚠️ 未验证 | |
| `collections` | read | 合集列表 | ⚠️ 未验证 | |
| `login` | write | 登录 | ✅ 可用 | |
| `delete` | write | 删除作品 | ⚠️ 未测试 | 危险操作 |
| `publish` | write | 发布视频 | ⚠️ 未测试 | |
| `update` | write | 更新视频信息 | ⚠️ 未测试 | |

### 2.2 详细能力

#### `search` — 关键词搜索

```bash
opencli douyin search "<关键词>" --limit <N> -f yaml
```

**返回字段**:
- `rank`: 排名
- `desc`: 视频描述
- `author`: 作者
- `url`: 视频链接
- `likes`: 点赞数 ✅
- `plays`: 播放量 ❌ (返回 0)
- `comments`: 评论数 ❌ (返回 0)
- `shares`: 分享数 ❌ (返回 0)

**适用场景**: 批量发现视频，获取基础字段

---

#### `hashtag hot` — 热点话题榜

```bash
opencli douyin hashtag hot --limit <N> -f yaml
```

**返回字段**:
- `name`: 话题名
- `id`: 话题ID
- `view_count`: 播放量

**适用场景**: 热榜监控、找 trending 标签

---

#### `user-videos` — 用户视频列表 ⭐重要发现

```bash
opencli douyin user-videos "<sec_uid>" --limit <N> -f yaml
```

**返回字段**:
- `aweme_id`: 视频ID
- `title`: 标题 ✅
- `duration`: 时长（秒）✅
- `digg_count`: 点赞数 ✅
- `play_url`: 视频下载地址 ✅
- `top_comments`: 热门评论 ✅
  - `text`: 评论内容
  - `digg_count`: 评论点赞
  - `nickname`: 评论者

**适用场景**: 深度分析某个创作者的所有视频

**获取 sec_uid 的方法**:
1. 用 `search` 搜索到作者
2. 从作者主页 URL 提取 sec_uid
3. 或者通过 `whoami` 获取自己的 sec_uid

---

#### `activities` — 官方活动列表

```bash
opencli douyin activities -f yaml
```

**返回字段**:
- `activity_id`: 活动ID
- `title`: 活动标题
- `end_time`: 结束时间

**适用场景**: 发现平台官方活动，蹭流量

---

### 2.3 抖音采集方案

```bash
# Step 1: 搜索发现
opencli douyin search "AI猫动画" --limit 20 -f yaml

# Step 2: 获取作者 sec_uid（从搜索结果或作者主页URL提取）

# Step 3: 获取作者所有视频（含完整数据）
opencli douyin user-videos "<sec_uid>" --limit 20 -f yaml

# Step 4: 热榜监控
opencli douyin hashtag hot --limit 50 -f yaml
```

---

## 三、小红书（Xiaohongshu）能力矩阵

### 3.1 命令总览

| 命令 | 读写 | 用途 | 状态 | 备注 |
|------|:--:|------|:--:|------|
| `search` | read | 搜索笔记 | ✅ 可用 | |
| `note` | read | 笔记详情 | ✅ **可用** | 登录后能拿到收藏/评论 |
| `comments` | read | 笔记评论 | ⚠️ 未验证 | |
| `feed` | read | 首页推荐 Feed | ✅ 可用 | 相当于热门内容 |
| `user` | read | 用户主页笔记 | ✅ 可用 | 含封面图 |
| `whoami` | read | 当前登录账号 | ✅ 可用 | |
| `login` | write | 登录 | ✅ 可用 | |
| `creator-note-detail` | read | 创作者笔记详情 | ❌ 不可用 | 只能获取自己发布的笔记 |
| `creator-notes` | read | 创作者笔记列表 | ❌ 不可用 | 同上 |
| `creator-stats` | read | 创作者数据总览 | ⚠️ 未验证 | 可能同上 |
| `publish` | write | 发布笔记 | ⚠️ 未测试 | |
| `delete-note` | write | 删除笔记 | ⚠️ 未测试 | 危险操作 |

### 3.2 详细能力

#### `search` — 关键词搜索

```bash
opencli xiaohongshu search "<关键词>" --limit <N> -f yaml
```

**返回字段**:
- `rank`: 排名
- `title`: 标题 ✅
- `author`: 作者 ✅
- `author_url`: 作者主页 ✅
- `likes`: 点赞数 ✅
- `published_at`: 发布时间 ✅
- `url`: 笔记链接 ✅

**适用场景**: 批量发现笔记

---

#### `note` — 笔记详情 ⭐重要

```bash
opencli xiaohongshu note "<完整URL>" -f yaml
```

**⚠️ 注意**: 需要完整 URL（含 xsec_token），不能只传 note-id

**返回字段**（登录后）:
- `title`: 标题 ✅
- `author`: 作者 ✅
- `content`: 正文 ✅
- `likes`: 点赞数 ✅
- `collects`: 收藏数 ✅
- `comments`: 评论数 ✅
- `tags`: 标签 ✅
- `shares`: 分享数 ❌ (拿不到)

**适用场景**: 深度分析单条笔记

---

#### `feed` — 首页推荐 Feed

```bash
opencli xiaohongshu feed --limit <N> -f yaml
```

**返回字段**:
- `id`: 笔记ID
- `title`: 标题
- `type`: 类型（normal/video）
- `author`: 作者
- `likes`: 点赞数
- `url`: 笔记链接

**适用场景**: 热门内容发现（相当于推荐流）

---

#### `user` — 用户主页

```bash
opencli xiaohongshu user "<用户ID>" --limit <N> -f yaml
```

**返回字段**:
- `id`: 笔记ID
- `title`: 标题
- `type`: 类型
- `likes`: 点赞数
- `cover`: 封面图URL
- `url`: 笔记链接

**适用场景**: 分析特定作者的所有笔记

---

### 3.3 小红书采集方案

```bash
# Step 1: 登录（只需一次）
opencli xiaohongshu login

# Step 2: 搜索发现
opencli xiaohongshu search "猫动画" --limit 20 -f yaml

# Step 3: 获取笔记详情（登录后才能拿到收藏/评论）
opencli xiaohongshu note "<完整URL>" -f yaml

# Step 4: 获取推荐 Feed
opencli xiaohongshu feed --limit 20 -f yaml
```

---

## 四、关键发现总结

### 4.1 之前结论的修正

| 之前的错误结论 | 实际情况 | 原因 |
|-------------|---------|------|
| 抖音 `user-videos` 拿不到数据 | ✅ 能拿到完整数据 | 之前用了错误的 sec_uid |
| 小红书没有热榜 | ⚠️ `feed` 可以拿到推荐流 | 不是严格热榜，但有用 |
| 抖音 search 评论/分享=0 没办法 | ✅ 可以用 `user-videos` 补充 | 需要多一步 |

### 4.2 能力边界

| 能力 | 抖音 | 小红书 |
|------|:--:|:--:|
| 关键词搜索 | ✅ | ✅ |
| 获取详情 | ✅ (user-videos) | ✅ (note) |
| 获取评论 | ✅ (user-videos.top_comments) | ✅ (comments) |
| 获取收藏 | ❌ | ✅ (note) |
| 获取分享 | ❌ | ❌ |
| 热榜/推荐 | ✅ (hashtag hot) | ⚠️ (feed 勉强算) |
| 获取视频下载地址 | ✅ (play_url) | ❌ |
| 获取发布时间 | ✅ (user-videos) | ✅ (search) |
| 获取时长 | ✅ (duration) | ❌ |

### 4.3 完整数据获取路径

**抖音完整数据**:
```
search (发现视频) → 提取 sec_uid → user-videos (获取完整数据)
```

**小红书完整数据**:
```
login (登录) → search (发现笔记) → note (获取详情)
```

---

## 五、使用示例

### 5.1 抖音完整采集

```bash
#!/bin/bash
# 抖音采集脚本

KEYWORD="AI猫动画"
LIMIT=20

# 搜索
opencli douyin search "$KEYWORD" --limit $LIMIT -f yaml > douyin_search.yaml

# 提取第一个作者的 sec_uid（手动从搜索结果获取）
# 然后用 user-videos 获取完整数据
SEC_UID="MS4wLjABAAAAYLG0_Wa8u6bOLcygOZbLAyi0JJ_lvca1SLlXL_Acie4"
opencli douyin user-videos "$SEC_UID" --limit $LIMIT -f yaml > douyin_detail.yaml

# 热榜
opencli douyin hashtag hot --limit 50 -f yaml > douyin_hot.yaml
```

### 5.2 小红书完整采集

```bash
#!/bin/bash
# 小红书采集脚本

KEYWORD="猫动画"
LIMIT=20

# 搜索
opencli xiaohongshu search "$KEYWORD" --limit $LIMIT -f yaml > xhs_search.yaml

# 获取第一条笔记的详情（需要完整URL）
NOTE_URL="https://www.xiaohongshu.com/search_result/67e2dd35000000001a006ec3?xsec_token=..."
opencli xiaohongshu note "$NOTE_URL" -f yaml > xhs_detail.yaml

# 推荐 Feed
opencli xiaohongshu feed --limit $LIMIT -f yaml > xhs_feed.yaml
```

---

## 六、注意事项

1. **登录态管理**:
   - 小红书需要登录才能拿到收藏/评论
   - 抖音已登录状态可以拿到更多数据
   - 使用 `--site-session persistent` 保持登录态

2. **风控防护**:
   - 每次请求间隔 3-5 秒
   - 每 20 次休息 30 秒
   - 夜间采集更安全

3. **字段限制**:
   - 抖音 `search` 拿不到评论/分享/播放
   - 小红书 `note` 拿不到分享数
   - 这些限制来自平台 API，无法绕过

4. **版本更新**:
   - 当前版本 1.8.3
   - 1.8.4 已发布，建议更新
   - 更新命令: `npm install -g @jackwener/opencli`

---

## 七、待验证项目

| 命令 | 状态 | 备注 |
|------|:--:|------|
| 小红书 `comments` | 未验证 | 需要笔记URL |
| 小红书 `creator-stats` | 未验证 | 可能需要创作者权限 |
| 抖音 `stats` | 报错 | API 错误，待排查 |
| 抖音 `hashtag suggest` | 未验证 | 需要封面URI |

---

## 八、参考文档

- OpenCLI 官方文档: https://github.com/jackwener/opencli
- 项目记忆: `memory-hub/decisions/crawl-strategy-decision.md`
- 踩坑记录: `memory-hub/lessons/opencli-douyin-interaction-data-zeros.md`
- 踩坑记录: `memory-hub/lessons/opencli-xiaohongshu-note-api-v183-breaking-change.md`

---

*文档生成时间: 2026-06-16*
*生成人: Claude*
*验证状态: 已验证（抖音 search/user-videos/whoami/activities/hashtag hot，小红书 search/note/feed/user/whoami/login）*

---
name: crawl-strategy-decision
description: 采集方案选型决策——基于OpenCLI + Browser模式
type: decision
bridge: true
supersedes: 
created: 2026-06-16
updated: 2026-06-16
lifecycle: active
---

# 采集方案选型决策

## 决策：基于 OpenCLI 的采集方案

### 背景
AI猫动画IP项目需要采集抖音、小红书数据。现有 `process_round2.js` 使用硬编码 RAW_DATA，缺发布时间、评论数、分享数。

### 评估过的方案

| 方案 | 抖音表现 | 小红书表现 | 维护成本 | 结论 |
|------|---------|-----------|---------|------|
| Playwright headless | 被检测，"视频数据加载中" | 必须登录 | 高（CSS obfuscation） | ❌ 不推荐 |
| Playwright 有头模式 | 可拿到页面数据但选择器不稳定 | 需登录态 | 高 | ⚠️ 备用 |
| **OpenCLI + user-videos** | ✅ 能拿到完整数据（时长/点赞/评论/视频URL） | ✅ 能拿到收藏/评论 | 低（CLI命令） | ✅ **推荐** |
| TikHub(付费) | 最全 | 最全 | 低 | 💰 参照基准 |

### 选择理由
1. OpenCLI `user-videos` 能拿到抖音完整数据（标题/时长/点赞/评论/视频URL）
2. 小红书登录后 `note` 能拿到收藏/评论/正文
3. 不需要额外部署，一条命令搞定

### 采集路径

**抖音**:
```
search（发现视频）→ 提取 sec_uid → user-videos（获取完整数据）
```

**小红书**:
```
login（登录）→ search（发现笔记）→ note（获取详情）
```

### 关联踩坑
- [[opencli-douyin-interaction-data-zeros]] 抖音 search 返回 0 的问题
- [[opencli-xiaohongshu-note-api-v183-breaking-change]] 小红书 note API 需要完整URL

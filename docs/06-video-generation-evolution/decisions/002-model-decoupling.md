# 决策 002：脚本/图片/视频模型解耦独立

> **状态**：已确认
> **日期**：2026-06-30
> **影响范围**：Skill 架构、模型选择、成本结构

---

## 背景

libtv 的画布支持 text/image/video 节点，但每个节点绑定的模型（如 GVLM 3.1、LibNano Pro、Seedance 2.0）在各自领域并非最佳选择：
- 脚本生成：GVLM 3.1 < Claude/GPT-4o
- 图片生成：LibNano Pro < Midjourney/FLUX
- 视频生成：Seedance 2.0 ✅ 优秀

## 决策

**脚本生成、图片生成、视频生成各自独立为 Skill，通过配置选择最佳模型。视频生成保留在 libtv，脚本和图片独立。**

## 理由

| 能力 | 独立后模型 | 优势 |
|---|---|---|
| **脚本生成** | Claude / GPT-4o | 创意质量远超 libtv 内置 text model |
| **图片生成** | Midjourney / FLUX / DALL-E 3 | 视觉质量远超 libtv 内置 image model |
| **视频生成** | Seedance 2.0（libtv） | 本身就是第一梯队 |

## 架构

```
Claude/GPT 写脚本 ────┐
                       │
Midjourney/FLUX 生图 ──┼──▶ libtv 画布 ──▶ 视频生成
                       │
Seedance 2.0（libtv）──┘
```

## 影响

- **架构复杂度**：增加 Selector + Provider Registry 层
- **维护成本**：需维护多个模型的 API key
- **灵活性**：大幅提升，可随时切换更优模型

## 下一步

1. 设计 Provider Registry 架构
2. 实现 ModelSelector
3. 改造 script-creation / image-generation / video-generation Skill

---

*最后更新：2026-06-30*

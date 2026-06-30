# 02-架构设计

> **设计原则**：模型与 Skill 解耦、配置驱动、快速切换、成本透明、效果可对比

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                      content-ops Skill                       │
│                      （总控 / 调度层）                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Selector  │    │   Selector  │    │   Selector  │
│   (脚本)     │    │   (图片)     │    │   (视频)     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Provider    │    │ Provider    │    │ Provider    │
│ Registry    │    │ Registry    │    │ Registry    │
│ (脚本模型)   │    │ (图片模型)   │    │ (视频模型)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 三层架构

### 第一层：配置层（Configuration）

**作用**：定义所有可用模型及其参数，支持快速切换。

**文件**：
- `config/models.yaml`：模型注册表
- `config/presets.yaml`：预设策略

**核心设计**：
- 新增/修改模型只需改 YAML，无需改代码
- 支持环境变量覆盖
- 支持 A/B 测试配置

### 第二层：Selector 层（Selection）

**作用**：根据策略自动选择最佳模型。

**文件**：
- `lib/selector.py`：ModelSelector 类

**核心设计**：
- 支持多种策略：cost-effective / quality / speed / ab-test
- 主模型不可用时自动降级到 fallback
- 支持模型健康检查

### 第三层：Provider 层（Provider）

**作用**：封装具体模型的调用逻辑。

**文件**：
- `lib/providers/base_provider.py`：抽象基类
- `lib/providers/claude_provider.py`：Claude
- `lib/providers/openai_provider.py`：OpenAI
- `lib/providers/libtv_provider.py`：LibTV
- ...

**核心设计**：
- 统一接口（generate / health_check / estimate_cost）
- 自动处理 API key
- 统一错误处理

---

## 关键数据流

### 完整工作流

```
Phase 1: 脚本生成（script-creation Skill）
    │
    │ 调用 Claude/GPT 生成脚本
    ▼
脚本大纲（script-outline.json）
    │
    ▼
Phase 2: 图片生成（image-generation Skill）
    │
    │ 调用 Midjourney/FLUX 生成猫形象图
    ▼
图片（cat-hero.png）
    │
    ▼
Phase 3: 视频生成（video-generation Skill）
    │
    │ 调用 libtv 图生视频（singleImage2video）
    ▼
原始视频（raw.mp4）
    │
    ▼
Phase 4: 视频合成（remotion-compose Skill）
    │
    │ 调用 Remotion 添加字幕、封面、片尾
    ▼
成品视频（final.mp4）
    │
    ▼
Phase 5: 飞书 Gatekeeper 审核
    │
    ▼
Phase 6: 发布
```

---

## 与 libtv 的集成

### libtv 的角色

libtv 不是唯一的生成工具，而是**视频生成引擎 + 工作流编排器**。

| 能力 | 是否留在 libtv | 理由 |
|---|---|---|
| 脚本生成 | ❌ 独立 | Claude/GPT 比 libtv 内置 text model 好得多 |
| 图片生成 | ❌ 独立 | Midjourney/FLUX 比 libtv 内置 image model 好 |
| 视频生成 | ✅ 保留 | Seedance 2.0 图生视频是核心优势 |
| 工作流编排 | ✅ 保留 | 画布连线能力无法替代 |

### 数据流：外部模型 → libtv 画布

```
Claude 脚本 ──────┐
                 │
Midjourney 图片 ──│──▶ libtv 画布 ──▶ 视频生成
                 │
FLUX 图片 ───────┘
```

**关键命令**：
```bash
# 1. 上传外部图片到 libtv 画布
libtv upload "猫形象" -t image --resource ./cat.png

# 2. 创建 script 节点，写入外部脚本
libtv node "脚本" -t script -u rows='[...]'

# 3. 创建 video 节点，引用上游
libtv node create "视频" -t video \
    --left "脚本" --left "猫形象" \
    --set "model=Seedance 2.0" \
    --set "modeType=singleImage2video" \
    --run
```

---

## 核心组件

### 1. ModelSelector

```python
class ModelSelector:
    def select(self, task_type: str, strategy: SelectionStrategy = None) -> SelectionResult:
        """根据策略选择最佳模型"""
        pass
    
    def select_ab_test(self, task_type: str) -> SelectionResult:
        """A/B 测试模式：选择多个候选模型"""
        pass
    
    def fallback(self, task_type: str, failed_model: str) -> str:
        """主模型失败时自动降级"""
        pass
```

### 2. Provider Registry

```python
class ProviderRegistry:
    def register(self, provider: BaseProvider):
        """注册 Provider"""
        pass
    
    def get(self, name: str) -> BaseProvider:
        """获取指定 Provider"""
        pass
    
    def list_available(self, task_type: str) -> List[BaseProvider]:
        """列出某任务类型下所有可用 Provider"""
        pass
```

### 3. BaseProvider

```python
class BaseProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> GenerationResult:
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        pass
    
    @abstractmethod
    def estimate_cost(self, **kwargs) -> float:
        pass
```

---

## 配置示例

### models.yaml

```yaml
script_providers:
  - name: claude-3-5-sonnet
    provider: anthropic
    cost_per_1k_output: 0.015
    api_key_env: ANTHROPIC_API_KEY

  - name: gpt-4o-mini
    provider: openai
    cost_per_1k_output: 0.0006
    api_key_env: OPENAI_API_KEY

image_providers:
  - name: midjourney-v6
    provider: midjourney
    cost_per_image: 0.1
    api_key_env: MIDJOURNEY_API_KEY

  - name: flux-schnell
    provider: fal
    cost_per_image: 0.003
    api_key_env: FAL_KEY

video_providers:
  - name: libtv-seedance2
    provider: libtv
    cost_per_video: 0.05
    api_key_env: LIBTV_API_KEY
```

### presets.yaml

```yaml
default:
  script: { primary: gpt-4o-mini, fallback: [claude-3-5-sonnet] }
  image: { primary: flux-schnell, fallback: [midjourney-v6] }
  video: { primary: libtv-seedance2, fallback: [] }

quality-first:
  script: { primary: claude-3-5-sonnet, fallback: [gpt-4o] }
  image: { primary: midjourney-v6, fallback: [flux-pro] }
  video: { primary: libtv-seedance2, fallback: [kling-api] }
```

---

## 快速切换

```bash
# 切换预设
export MODEL_PRESET=quality-first

# 临时覆盖模型
export SCRIPT_MODEL_OVERRIDE=claude-3-5-sonnet
export IMAGE_MODEL_OVERRIDE=midjourney-v6

# A/B 测试
export MODEL_PRESET=ab-test
```

---

## 核心优势

1. **模型解耦**：Skill 只定义能力，不绑定模型
2. **配置驱动**：一行 YAML 切换模型
3. **成本透明**：每个模型自带价格标签
4. **效果可对比**：A/B 测试，记录评分
5. **自动降级**：主模型失败时自动 fallback

---

*最后更新：2026-06-30*

---
name: content-ops 体系级验收合同
description: 内容运营 Skill 套件的体系级验收标准——路由、数据、交接、门禁、降级、安全、完成信号
scope: content-ops 套件整体
version: 1.0
created: 2026-06-14
---

# VC — 内容运营 Skill 套件验收合同

本文件定义 `skills/content-ops/` 体系级验收标准。所有模块（00-06）和入口（SKILL.md）实现后，必须通过以下全部检查项。

---

## 一、路由验收

### VC-ROUTE-01: 触发词全覆盖
**断言**：SKILL.md 声明的每条触发词均有对应路由目标模块，且目标模块存在。
**验证**：grep SKILL.md 路由表中的所有触发词 → 确认每条映射到 `modules/` 下的文件。
**失败时**：返回 `needs_retry`，缺失路由标注 `blocking_reason`。

### VC-ROUTE-02: 路由歧义不下沉
**断言**：当用户输入同时匹配多个模块时，总控列出匹配项让用户选择，不自动推断。
**验证**：输入"看看数据" → 总控输出含"竞品数据采集"和"发布复盘"两个选项的确认提示，而非直接调用任一模块。

### VC-ROUTE-03: 依赖缺失不强行执行
**断言**：缺少必需前置产物时，总控返回 `status: blocked` + `blocking_reason`，不降级跳过。
**验证**：无选题卡时说"写脚本" → 总控返回 blocked，引导先选题。
**验证**：无脚本时说"做封面" → 总控返回 blocked，引导先出脚本。

---

## 二、数据前置验收

### VC-DATA-01: 竞品数据优先于策略断言
**断言**：没有近期竞品采集数据时，不把 IP 方向（如"阿饱/打工橘猫"）当作已验证事实。选题推荐只能基于"待验证假设"输出。
**验证**：竞品采集样本为空时触发"推荐选题" → 选题卡注明"数据来源：待验证假设"而非"已验证方向"。

### VC-DATA-02: 竞品数据不足时先采集
**断言**：触发"推荐选题"但近期（7 天内）竞品样本不足阈值（小红书 10 条 + 抖音 10 条）时，总控先路由到 00-竞品数据采集，而非直接出选题。
**验证**：`content/竞品调研数据库.md` 近 7 天样本不足 → "推荐选题" → 总控提示"数据不足，先采集"并路由到 00。

### VC-DATA-03: 数据字段来源可追溯
**断言**：复盘所需的曝光量、播放量、点击率、完播率、前 3 秒留存等字段，在 `config/data-fields.yaml` 中有明确来源或标记 `not_available`。
**验证**：grep `data-fields.yaml` → 每个复盘字段均有 `source` 字段，非空。

---

## 三、上下游交接验收

### VC-HANDOFF-01: 选题卡格式契约
**断言**：02-选题推荐输出符合 `schemas/topic-card.schema.json`。
**验证**：选题推荐完成后 → 输出含全部 schema 必填字段（id、title、platforms、content_type、rationale、priority）。

### VC-HANDOFF-02: 脚本大纲格式契约
**断言**：03-脚本创作输出符合 `schemas/script-outline.schema.json`。
**验证**：脚本创作完成后 → 输出含 schema 必填字段。

### VC-HANDOFF-03: 封面方案格式契约
**断言**：04-封面包装输出符合 `schemas/cover-package.schema.json`。
**验证**：封面包装完成后 → 输出含 schema 必填字段。

### VC-HANDOFF-04: 竞品样本格式契约
**断言**：00-竞品数据采集输出符合 `schemas/competitor-sample.schema.json`。
**验证**：采集完成后 → 每条样本含必填字段（platform、search_keyword、author、link、published_at、collected_at、data_confidence）。

### VC-HANDOFF-05: 统一完成信号
**断言**：每个模块完成后，总控输出 result block 包含 `skill_run_id`、`status`、`outputs`、`next_step`、`blocking_reason`（当 status=blocked 时）。
**验证**：任意模块调用完成后 → 总控输出含上述全部字段。

### VC-HANDOFF-06: 竞品采集人类核验交接
**断言**：00 模块完成后 result block 包含 `human_action_required`（含 `action` 和 `estimated_time`），且人类核验字段（`_human_verify`）在飞书表格中为空/`待核验`。
**验证**：采集完成 → result block 有 human_action_required；飞书表格中 top-20 的 rhythm_type/hook_strategy/visual_style_confirmed/character_consistency/interaction_style/benchmark_judgment 为空或 `待核验`。

### VC-HANDOFF-07: 能力边界诚实
**断言**：00 模块搜索级标注中，🔴 维度（节奏类型、钩子策略、角色一致性）不填 Claude 推测值——只标 `待核验`。
**验证**：grep 写入飞书的 JSON 或本地输出 → `rhythm_type` / `hook_strategy` / `character_consistency` 的值均为 `待核验`。

---

## 四、新人期门禁验收

### VC-NEWBIE-01: 作品数 < 10 禁用复盘
**断言**：`content/历史作品数据库.md` 作品数 < 10 时，即使触发"复盘"，也不调用 05-发布复盘，而是降级为简单数据记录。
**验证**：作品数=5 时触发"复盘" → 总控输出 status: degraded，提示"新人期不启用复盘，使用简单数据记录"。

### VC-NEWBIE-02: 作品数 < 10 禁用策略维护
**断言**：作品数 < 10 时，即使触发"更新策略"，也不调用 01-账号策略维护。
**验证**：作品数=5 时触发"更新策略" → 总控输出 status: blocked 或 degraded，提示使用初版策略文档。

### VC-NEWBIE-03: 作品数=0 走最简路径
**断言**：作品数=0 + 首次使用 → 总控执行启动检查（模块 06-onboarding），产出最小可行第一条内容包，不要求完整工具链。
**验证**：空项目中说"我第一次使用" → 触发环境检查、content 文件初始化、基于 P0 方向的 3 条选题。

### VC-NEWBIE-04: 门禁解除自动提示
**断言**：作品数 >= 10 + Codex 数据管线跑通后，总控自动提示"可以启用复盘和策略维护了"。
**验证**：作品数达到 10 条后触发任意指令 → 总控在输出中包含门禁解除提示。

---

## 五、飞书不可用降级验收

### VC-FEISHU-01: 飞书不可用时降级不声称成功
**断言**：lark-cli 不可用时，00-竞品数据采集降级为本地存储，result block status 为 `degraded`，不声称"已入库飞书"。
**验证**：lark-cli 不可用时触发"竞品调研并入库" → 输出 status: degraded + warning: "飞书不可用，样本已保存到本地"。

### VC-FEISHU-02: 降级路径仍可产出可用数据
**断言**：飞书降级到本地后，采集的样本仍符合 `schemas/competitor-sample.schema.json`，下游模块可正常读取。
**验证**：降级采集后 → 检查 `content/竞品调研数据库.md` 中新增样本包含完整必填字段。

### VC-FEISHU-03: 复盘降级不影响后续
**断言**：05-发布复盘在数据不足或飞书不可用时降级为简单数据记录，但不阻塞下一个周期的选题触发。
**验证**：复盘降级后 → "推荐选题"仍可正常执行（使用已有 `content/` 数据）。

---

## 六、直接触发自引导验收

### VC-SELF-01: 03-脚本创作缺选题不卡死
**断言**：直接触发 03-脚本创作且无选题卡时，模块先提示并引导生成/选择选题卡，不直接失败。
**验证**：无选题卡时调用 03 → 模块输出"未找到选题卡，是否需要为你推荐选题？"，等待确认后路由到 02。

### VC-SELF-02: 04-封面包装缺脚本不卡死
**断言**：直接触发 04-封面包装且无脚本大纲时，模块先提示并引导生成脚本大纲，不直接失败。
**验证**：无脚本时调用 04 → 模块输出"未找到脚本大纲，是否需要先创作脚本？"，等待确认后路由到 03。

### VC-SELF-03: 总控入口仍为首选
**断言**：虽然模块支持直接触发自引导，但 SKILL.md 在入口处明确"单入口"原则，引导用户优先走总控。
**验证**：读 SKILL.md → 使用原则中包含"单入口"说明。

---

## 七、安全边界验收

### VC-SEC-01: 不自动发布
**断言**：任何模块完成后，总控不调用发布 API、不代用户提交内容到平台。
**验证**：全链路（选题→脚本→封面）完成 → 总控不输出"已发布"或等价声明，next_step 为"请手动发布"。

### VC-SEC-02: 不绕过平台授权
**断言**：OpenCLI、lark-cli、Chrome 等工具需要用户已授权，未授权时提示手动完成，不模拟登录。
**验证**：工具未授权时触发相关模块 → 总控输出 warning，不尝试调用工具。

### VC-SEC-03: 不生成违规内容
**断言**：不生成涉政、色情、暴力等违反平台社区规范的选题/文案。
**验证**：N/A（运行时人工抽查）。

### VC-SEC-04: 敏感信息脱敏
**断言**：result block 和日志中不输出完整 API Key、密码、私钥、令牌、个人隐私。
**验证**：grep result block → 无 `sk-`、`key=`、`secret=` 等敏感模式。

---

## 八、完成信号验收

### VC-SIGNAL-01: result block 始终输出
**断言**：每次模块执行完毕后，总控输出完整的 result block（见 SKILL.md 统一输出格式）。
**验证**：任意操作完成后 → 输出含 skill_run_id、status、outputs、next_step 字段。

### VC-SIGNAL-02: status 取值合法
**断言**：result block 的 status 只为 completed / degraded / blocked / needs_human 之一。
**验证**：检查所有模块的输出 → status 不在四值之一时报错。

### VC-SIGNAL-03: next_step 可执行
**断言**：result block 的 next_step 不是空字符串或占位符，而是可操作的下一步建议。
**验证**：任意操作完成后 → next_step 非空且不包含 "TODO"、"TBD" 等占位符。

---

## 验证检查清单

以下为一次性静态检查清单，实施完成后逐项勾选：

- [ ] VC-ROUTE-01: 所有触发词有对应模块
- [ ] VC-ROUTE-02: 路由歧义列出选项
- [ ] VC-ROUTE-03: 依赖缺失返回 blocked
- [ ] VC-DATA-01: 无数据时不声称已验证
- [ ] VC-DATA-02: 数据不足先采集
- [ ] VC-DATA-03: 数据字段来源可追溯
- [ ] VC-HANDOFF-01~04: 四种 schema 格式契约
- [ ] VC-HANDOFF-05: 统一完成信号
- [ ] VC-NEWBIE-01~04: 新人期四条门禁
- [ ] VC-FEISHU-01~03: 飞书降级三条
- [ ] VC-SELF-01~03: 直接触发自引导三条
- [ ] VC-SEC-01~04: 安全边界四条
- [ ] VC-SIGNAL-01~03: 完成信号三条

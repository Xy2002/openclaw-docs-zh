---
summary: >-
  Research notes: offline memory system for Clawd workspaces (Markdown
  source-of-truth + derived index)
read_when:
  - >-
    Designing workspace memory (~/.openclaw/workspace) beyond daily Markdown
    logs
  - Deciding: standalone CLI vs deep OpenClaw integration
  - Adding offline recall + reflection (retain/recall/reflect)
---
# 工作区记忆 v2（离线版）：研究笔记

目标：打造一种类似 Clawd 的工作区（`agents.defaults.workspace`，默认 `~/.openclaw/workspace`），其中“记忆”以每日一个 Markdown 文件的形式存储（`memory/YYYY-MM-DD.md`），外加一小部分稳定的文件（如 `memory.md`、`SOUL.md`）。

本文档提出了一种 **以离线为先** 的记忆架构。该架构将 Markdown 作为权威且可审查的事实来源，同时通过派生索引引入 **结构化回忆** 功能（搜索、实体摘要、置信度更新）。

## 为何需要改变？

当前的设置（每日一个文件）在以下方面表现出色：
- “仅追加”式日记记录
- 人工编辑
- 基于 Git 的持久性和可审计性
- 低门槛的记录方式（“直接写下来即可”）

但在以下方面存在不足：
- 高召回率检索（“我们对 X 做了什么决定？”、“我们上次尝试 Y 是什么时候？”）
- 以实体为中心的答案（“告诉我关于 Alice / The Castle / warelay 的信息”），而无需反复阅读大量文件
- 意见/偏好的稳定性（以及其变化时的证据支持）
- 时间约束（“2025 年 11 月期间哪些内容是真实的？”）和冲突解决

## 设计目标
- **离线优先**：无需网络即可运行；可在笔记本电脑或 Castle 上运行；无云依赖。
- **可解释性**：检索到的条目应可追溯至具体文件及位置，并与推理过程明确分离。
- **低仪式感**：日常记录仍采用 Markdown 格式，无需复杂的模式设计。
- **渐进式发展**：v1 版本仅使用 FTS 即可实用；语义/向量检索和图结构则为可选升级。
- **适合代理使用**：便于在有限的 token 预算内进行“回忆”，返回小批量的事实片段。

## 北斗星模型（Hindsight × Letta）
需要融合两部分内容：

1) **Letta/MemGPT 式控制循环**
- 维持一个小规模的“核心”始终处于上下文中（角色 + 关键用户事实）
- 其余内容均处于上下文之外，通过工具检索获取
- 记忆写入是显式的工具调用（追加/替换/插入），写入后持久化，并在下一轮中重新注入

2) **Hindsight 式记忆基底**
- 区分观察到的内容、所相信的内容和总结的内容
- 支持保留/回忆/反思
- 带有置信度的意见，可随证据变化而演变
- 实体感知的检索 + 时间查询（即使没有完整的知识图谱）

## 拟议架构（Markdown 事实源 + 派生索引）
### 规范存储（兼容 Git）
将 `~/.openclaw/workspace` 作为规范的人类可读记忆。

建议的工作区布局如下：

```
~/.openclaw/workspace/
  memory.md                    # small: durable facts + preferences (core-ish)
  memory/
    YYYY-MM-DD.md              # daily log (append; narrative)
  bank/                        # “typed” memory pages (stable, reviewable)
    world.md                   # objective facts about the world
    experience.md              # what the agent did (first-person)
    opinions.md                # subjective prefs/judgments + confidence + evidence pointers
    entities/
      Peter.md
      The-Castle.md
      warelay.md
      ...
```

注意事项：
- **每日日志保持每日日志格式**。无需将其转换为 JSON。
- `bank/` 文件由反思作业生成并经过精心编纂，但仍可手动编辑。
- `memory.md` 保持“小而核心”：这些是你希望 Clawd 在每次会话中都能看到的内容。

### 派生存储（机器回忆）
在工作区内添加一个派生索引（不一定纳入 Git 跟踪）：

```
~/.openclaw/workspace/.memory/index.sqlite
```

后端支持：
- SQLite 模式用于存储事实 + 实体链接 + 意见元数据
- SQLite **FTS5** 用于词汇检索（快速、轻量、离线）
- 可选的嵌入表用于语义检索（同样离线）

该索引始终可以 **从 Markdown 重建**。

## 保留 / 回忆 / 反思（操作循环）
### 保留：将每日日志规范化为“事实”
Hindsight 的关键洞见在此处至关重要：存储 **叙事性强、自成一体的事实**，而非细碎的片段。

适用于 `memory/YYYY-MM-DD.md` 的实用规则：
- 在一天结束时（或过程中），添加一个 `## Retain` 部分，包含 2–5 条要点，要求：
  - 具备叙事性（跨轮次上下文得以保留）
  - 自成一体（单独存在时也具有意义）
  - 标注类型及提及的实体

示例：

```
## Retain
- W @Peter: Currently in Marrakech (Nov 27–Dec 1, 2025) for Andy’s birthday.
- B @warelay: I fixed the Baileys WS crash by wrapping connection.update handlers in try/catch (see memory/2025-11-27.md).
- O(c=0.95) @Peter: Prefers concise replies (&lt;1500 chars) on WhatsApp; long content goes into files.
```

最低限度的解析：
- 类型前缀：`W`（世界）、`B`（经验/传记）、`O`（意见）、`S`（观察/总结；通常由系统生成）
- 实体：`@Peter`、`@warelay` 等（别名映射到 `bank/entities/*.md`）
- 意见置信度：`O(c=0.0..1.0)` 为可选项

若不希望作者费心思考，反思作业可以从日志的其余部分推断出这些要点，但显式设置 `## Retain` 部分是最简单的“质量杠杆”。

### 回忆：对派生索引的查询
回忆功能应支持：
- **词汇检索**：“查找精确术语/名称/命令”（FTS5）
- **实体检索**：“告诉我关于 X 的信息”（实体页面 + 实体关联的事实）
- **时间检索**：“11 月 27 日前后发生了什么”/“自上周以来”
- **意见检索**：“Peter 更倾向于什么？”（附带置信度和证据）

返回格式应适合代理使用，并注明来源：
- `kind`（引用编号）
- `world|experience|opinion|observation`（来源日期，或提取的时间范围）
- `timestamp`（实体）
- `entities`（叙事性事实）
- `["Peter","warelay"]`（相关证据 ID）

### 反思：生成稳定页面并更新信念
反思是一项定时任务（每日或心跳触发的 `ultrathink`），其功能包括：
- 根据近期事实更新 `bank/entities/*.md`（实体摘要）
- 根据强化或矛盾信息更新 `bank/opinions.md` 的置信度
- 可选地为 `memory.md` 提出编辑建议（“核心”持久性事实）

意见演变（简单且可解释）：
- 每个意见包含：
  - 表述
  - 置信度 `c ∈ [0,1]`
  - 最后更新时间
  - 证据链接（支持性和矛盾性事实的 ID）
- 当新事实到来时：
  - 通过实体重叠和相似性找到候选意见（先用 FTS，再用嵌入）
  - 置信度以小幅度调整；大幅波动需有强有力的矛盾证据和重复证据的支持

## CLI 集成：独立运行 vs 深度集成
建议：在 OpenClaw 中实现 **深度集成**，但保留一个可分离的核心库。

### 为何要集成到 OpenClaw？
- OpenClaw 已经知道：
  - 工作区路径（`agents.defaults.workspace`）
  - 会话模型 + 心跳机制
  - 日志记录 + 故障排除模式
- 你希望代理本身能够调用这些工具：
  - `openclaw memory recall "…" --k 25 --since 30d`
  - `openclaw memory reflect --since 7d`

### 为何仍需拆分库？
- 使记忆逻辑可以在没有网关/运行时的情况下进行测试
- 可在其他场景中复用（本地脚本、未来的桌面应用等）

形态：
记忆工具旨在成为一个小型 CLI + 库层，但这目前仍处于探索阶段。

## “S-Collide” / SuCo：何时使用（研究）
如果“S-Collide”指的是 **SuCo（子空间碰撞）**：这是一种 ANN 检索方法，通过在子空间中使用学习到的/结构化的碰撞来实现强召回与延迟之间的权衡（论文：arXiv 2411.14754，2024）。

针对 `~/.openclaw/workspace` 的务实建议：
- 不要一开始就使用 SuCo。
- 从 SQLite FTS +（可选）简单嵌入开始；你很快就能获得大部分用户体验上的收益。
- 只有在以下情况下才考虑 SuCo/HNSW/ScaNN 类解决方案：
  - 语料库规模庞大（数万甚至数十万块）
  - 使用暴力嵌入搜索变得过于缓慢
  - 召回质量明显受词汇检索的限制

离线友好的替代方案（按复杂度递增）：
- SQLite FTS5 + 元数据过滤器（无需机器学习）
- 嵌入 + 暴力搜索（如果块数较少，效果出人意料的好）
- HNSW 索引（常见且稳健；需要库绑定）
- SuCo（研究级；如果有可靠的实现可供嵌入，则颇具吸引力）

开放问题：
- 对于你的设备（笔记本电脑 + 台式机），哪种 **最佳** 离线嵌入模型适用于“个人助理记忆”？
  - 如果你已经使用 Ollama：使用本地模型进行嵌入；否则，在工具链中内置一个小规模的嵌入模型。

## 最小可用试点
如果你想要一个最小但仍然有用的版本：

- 在每日日志中添加 `bank/` 实体页面和一个 `## Retain` 部分。
- 使用 SQLite FTS 进行带引用的回忆（路径 + 行号）。
- 仅在召回质量和规模有更高要求时才添加嵌入。

## 参考文献
- Letta / MemGPT 概念： “核心内存块” + “归档内存” + 工具驱动的自我编辑内存。
- Hindsight 技术报告： “保留 / 回忆 / 反思”，四网络内存，叙事性事实提取，意见置信度演变。
- SuCo：arXiv 2411.14754（2024）：“子空间碰撞”近似最近邻检索。

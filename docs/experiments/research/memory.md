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

目标：采用 Clawd 风格的工作区（`agents.defaults.workspace`，默认 `~/.openclaw/workspace`），其中“记忆”以每天一个 Markdown 文件的形式存储（`memory/YYYY-MM-DD.md`），外加一小批稳定的文件（如 `memory.md`、`SOUL.md`）。

本文档提出了一种**以离线为先**的记忆架构。该架构将 Markdown 作为权威且可审查的真相来源，同时通过派生索引引入**结构化回忆**功能（搜索、实体摘要、置信度更新）。

## 为何需要改变？

当前的设置（每天一个文件）在以下方面表现出色：
- “仅追加”式日记记录
- 人工编辑
- 基于 Git 的持久性和可审计性
- 低摩擦捕获（“只需随手记下”）

但在以下方面存在不足：
- 高召回率检索（“我们对 X 做了什么决定？”、“我们上次尝试 Y 是什么时候？”）
- 无需重读大量文件即可获得以实体为中心的答案（“告诉我关于 Alice / The Castle / warelay 的信息”）
- 观点/偏好的稳定性（以及其变化时的证据）
- 时间约束（“2025 年 11 月期间什么是真实的？”）和冲突解决

## 设计目标
- **离线**：无需网络即可运行；可在笔记本电脑或 Castle 上运行；无云依赖。
- **可解释**：检索到的条目应可追溯来源（文件 + 位置），并与推理过程明确分离。
- **低仪式感**：日常记录仍采用 Markdown 格式，无需复杂的模式设计。
- **渐进式**：v1 版本仅使用 FTS 即可实用；语义/向量和图谱是可选升级。
- **代理友好**：使“在标记预算内进行回忆”变得容易（返回小批量的事实）。

## 北斗星模型（Hindsight × Letta）
需要融合两部分：

1) **Letta/MemGPT 式控制回路**
- 保持一个小“核心”始终处于上下文中（角色 + 关键用户事实）
- 其余内容均处于上下文之外，并通过工具检索
- 记忆写入是显式的工具调用（追加/替换/插入），持久化后在下一回合重新注入

2) **Hindsight 式记忆基质**
- 区分观察到的内容、所相信的内容和总结的内容
- 支持保留/回忆/反思
- 带有置信度的观点，可随证据演变
- 实体感知的检索 + 时间查询（即使没有完整的知识图谱）

## 拟议架构（Markdown 真相源 + 派生索引）
### 规范存储（适合 Git）
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
- **每日日志仍是每日日志**。无需将其转换为 JSON。
- `bank/` 文件是**精选的**，由反思作业生成，但仍可手动编辑。
- `memory.md` 保持“小而核心”：这些是你希望 Clawd 在每个会话中看到的内容。

### 派生存储（机器回忆）
在工作区内添加一个派生索引（不一定由 Git 跟踪）：

```
~/.openclaw/workspace/.memory/index.sqlite
```

支持：
- 用于事实 + 实体链接 + 观点元数据的 SQLite 模式
- 用于词汇回忆的 SQLite **FTS5**（快速、轻量、离线）
- 可选的嵌入表用于语义回忆（仍离线）

该索引始终可以**从 Markdown 重建**。

## 保留 / 回忆 / 反思（操作循环）
### 保留：将每日日志归一化为“事实”
Hindsight 在此的关键见解是：存储**叙事性的、自包含的事实**，而非细小的片段。

`memory/YYYY-MM-DD.md` 的实用规则：
- 在一天结束时（或期间），添加一个 `## Retain` 部分，包含 2–5 个要点，要求：
  - 具有叙事性（跨回合上下文得以保留）
  - 自包含（独立存在在日后仍有意义）
  - 标注类型 + 实体提及

示例：

```
## Retain
- W @Peter: Currently in Marrakech (Nov 27–Dec 1, 2025) for Andy’s birthday.
- B @warelay: I fixed the Baileys WS crash by wrapping connection.update handlers in try/catch (see memory/2025-11-27.md).
- O(c=0.95) @Peter: Prefers concise replies (&lt;1500 chars) on WhatsApp; long content goes into files.
```

最小解析：
- 类型前缀：`W`（世界）、`B`（经验/传记）、`O`（观点）、`S`（观察/摘要；通常由系统生成）
- 实体：`@Peter`、`@warelay` 等（别名映射到 `bank/entities/*.md`）
- 观点置信度：`O(c=0.0..1.0)` 可选

如果你不希望作者为此操心：反思作业可以从日志的其余部分推断出这些要点，但显式设置 `## Retain` 部分是最简单的“质量杠杆”。

### 回忆：对派生索引进行查询
回忆应支持：
- **词汇**：“查找精确术语 / 名称 / 命令”（FTS5）
- **实体**：“告诉我关于 X 的信息”（实体页面 + 实体关联的事实）
- **时间**：“11 月 27 日前后发生了什么” / “自上周以来”
- **观点**：“Peter 更喜欢什么？”（带置信度 + 证据）

返回格式应代理友好并引用来源：
- `kind`（`world|experience|opinion|observation`）
- `timestamp`（来源日期，或如有则提取时间范围）
- `entities`（`["Peter","warelay"]`）
- `content`（叙事性事实）
- `source`（`memory/2025-11-27.md#L12` 等）

### 反思：生成稳定页面 + 更新信念
反思是一项计划任务（每日或心跳 `ultrathink`），其作用是：
- 根据近期事实更新 `bank/entities/*.md`（实体摘要）
- 根据强化或矛盾更新 `bank/opinions.md` 的置信度
- 可选地提议对 `memory.md`（“核心”持久性事实）进行编辑

观点演变（简单、可解释）：
- 每个观点包括：
  - 声明
  - 置信度 `c ∈ [0,1]`
  - 最后更新时间
  - 证据链接（支持性和矛盾性事实 ID）
- 当新事实到达时：
  - 通过实体重叠 + 相似性找到候选观点（先用 FTS，再用嵌入）
  - 通过小幅增量更新置信度；大幅跃升需要强有力的矛盾证据 + 多次重复证据

## CLI 集成：独立与深度集成
建议：在 OpenClaw 中进行**深度集成**，但保留一个可分离的核心库。

### 为何要集成到 OpenClaw？
- OpenClaw 已经知道：
  - 工作区路径（`agents.defaults.workspace`）
  - 会话模型 + 心跳
  - 日志记录 + 故障排除模式
- 你希望代理本身调用这些工具：
  - `openclaw memory recall "…" --k 25 --since 30d`
  - `openclaw memory reflect --since 7d`

### 为何还要拆分一个库？
- 保持记忆逻辑在没有网关/运行时的情况下可测试
- 可在其他场景中复用（本地脚本、未来的桌面应用等）

形态：
记忆工具旨在成为一个小型 CLI + 库层，但这目前仅为探索性方案。

## “S-Collide” / SuCo：何时使用（研究）
如果“S-Collide”指的是 **SuCo（子空间碰撞）**：这是一种 ANN 检索方法，通过在子空间中使用学习的/结构化的碰撞来实现强召回与延迟之间的权衡（论文：arXiv 2411.14754，2024）。

针对 `~/.openclaw/workspace` 的务实建议：
- **不要一开始就使用** SuCo。
- 从 SQLite FTS +（可选）简单嵌入开始；你将立即获得大部分 UX 优势。
- 只有在以下情况下才考虑 SuCo/HNSW/ScaNN 类解决方案：
  - 语料库庞大（数万/数十万块）
  - 嵌入式暴力搜索变得过于缓慢
  - 召回质量明显受词汇搜索的限制

离线友好的替代方案（按复杂度递增）：
- SQLite FTS5 + 元数据过滤器（零 ML）
- 嵌入 + 暴力搜索（如果块数较少，效果出人意料地好）
- HNSW 索引（常见、稳健；需要库绑定）
- SuCo（研究级；如果有可靠的实现可供嵌入，则颇具吸引力）

开放问题：
- 对于你的设备（笔记本电脑 + 台式机），哪种**最佳**离线嵌入模型适用于“个人助理记忆”？
  - 如果你已经拥有 Ollama：使用本地模型进行嵌入；否则，在工具链中搭载一个小型嵌入模型。

## 最小可用试点
如果你想实现一个最小但仍然有用的版本：

- 在每日日志中添加 `bank/` 实体页面和一个 `## Retain` 部分。
- 使用 SQLite FTS 进行带有引用的回忆（路径 + 行号）。
- 仅在召回质量和规模有需求时才添加嵌入。

## 参考文献
- Letta / MemGPT 概念： “核心内存块” + “档案内存” + 工具驱动的自我编辑内存。
- Hindsight 技术报告： “保留 / 回忆 / 反思”，四网络内存，叙事性事实提取，观点置信度演变。
- SuCo： arXiv 2411.14754（2024）：“子空间碰撞”近似最近邻检索。

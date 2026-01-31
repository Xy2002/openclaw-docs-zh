---
summary: >-
  Deep dive: session store + transcripts, lifecycle, and (auto)compaction
  internals
read_when:
  - 'You need to debug session ids, transcript JSONL, or sessions.json fields'
  - >-
    You are changing auto-compaction behavior or adding “pre-compaction”
    housekeeping
  - You want to implement memory flushes or silent system turns
---
# 会话管理与压缩（深度解析）

本文档详细说明了 OpenClaw 如何端到端地管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪的内容
- **对话记录持久化**（`*.jsonl`）及其结构
- **对话记录清理**（在运行前针对特定提供商的修复操作）
- **上下文限制**（上下文窗口与已跟踪标记之间的关系）
- **压缩**（手动压缩 + 自动压缩）以及在压缩前可插入自定义逻辑的位置
- **静默后台维护**（例如，不应产生用户可见输出的内存写入操作）

如果您希望先了解更高层次的概览，请从以下内容开始：
- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 真实数据来源：网关

OpenClaw 的设计以单个 **网关进程** 为核心，该进程负责管理会话状态。

- UI（macOS 应用、Web 控制界面、TUI）应向网关查询会话列表和标记计数。
- 在远程模式下，会话文件位于远程主机上；“检查本地 Mac 文件”并不能反映网关正在使用的会话状态。

---

## 两层持久化机制

OpenClaw 使用两层机制来持久化会话：

1) **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 数据量小、可修改、安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、上次活动时间、开关设置、标记计数等）

2) **对话记录（`<sessionId>.jsonl`）**
   - 只能追加的树形结构对话记录（条目包含 `id` 和 `parentId`）
   - 存储实际对话内容、工具调用以及压缩摘要
   - 用于在后续回合中重建模型上下文

---

## 磁盘上的存储位置

对于每个代理，在网关主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 对话记录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 会话键（`sessionKey`）

一个 `sessionKey` 标识您处于 *哪个对话桶* 中（路由 + 隔离）。

常见模式：

- 主聊天/直接聊天（按代理划分）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/频道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- 定时任务：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/concepts/session) 中。

---

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向当前的 `sessionId`（继续对话的对话记录文件）。

经验法则：
- **重置**（`/new`、`/reset`）为该 `sessionKey` 创建一个新的 `sessionId`。
- **每日重置**（网关主机当地时间凌晨 4:00 默认设置）会在重置边界之后的下一条消息时创建一个新的 `sessionId`。
- **空闲超时**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）在空闲窗口后有新消息到达时创建一个新的 `sessionId`。当同时配置了每日重置和空闲超时时，先到期者优先。

实现细节：决策发生在 `initSessionState()` 中的 `src/auto-reply/reply/session.ts`。

---

## 会话存储模式（`sessions.json`）

存储的值类型是 `SessionEntry`，定义于 `src/config/sessions.ts`。

关键字段（不完全列举）：

- `sessionId`：当前对话记录 ID（文件名由此派生，除非设置了 `sessionFile`）
- `updatedAt`：上次活动时间戳
- `sessionFile`：可选的显式对话记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/频道标签的元数据
- 开关设置：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（会话级覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 标记计数（尽力而为，取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键已完成自动压缩的频率
- `memoryFlushAt`：最后一次压缩前内存刷新的时间戳
- `memoryFlushCompactionCount`：上次刷新时的压缩次数

存储可以安全编辑，但网关拥有最终决定权：随着会话的推进，网关可能会重写或重新填充条目。

---

## 对话记录结构（`*.jsonl`）

对话记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件格式为 JSONL：
- 第一行：会话头（`type: "session"`，包括 `id`、`cwd`、`timestamp`，可选 `parentSession`）
- 接下来：带有 `id` 和 `parentId`（树形结构）的会话条目

值得注意的条目类型：
- `message`：用户/助手/工具结果消息
- `custom_message`：注入的扩展消息，会进入模型上下文（可在 UI 中隐藏）
- `custom`：不会进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时的持久化摘要

OpenClaw 故意 **不** 对对话记录进行“修复”；网关使用 `SessionManager` 来读写对话记录。

---

## 上下文窗口与已跟踪标记

有两个不同的概念需要关注：

1) **模型上下文窗口**：每种模型的硬性上限（对模型可见的标记数）
2) **会话存储计数器**：写入 `sessions.json` 的滚动统计信息（用于 /status 和仪表板）

如果您正在调整限制：
- 上下文窗口来自模型目录（可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算值/报告值；请勿将其视为严格保证。

更多信息，请参阅 [/token-use](/token-use)。

---

## 压缩：其本质

压缩将较旧的对话摘要为对话记录中的一条持久化 `compaction` 条目，并保留最近的消息不变。

压缩完成后，未来的回合将看到：
- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是 **持久性的**（不同于会话修剪）。有关更多信息，请参阅 [/concepts/session-pruning](/concepts/session-pruning)。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 代理中，自动压缩在两种情况下触发：

1) **溢出恢复**：模型返回上下文溢出错误 → 压缩 → 重试。
2) **阈值维护**：在成功完成一轮后，满足以下条件时：

`contextTokens > contextWindow - reserveTokens`

其中：
- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示和下一次模型输出预留的余量

这些是 Pi 运行时语义（OpenClaw 消费事件，但 Pi 决定何时压缩）。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi 设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000
  }
}
```

OpenClaw 还为嵌入式运行强制实施安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会提高该值。
- 默认下限为 `20000` 个标记。
- 将 `agents.defaults.compaction.reserveTokensFloor: 0` 设置为禁用下限。
- 如果已经高于此值，OpenClaw 不会再做调整。

原因：在压缩变得不可避免之前，为多轮“后台维护”（如内存写入）留出足够的余量。

实现：`ensurePiCompactionReserveTokens()` 在 `src/agents/pi-settings.ts` 中
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 用户可见的界面

您可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩次数

---

## 精密后台维护（`NO_REPLY`）

OpenClaw 支持“静默”回合，用于后台任务，且用户不应看到中间输出。

约定：
- 助手在其输出开头使用 `NO_REPLY` 来指示“不要向用户发送回复”。
- OpenClaw 在交付层剥离或抑制此类输出。

截至 `2026.1.10`，OpenClaw 还会抑制 **草稿/打字流式传输**，当部分块以 `NO_REPLY` 开头时，这样静默操作就不会在回合中途泄露部分输出。

---

## 压缩前的“内存刷新”（已实现）

目标：在自动压缩发生之前，运行一个静默的代理回合，将持久状态写入磁盘（例如，代理工作区中的 `memory/YYYY-MM-DD.md`），以确保压缩不会擦除关键上下文。

OpenClaw 使用 **预阈值刷新** 方法：

1) 监控会话上下文使用情况。
2) 当使用量超过“软阈值”（低于 Pi 的压缩阈值）时，向代理发出一个静默的“立即写入内存”指令。
3) 使用 `NO_REPLY`，使用户看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：
- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷新回合的用户消息）
- `systemPrompt`（为刷新回合附加的额外系统提示）

注意事项：
- 默认提示/系统提示包含一个 `NO_REPLY` 提示，用于抑制交付。
- 每次压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅适用于嵌入式 Pi 会话（CLI 后端会跳过）。
- 当会话工作区为只读时（`workspaceAccess: "ro"` 或 `"none"`），会跳过刷新。
- 关于工作区文件布局和写入模式，请参阅 [Memory](/concepts/memory)。

Pi 还在扩展 API 中提供了一个 `session_before_compact` 钩子，但目前 OpenClaw 的刷新逻辑仍位于网关侧。

---

## 故障排除清单

- 会话键是否错误？请从 [/concepts/session](/concepts/session) 开始，确认 `sessionKey` 是否正确。
- 存储与对话记录是否不匹配？请确认网关主机和存储路径是否与 `openclaw status` 一致。
- 压缩过于频繁？请检查：
  - 模型上下文窗口（太小）
  - 压缩设置（如果 `reserveTokens` 对于模型窗口来说过高，可能导致更早的压缩）
  - 工具结果膨胀：启用/调整会话修剪
- 静默回合是否泄露？请确认回复是否以 `NO_REPLY`（确切标记）开头，并且您使用的是包含流式传输抑制修复的版本。

---
summary: 'Session management rules, keys, and persistence for chats'
read_when:
  - Modifying session handling or storage
---
# 会话管理

OpenClaw将**每位代理的一个直接聊天会话**视为主要会话。直接聊天会折叠为 `agent:<agentId>:<mainKey>`（默认 `main`），而群组或频道聊天则拥有各自的密钥。`session.mainKey` 会被尊重。

使用 `session.dmScope` 来控制如何对**直接消息**进行分组：

- `main`（默认）：所有 DM 共享主会话以保持连续性。
- `per-peer`：按发送者 ID 在不同频道间隔离。
- `per-channel-peer`：按频道 + 发送者隔离（推荐用于多用户收件箱）。
- `per-account-channel-peer`：按账户 + 频道 + 发送者隔离（推荐用于多账户收件箱）。

使用 `session.identityLinks` 将提供商前缀的对等 ID 映射到规范身份，以便在使用 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 时，同一个人在不同渠道之间共享同一个直接消息会话。

## 网关是事实来源

所有会话状态都由**网关**（“主”OpenClaw）拥有。UI 客户端（macOS 应用、WebChat 等）必须向网关查询会话列表和令牌计数，而不能直接读取本地文件。

- 在**远程模式**下，您关心的会话存储位于远程网关主机上，而不是您的 Mac 上。
- UI 中显示的令牌计数来自网关的存储字段（`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`）。客户端不会解析 JSONL 转录来“修正”总数。

## 状态存储位置

- 在**网关主机**上：
  - 存储文件：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（每个代理一个）。
- 转录：`~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`（Telegram 主题会话使用 `.../<SessionId>-topic-<threadId>.jsonl`）。
- 存储是一个映射 `sessionKey -> { sessionId, updatedAt, ... }`。删除条目是安全的；它们会按需重新创建。
- 群组条目可能包含 `displayName`、`channel`、`subject`、`room` 和 `space`，用于在 UI 中标记会话。
- 会话条目包含 `origin` 元数据（标签 + 路由提示），以便 UI 能够解释会话的来源。
- OpenClaw **不**读取旧的 Pi/Tau 会话文件夹。

## 会话修剪

默认情况下，OpenClaw 在调用 LLM 之前会从内存上下文中修剪**旧工具结果**。
这**不会**重写 JSONL 历史记录。请参阅 [/concepts/session-pruning](/concepts/session-pruning)。

## 压缩前的内存刷新

当会话接近自动压缩时，OpenClaw可以运行一次“无声内存刷新”，提醒模型将持久化笔记写入磁盘。此操作仅在工作区可写时运行。请参阅[内存](/concepts/memory)和[压缩](/concepts/compaction)。

## 运输方式 → 会话密钥的映射

- 直接聊天遵循 `session.dmScope`（默认 `main`）。
  - `main`：`agent:<agentId>:<mainKey>`（跨设备/频道的连续性）。
    - 多个电话号码和频道可以映射到同一个代理主密钥；它们充当进入同一对话的传输通道。
  - `per-peer`：`agent:<agentId>:dm:<peerId>`。
  - `per-channel-peer`：`agent:<agentId>:<channel>:dm:<peerId>`。
  - `per-account-channel-peer`：`agent:<agentId>:<channel>:<accountId>:dm:<peerId>`（accountId 默认为 `default`）。
  - 如果 `session.identityLinks` 与提供商前缀的对等 ID 匹配（例如 `telegram:123`），规范密钥将取代 `<peerId>`，以便同一个人在不同频道之间共享同一个会话。
- 群组聊天隔离状态：`agent:<agentId>:<channel>:group:<id>`（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
  - Telegram 论坛主题会在群组 ID 后附加 `:topic:<threadId>` 以实现隔离。
  - 旧的 `group:<id>` 密钥仍被识别，用于迁移。
- 入站上下文仍可能使用 `group:<id>`；频道从 `Provider` 推断，并归一化为规范的 `agent:<agentId>:<channel>:group:<id>` 形式。
- 其他来源：
  - 定时任务：`cron:<job.id>`
  - Webhook：`hook:<uuid>`（除非由 webhook 显式设置）
  - 节点运行：`node-<nodeId>`

## 生命周期

- 重置策略：会话将被重复使用，直到过期；过期将在下一个入站消息到达时进行评估。
- 每日重置：默认为**网关主机当地时间凌晨 4:00**。一旦会话的最后更新时间早于最近的每日重置时间，该会话即被视为过时。
- 空闲重置（可选）：`idleMinutes` 添加了一个滑动空闲窗口。当同时配置了每日和空闲重置时，**两者中先到期的一方**将强制启动新会话。
- 旧版仅空闲模式：如果您设置了 `session.idleMinutes` 而没有 `session.reset`/`resetByType` 配置，OpenClaw 将保持仅空闲模式以实现向后兼容性。
- 按类型覆盖（可选）：`resetByType` 允许您覆盖 `dm`、`group` 和 `thread` 会话的策略（线程 = Slack/Discord 线程、Telegram 主题、Matrix 线程，由连接器提供）。
- 按频道覆盖（可选）：`resetByChannel` 覆盖某个频道的重置策略（适用于该频道的所有会话类型，并优先于 `reset`/`resetByType`)。
- 重置触发器：精确的 `/new` 或 `/reset`（以及 `resetTriggers` 中的任何额外内容）会启动一个新的会话 ID，并将消息剩余部分传递下去。`/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配），以设置新的会话模型。如果单独发送 `/new` 或 `/reset`，OpenClaw 会运行一个简短的“你好”问候回合来确认重置。
- 手动重置：从存储中删除特定密钥或移除 JSONL 转录；下一个消息会重新创建它们。
- 隔离的定时任务每次运行时都会生成一个新的 `sessionId`（不重复使用空闲密钥）。

## 发送策略（可选）

在不列出单个ID的情况下，阻止特定会话类型的交付。

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } }
      ],
      default: "allow"
    }
  }
}
```

运行时覆盖（仅所有者）：

- `/send on` → 允许此会话
- `/send off` → 拒绝此会话
- `/send inherit` → 清除覆盖并使用配置规则

请将这些作为独立消息发送，以便生效。

## 配置（可选重命名示例）

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender",      // keep group keys separate
    dmScope: "main",          // DM continuity (set per-channel-peer/per-account-channel-peer for shared inboxes)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"]
    },
    reset: {
      // Defaults: mode=daily, atHour=4 (gateway host local time).
      // If you also set idleMinutes, whichever expires first wins.
      mode: "daily",
      atHour: 4,
      idleMinutes: 120
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      dm: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 }
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 }
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  }
}
```

## 检查

- `openclaw status` — 显示存储路径和最近会话。
- `openclaw sessions --json` — 转储所有条目（可用 `--active <minutes>` 进行筛选）。
- `openclaw gateway call sessions.list --params '{}'` — 从正在运行的网关获取会话（使用 `--url`/`--token` 进行远程网关访问）。
- 在聊天中发送 `/status` 作为独立消息，以查看代理是否可达、会话上下文的使用程度、当前思维/详细切换状态，以及您的 WhatsApp Web 凭证上次刷新的时间（有助于发现重新链接需求）。
- 发送 `/context list` 或 `/context detail` 以查看系统提示和注入的工作区文件中包含的内容（以及最大的上下文贡献者）。
- 发送 `/stop` 作为独立消息，以中止当前运行，清除该会话的排队后续任务，并停止由此产生的任何子代理运行（回复中包含已停止的任务数量）。
- 发送 `/compact`（可选指令）作为独立消息，以总结旧上下文并释放窗口空间。请参阅 [/concepts/compaction](/concepts/compaction)。
- JSONL 转录可以直接打开以审查完整回合。

## 提示

- 为主密钥保留一对一流量；让群组保留各自的密钥。
- 在进行自动化清理时，应删除单个密钥，而不是清空整个存储，以保留其他地方的上下文。

## 会话来源元数据

每个会话条目在 `origin` 中记录其来源（尽力而为）：

- `label`：人工标签（由对话标签 + 群组主题/频道推断得出）
- `provider`：归一化的频道 ID（包括扩展）
- `from`/`to`：来自入站信封的原始路由 ID
- `accountId`：提供商账户 ID（多账户时）
- `threadId`：频道支持时的线程/主题 ID

来源字段适用于直接消息、频道和群组。如果连接器仅更新交付路由（例如，为了保持 DM 主会话的新鲜），它仍应提供入站上下文，以便会话保留其解释性元数据。扩展可以通过在入站上下文中发送 `ConversationLabel`、`GroupSubject`、`GroupChannel`、`GroupSpace` 和 `SenderName`，并调用 `recordSessionMetaFromInbound`（或将相同上下文传递给 `updateLastRoute`）来实现这一点。
